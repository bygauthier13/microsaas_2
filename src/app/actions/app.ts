"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { alerts, authTokens, organizations, users } from "@/lib/db/schema";
import { requireUser, type CurrentUser } from "@/lib/auth/session";
import { canWrite } from "@/lib/billing/access";
import { planLimits } from "@/lib/billing/plans";
import { clientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";
import { hashPassword, randomToken, sha256Hex } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { inviteEmail } from "@/lib/email/templates";
import { config } from "@/lib/config";
import { isCountryCode } from "@/lib/countries";
import { ASSET_TYPES, CURRENCIES } from "@/lib/risk/thresholds";
import { DOC_CATEGORIES } from "@/lib/risk/engine";
import { BUSINESS_TYPES } from "@/lib/format";
import { completeDeal, createDeal, decideDeal, DomainError, updateDeal, type Ctx, type DealInput } from "@/lib/deals/service";
import { addParty, removeParty, resolveScreening, screenDeal, setMonitoring } from "@/lib/deals/parties";
import { storeDocument, verifyDocument } from "@/lib/deals/documents";
import { createKycRequest, revokeKycRequest } from "@/lib/deals/kyc";
import { markReportSubmitted, prepareReport } from "@/lib/deals/report";
import { checkbox, formObject, guard, invalid, optCountry, optDate, optText, type ActionResult } from "@/lib/actions-util";

async function ctx(opts: { write?: boolean; allowUnonboarded?: boolean } = {}): Promise<Ctx & CurrentUser> {
  const current = await requireUser({ allowUnonboarded: opts.allowUnonboarded });
  if (opts.write && !canWrite(current.org)) {
    throw new DomainError("Your trial has ended. Choose a plan to open new files — your existing files stay available to view and export.");
  }
  return { ...current, ip: await clientIp() };
}

const dealPath = (id: string) => `/app/deals/${id}`;

// ── Onboarding ─────────────────────────────────────────────────────────────
const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Enter your firm's name").max(160),
  country: z.string().refine(isCountryCode, "Select the country where you are established"),
  businessType: z.string().refine((v) => v in BUSINESS_TYPES, "Select your business type"),
  registrationNumber: optText(80),
  complianceOfficerName: z.string().trim().min(2, "Name the person responsible for AML compliance").max(120),
  complianceOfficerEmail: z.email("Enter a valid email").max(200),
});

export async function completeOnboarding(_: ActionResult, form: FormData): Promise<ActionResult> {
  const c = await ctx({ allowUnonboarded: true });
  const parsed = onboardingSchema.safeParse(formObject(form));
  if (!parsed.success) return invalid(parsed.error);
  const activities = form.getAll("activities").map(String).filter((a) => ["sales", "charter", "new_build", "refit", "management"].includes(a));
  const db = await getDb();
  await db
    .update(organizations)
    .set({ ...parsed.data, activities, onboardedAt: c.org.onboardedAt ?? new Date() })
    .where(eq(organizations.id, c.org.id));
  if (!c.org.onboardedAt) await track("onboarding_completed", { businessType: parsed.data.businessType, country: parsed.data.country }, { orgId: c.org.id, userId: c.user.id });
  redirect("/app?welcome=1");
}

// ── Deals ──────────────────────────────────────────────────────────────────
const dealSchema = z.object({
  assetType: z.enum(Object.keys(ASSET_TYPES) as [string, ...string[]]),
  assetName: z.string().trim().min(2, "Name the asset (e.g. M/Y AURELIA — 52m Benetti)").max(160),
  builder: optText(80),
  model: optText(80),
  year: optText(10),
  lengthM: optText(10),
  flag: optText(60),
  imo: optText(40),
  hin: optText(40),
  registration: optText(40),
  vin: optText(40),
  msn: optText(40),
  transactionType: z.enum(["sale", "charter", "new_build"]),
  ourRole: z.enum(["seller_broker", "buyer_broker", "central_agent", "charter_broker", "dealer", "shipyard"]),
  useType: z.enum(["non_commercial", "commercial", "unknown"]),
  priceAmount: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v.replace(/[^\d.]/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v < 1e12), "Enter a valid amount"),
  currency: z.string().refine((v) => CURRENCIES.includes(v), "Unsupported currency"),
  paymentMethod: z.enum(["unknown", "wire", "escrow", "crypto", "cash", "mixed"]),
  thirdPartyPayer: checkbox,
  fundsOriginCountry: optCountry,
  expectedClosing: optDate,
  unusualUrgency: checkbox,
  priceAnomaly: checkbox,
  nomineeOrBearer: checkbox,
  cashComponentEur: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0) : 0)),
});

function toDealInput(d: z.infer<typeof dealSchema>): DealInput {
  return {
    assetType: d.assetType,
    assetName: d.assetName,
    assetDetails: Object.fromEntries(
      Object.entries({ builder: d.builder, model: d.model, year: d.year, lengthM: d.lengthM, flag: d.flag, imo: d.imo, hin: d.hin, registration: d.registration, vin: d.vin, msn: d.msn }).filter(
        ([, v]) => v,
      ),
    ),
    transactionType: d.transactionType,
    ourRole: d.ourRole,
    useType: d.useType,
    priceAmount: d.priceAmount,
    currency: d.currency,
    paymentMethod: d.paymentMethod,
    thirdPartyPayer: d.thirdPartyPayer,
    fundsOriginCountry: d.fundsOriginCountry,
    expectedClosing: d.expectedClosing,
    flags: { unusualUrgency: d.unusualUrgency, priceAnomaly: d.priceAnomaly, nomineeOrBearer: d.nomineeOrBearer, cashComponentEur: d.cashComponentEur || undefined },
  };
}

export async function createDealAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  let id = "";
  const res = await guard(async () => {
    const c = await ctx({ write: true });
    const parsed = dealSchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    const deal = await createDeal(c, toDealInput(parsed.data));
    await track("deal_created", { assetType: deal.assetType, priceEur: deal.priceEur }, { orgId: c.org.id, userId: c.user.id, isDemo: c.org.isDemo });
    id = deal.id;
  });
  if (id) redirect(`${dealPath(id)}?created=1`);
  return res;
}

export async function updateDealAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const parsed = dealSchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    await updateDeal(c, dealId, toDealInput(parsed.data));
    revalidatePath(dealPath(dealId));
    return { ok: true, message: "Deal updated and re-scored." };
  });
}

// ── Parties & screening ────────────────────────────────────────────────────
const partySchema = z.object({
  role: z.enum(["buyer", "seller", "beneficial_owner", "intermediate", "representative", "payer", "director", "trustee", "other"]),
  kind: z.enum(["person", "entity"]),
  fullName: z.string().trim().min(2, "Enter the full legal name").max(160),
  parentPartyId: optText(60),
  ownershipPct: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (v >= 0 && v <= 100), "0–100"),
  controlType: optText(120),
  dateOfBirth: optDate,
  nationality: optCountry,
  residenceCountry: optCountry,
  jurisdiction: optCountry,
  entityType: optText(20),
  registrationNumber: optText(80),
  idDocType: optText(40),
  idDocNumber: optText(60),
  idDocExpiry: optDate,
  pep: checkbox,
  pepDetails: optText(500),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || z.email().safeParse(v).success, "Invalid email"),
});

export async function addPartyAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const parsed = partySchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    const { pep, ...rest } = parsed.data;
    await addParty(c.org, dealId, { ...rest, pepStatus: pep ? "declared" : "none" }, { type: "user", id: c.user.id, label: c.user.name }, { ip: c.ip });
    revalidatePath(dealPath(dealId));
    return { ok: true, message: `${parsed.data.fullName} added and screened.` };
  });
}

export async function removePartyAction(dealId: string, partyId: string): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    await removeParty(c, partyId);
    revalidatePath(dealPath(dealId));
  });
}

export async function toggleMonitoringAction(dealId: string, partyId: string, monitored: boolean): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    if (monitored) {
      const limit = planLimits(c.org.plan).monitoredParties;
      const db = await getDb();
      const { parties } = await import("@/lib/db/schema");
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(parties).where(and(eq(parties.orgId, c.org.id), eq(parties.monitored, true)));
      if (limit != null && !c.org.isDemo && n >= limit) throw new DomainError(`Your plan monitors up to ${limit} parties. Upgrade to monitor more.`);
    }
    await setMonitoring(c, partyId, monitored);
    revalidatePath(dealPath(dealId));
  });
}

export async function screenDealAction(dealId: string): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    if (!rateLimit(`screen:${c.org.id}`, 30, 60 * 60_000).ok) throw new DomainError("Screening limit reached for this hour.");
    await screenDeal(c, dealId);
    revalidatePath(dealPath(dealId));
    return { ok: true, message: "All parties re-screened." };
  });
}

const resolveSchema = z.object({
  screeningId: z.string().min(10).max(60),
  resolution: z.enum(["false_positive", "true_match"]),
  note: z.string().trim().min(10, "Explain your conclusion (at least 10 characters)").max(1000),
});

export async function resolveScreeningAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const parsed = resolveSchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    await resolveScreening(c, parsed.data.screeningId, parsed.data.resolution, parsed.data.note);
    revalidatePath(dealPath(dealId));
    return { ok: true };
  });
}

// ── Client KYC links ───────────────────────────────────────────────────────
const kycSchema = z.object({
  recipientName: z.string().trim().min(2, "Who will complete the file?").max(120),
  recipientEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || z.email().safeParse(v).success, "Invalid email"),
  message: optText(1000),
  send: checkbox,
});

export async function createKycAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const parsed = kycSchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    if (parsed.data.send && !parsed.data.recipientEmail) return { fieldErrors: { recipientEmail: "Add an email to send the link" } };
    const { link } = await createKycRequest(c, dealId, parsed.data);
    revalidatePath(dealPath(dealId));
    return { ok: true, link, message: parsed.data.send ? `Link emailed to ${parsed.data.recipientEmail}.` : "Link created — copy it below." };
  });
}

export async function revokeKycAction(dealId: string, requestId: string): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    await revokeKycRequest(c, requestId);
    revalidatePath(dealPath(dealId));
  });
}

// ── Documents ──────────────────────────────────────────────────────────────
export async function uploadDocumentAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const category = String(form.get("category") ?? "");
    const partyId = String(form.get("partyId") ?? "") || null;
    if (!DOC_CATEGORIES[category]) return { fieldErrors: { category: "Choose a category" } };
    const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return { fieldErrors: { file: "Choose a file to upload" } };
    if (files.length > 10) return { fieldErrors: { file: "Upload up to 10 files at a time" } };
    for (const f of files) {
      await storeDocument(c.org, dealId, { name: f.name, bytes: Buffer.from(await f.arrayBuffer()) }, { category, partyId }, { type: "user", id: c.user.id, label: c.user.name }, `user:${c.user.id}`, { ip: c.ip });
    }
    revalidatePath(dealPath(dealId));
    return { ok: true, message: `${files.length} document${files.length > 1 ? "s" : ""} uploaded and encrypted.` };
  });
}

export async function verifyDocumentAction(dealId: string, documentId: string): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    await verifyDocument(c, documentId);
    revalidatePath(dealPath(dealId));
  });
}

// ── Decision, completion, Article 74 ───────────────────────────────────────
export async function decideAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const decision = form.get("decision") === "rejected" ? "rejected" : "approved";
    await decideDeal(c, dealId, decision, String(form.get("note") ?? ""));
    await track("deal_decided", { decision }, { orgId: c.org.id, userId: c.user.id, isDemo: c.org.isDemo });
    revalidatePath(dealPath(dealId));
    return { ok: true };
  });
}

export async function completeDealAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const date = optDate.parse(String(form.get("completedOn") ?? ""));
    if (!date) return { fieldErrors: { completedOn: "Enter the completion date" } };
    await completeDeal(c, dealId, date);
    revalidatePath(dealPath(dealId));
    return { ok: true };
  });
}

export async function prepareReportAction(dealId: string): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    await prepareReport(c, dealId);
    revalidatePath(dealPath(dealId));
  });
}

export async function submitReportAction(dealId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    const reference = String(form.get("reference") ?? "").trim().slice(0, 120);
    const submittedOn = optDate.parse(String(form.get("submittedOn") ?? ""));
    if (reference.length < 3) return { fieldErrors: { reference: "Enter the FIU acknowledgement reference" } };
    if (!submittedOn) return { fieldErrors: { submittedOn: "Enter the submission date" } };
    await markReportSubmitted(c, dealId, reference, submittedOn);
    revalidatePath(dealPath(dealId));
    return { ok: true };
  });
}

export async function markAlertsReadAction(): Promise<void> {
  const c = await ctx();
  const db = await getDb();
  await db.update(alerts).set({ readAt: new Date() }).where(and(eq(alerts.orgId, c.org.id), isNull(alerts.readAt)));
  revalidatePath("/app");
}

// ── Settings & team ────────────────────────────────────────────────────────
const settingsSchema = onboardingSchema.extend({
  reportDeadlineDays: z.coerce.number().int().min(1).max(365).default(30),
  extraHighRiskCountries: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/[\s,;]+/)
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s && isCountryCode(s)),
    ),
});

export async function updateSettingsAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx();
    if (!["owner", "admin"].includes(c.user.role)) throw new DomainError("Only owners and admins can change firm settings.");
    const parsed = settingsSchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    const { reportDeadlineDays, extraHighRiskCountries, ...rest } = parsed.data;
    const db = await getDb();
    await db
      .update(organizations)
      .set({ ...rest, settings: { ...c.org.settings, reportDeadlineDays, extraHighRiskCountries } })
      .where(eq(organizations.id, c.org.id));
    revalidatePath("/app/settings");
    return { ok: true, message: "Settings saved. New risk lists apply the next time a deal is scored." };
  });
}

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.email("Enter a valid email").max(200).transform((v) => v.toLowerCase()),
  role: z.enum(["admin", "member"]),
});

export async function inviteMemberAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    if (!["owner", "admin"].includes(c.user.role)) throw new DomainError("Only owners and admins can invite teammates.");
    const parsed = inviteSchema.safeParse(formObject(form));
    if (!parsed.success) return invalid(parsed.error);
    const db = await getDb();
    const seats = planLimits(c.org.plan).seats;
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.orgId, c.org.id));
    if (seats != null && n >= seats) throw new DomainError(`Your plan includes ${seats} seat${seats > 1 ? "s" : ""}. Upgrade to add teammates.`);
    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (exists) return { fieldErrors: { email: "This person already has an Ensign account." } };
    const [user] = await db
      .insert(users)
      .values({ orgId: c.org.id, email: parsed.data.email, name: parsed.data.name, role: parsed.data.role, passwordHash: await hashPassword(randomToken(24)), isDemo: c.org.isDemo })
      .returning();
    const token = randomToken(32);
    await db.insert(authTokens).values({ id: sha256Hex(token), userId: user.id, purpose: "invite", expiresAt: new Date(Date.now() + 7 * 86_400_000) });
    const tpl = inviteEmail(user.name, c.org.name, c.user.name, `${config.appUrl}/reset-password?token=${token}&invite=1`);
    await sendEmail({ ...tpl, to: user.email, orgId: c.org.id }, { forceOutbox: c.org.isDemo });
    revalidatePath("/app/settings");
    return { ok: true, message: `Invitation sent to ${user.email}.` };
  });
}

export async function runMonitoringNowAction(): Promise<ActionResult> {
  return guard(async () => {
    const c = await ctx({ write: true });
    if (!rateLimit(`monitor-now:${c.org.id}`, 6, 60 * 60_000).ok) throw new DomainError("You can run monitoring manually up to 6 times per hour.");
    const { runOrgMonitoring } = await import("@/lib/deals/parties");
    const res = await runOrgMonitoring(c);
    revalidatePath("/app/monitoring");
    return { ok: true, message: `Re-screened ${res.screened} parties · ${res.matches} with open potential matches.` };
  });
}
