import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { deals, kycRequests, organizations, alerts, users, type Organization } from "@/lib/db/schema";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { audit, type Actor } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { kycInviteEmail, kycSubmittedEmail } from "@/lib/email/templates";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";
import { isCountryCode } from "@/lib/countries";
import { actorOf, DomainError, getDeal, recomputeRisk, setDealStatus, type Ctx } from "./service";
import { addParty } from "./parties";
import { assertStorageReady, storeDocument, validateUpload } from "./documents";

const KYC_LINK_DAYS = 14;

export async function createKycRequest(
  ctx: Ctx,
  dealId: string,
  input: { recipientName: string; recipientEmail: string | null; message: string | null; send: boolean },
) {
  const db = await getDb();
  const deal = await getDeal(ctx.org.id, dealId);
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + KYC_LINK_DAYS * 86_400_000);
  const [req] = await db
    .insert(kycRequests)
    .values({
      orgId: ctx.org.id,
      dealId,
      tokenHash: sha256Hex(token),
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      message: input.message,
      expiresAt,
      createdBy: ctx.user.id,
    })
    .returning();
  const link = `${config.appUrl}/kyc/${token}`;
  if (input.send && input.recipientEmail) {
    const tpl = kycInviteEmail({ recipientName: input.recipientName, orgName: ctx.org.name, reference: deal.reference, message: input.message, link, expires: expiresAt });
    await sendEmail({ ...tpl, to: input.recipientEmail, orgId: ctx.org.id }, { forceOutbox: ctx.org.isDemo });
  }
  await setDealStatus(ctx.org.id, dealId, ["draft"], "collecting");
  await audit(ctx.org.id, actorOf(ctx), "kyc.requested", { recipient: input.recipientName, emailed: !!(input.send && input.recipientEmail) }, { dealId, ip: ctx.ip });
  await track("kyc_link_sent", { emailed: input.send }, { orgId: ctx.org.id, userId: ctx.user.id, isDemo: ctx.org.isDemo });
  return { request: req, link };
}

export async function revokeKycRequest(ctx: Ctx, requestId: string) {
  const db = await getDb();
  const [req] = await db
    .update(kycRequests)
    .set({ status: "revoked" })
    .where(and(eq(kycRequests.id, requestId), eq(kycRequests.orgId, ctx.org.id)))
    .returning();
  if (!req) throw new DomainError("Request not found");
  await audit(ctx.org.id, actorOf(ctx), "kyc.revoked", { recipient: req.recipientName }, { dealId: req.dealId, ip: ctx.ip });
}

/** Looks up an open request by its raw token. Returns null for unknown, revoked, used or expired links. */
export async function findOpenKycRequest(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const db = await getDb();
  const [row] = await db
    .select({ request: kycRequests, deal: deals, org: organizations })
    .from(kycRequests)
    .innerJoin(deals, eq(kycRequests.dealId, deals.id))
    .innerJoin(organizations, eq(kycRequests.orgId, organizations.id))
    .where(eq(kycRequests.tokenHash, sha256Hex(token)))
    .limit(1);
  if (!row) return null;
  if (row.request.status === "revoked" || row.request.status === "submitted") return { ...row, closed: row.request.status as "revoked" | "submitted" };
  if (row.request.expiresAt < new Date()) return { ...row, closed: "expired" as const };
  return { ...row, closed: null };
}

export async function markKycOpened(requestId: string, orgId: string, dealId: string, ip: string) {
  const db = await getDb();
  const [req] = await db
    .update(kycRequests)
    .set({ status: "opened", openedAt: new Date() })
    .where(and(eq(kycRequests.id, requestId), eq(kycRequests.status, "sent")))
    .returning();
  if (req) await audit(orgId, { type: "client", label: req.recipientName }, "kyc.opened", {}, { dealId, ip });
}

// ── Client submission ─────────────────────────────────────────────────────────
const country = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => isCountryCode(v), "Select a country");
const optCountry = z
  .string()
  .trim()
  .toUpperCase()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || isCountryCode(v), "Select a country");
const date = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD");
const text = (max: number) => z.string().trim().max(max);
const name = z.string().trim().min(2, "Required").max(160);

const personSchema = z.object({
  fullName: name,
  dateOfBirth: date,
  nationality: country,
  residenceCountry: country,
  address: text(400).optional(),
  idDocType: text(40).optional(),
  idDocNumber: text(60).optional(),
  idDocExpiry: date,
  pep: z.boolean().default(false),
  pepDetails: text(500).optional(),
});

const ownerSchema = personSchema.extend({
  ownershipPct: z.coerce.number().min(0).max(100).optional(),
  controlType: text(120).optional(),
  ownsVia: z.coerce.number().int().min(-1).max(10).default(-1), // -1 = buyer entity, n = intermediates[n]
});

export const kycSubmissionSchema = z
  .object({
    submitter: z.object({
      name,
      email: z.email("Enter a valid email").max(200),
      role: z.enum(["principal", "lawyer", "family_office", "captain_or_manager", "other"]),
      organisation: text(160).optional(),
    }),
    buyerKind: z.enum(["person", "entity"]),
    buyerPerson: personSchema.optional(),
    buyerEntity: z
      .object({
        name,
        registrationNumber: text(80).optional(),
        jurisdiction: country,
        entityType: z.enum(["company", "trust", "foundation", "partnership", "other"]),
        address: text(400).optional(),
      })
      .optional(),
    intermediates: z
      .array(z.object({ name, jurisdiction: country, entityType: z.enum(["company", "trust", "foundation", "partnership", "other"]) }))
      .max(6)
      .default([]),
    owners: z.array(ownerSchema).max(12).default([]),
    funds: z.object({
      paymentMethod: z.enum(["wire", "escrow", "crypto", "cash", "mixed"]),
      payerIsBuyer: z.boolean(),
      payerName: text(160).optional(),
      payerKind: z.enum(["person", "entity"]).optional(),
      payerCountry: optCountry,
      fundsOriginCountry: country,
      sourceOfFunds: z.string().trim().min(10, "Describe where the purchase funds come from").max(2000),
      sourceOfWealth: z.string().trim().min(10, "Describe how the buyer's overall wealth was generated").max(2000),
    }),
    purpose: z.enum(["private_use", "commercial_charter", "other"]),
    purposeDetails: text(500).optional(),
    declarations: z.object({ accurate: z.literal(true, "Please confirm"), consent: z.literal(true, "Please confirm") }),
  })
  .superRefine((v, ctx) => {
    if (v.buyerKind === "person" && !v.buyerPerson) ctx.addIssue({ code: "custom", path: ["buyerPerson"], message: "Buyer details are required" });
    if (v.buyerKind === "entity" && !v.buyerEntity) ctx.addIssue({ code: "custom", path: ["buyerEntity"], message: "Entity details are required" });
    if (v.buyerKind === "entity" && v.owners.length === 0) ctx.addIssue({ code: "custom", path: ["owners"], message: "Add at least one beneficial owner" });
    if (!v.funds.payerIsBuyer && !v.funds.payerName) ctx.addIssue({ code: "custom", path: ["funds", "payerName"], message: "Name the paying party" });
    v.owners.forEach((o, i) => {
      if (o.ownsVia >= v.intermediates.length) ctx.addIssue({ code: "custom", path: ["owners", i, "ownsVia"], message: "Invalid link" });
    });
  });

export type KycSubmission = z.infer<typeof kycSubmissionSchema>;

export type KycFile = { name: string; bytes: Buffer; category: string; partyKey: string };

export async function submitKyc(token: string, data: KycSubmission, files: KycFile[], ip: string) {
  const found = await findOpenKycRequest(token);
  if (!found || found.closed) throw new DomainError("This link is no longer valid. Please ask your broker for a new one.");
  const { request, deal, org } = found;
  const db = await getDb();

  // Validate everything that can fail before writing anything.
  for (const f of files) validateUpload(f);
  if (files.length) assertStorageReady(org);

  // Claim the request first so a double-submit cannot create duplicate parties.
  const claimed = await db
    .update(kycRequests)
    .set({ status: "submitted", submittedAt: new Date(), submission: { ...data, files: files.map((f) => ({ name: f.name, category: f.category, partyKey: f.partyKey })) } })
    .where(and(eq(kycRequests.id, request.id), eq(kycRequests.tokenHash, sha256Hex(token))))
    .returning({ id: kycRequests.id });
  if (!claimed.length) throw new DomainError("This link is no longer valid.");

  const actor: Actor = { type: "client", label: `${data.submitter.name} (client portal)` };
  const partyKeys = new Map<string, string>();
  const common = { screenNow: true, recompute: false, source: "client_portal", ip } as const;

  const rep = data.submitter.role === "principal" ? null : await addParty(org, deal.id, { role: "representative", kind: "person", fullName: data.submitter.name, email: data.submitter.email }, actor, common);
  if (rep) partyKeys.set("representative", rep.id);

  if (data.buyerKind === "person" && data.buyerPerson) {
    const b = data.buyerPerson;
    const buyer = await addParty(
      org,
      deal.id,
      {
        role: "buyer",
        kind: "person",
        fullName: b.fullName,
        dateOfBirth: b.dateOfBirth,
        nationality: b.nationality,
        residenceCountry: b.residenceCountry,
        address: b.address,
        idDocType: b.idDocType,
        idDocNumber: b.idDocNumber,
        idDocExpiry: b.idDocExpiry,
        pepStatus: b.pep ? "declared" : "none",
        pepDetails: b.pepDetails,
        sourceOfFunds: data.funds.sourceOfFunds,
        sourceOfWealth: data.funds.sourceOfWealth,
      },
      actor,
      common,
    );
    partyKeys.set("buyer", buyer.id);
  } else if (data.buyerEntity) {
    const e = data.buyerEntity;
    const buyer = await addParty(
      org,
      deal.id,
      {
        role: "buyer",
        kind: "entity",
        fullName: e.name,
        registrationNumber: e.registrationNumber,
        jurisdiction: e.jurisdiction,
        entityType: e.entityType,
        address: e.address,
        sourceOfFunds: data.funds.sourceOfFunds,
        sourceOfWealth: data.funds.sourceOfWealth,
      },
      actor,
      common,
    );
    partyKeys.set("buyer", buyer.id);
    // Intermediates form a chain: buyer ← intermediates[0] ← intermediates[1] ...
    let parentId = buyer.id;
    for (const [i, im] of data.intermediates.entries()) {
      const p = await addParty(org, deal.id, { role: "intermediate", kind: "entity", fullName: im.name, jurisdiction: im.jurisdiction, entityType: im.entityType, parentPartyId: parentId }, actor, common);
      partyKeys.set(`intermediate:${i}`, p.id);
      parentId = p.id;
    }
  }

  for (const [i, o] of data.owners.entries()) {
    const parentPartyId = data.buyerKind === "entity" ? (o.ownsVia >= 0 ? partyKeys.get(`intermediate:${o.ownsVia}`) : partyKeys.get("buyer")) : null;
    const p = await addParty(
      org,
      deal.id,
      {
        role: "beneficial_owner",
        kind: "person",
        fullName: o.fullName,
        dateOfBirth: o.dateOfBirth,
        nationality: o.nationality,
        residenceCountry: o.residenceCountry,
        address: o.address,
        idDocType: o.idDocType,
        idDocNumber: o.idDocNumber,
        idDocExpiry: o.idDocExpiry,
        ownershipPct: o.ownershipPct ?? null,
        controlType: o.controlType,
        pepStatus: o.pep ? "declared" : "none",
        pepDetails: o.pepDetails,
        parentPartyId: parentPartyId ?? null,
      },
      actor,
      common,
    );
    partyKeys.set(`owner:${i}`, p.id);
  }

  if (!data.funds.payerIsBuyer && data.funds.payerName) {
    const kind = data.funds.payerKind ?? "entity";
    const payer = await addParty(
      org,
      deal.id,
      { role: "payer", kind, fullName: data.funds.payerName, residenceCountry: kind === "person" ? data.funds.payerCountry : undefined, jurisdiction: kind === "entity" ? data.funds.payerCountry : undefined },
      actor,
      common,
    );
    partyKeys.set("payer", payer.id);
  }

  await db
    .update(deals)
    .set({
      paymentMethod: data.funds.paymentMethod,
      thirdPartyPayer: !data.funds.payerIsBuyer,
      fundsOriginCountry: data.funds.fundsOriginCountry,
      useType: data.purpose === "commercial_charter" ? "commercial" : "non_commercial",
      updatedAt: new Date(),
    })
    .where(eq(deals.id, deal.id));

  for (const f of files) {
    await storeDocument(org, deal.id, { name: f.name, bytes: f.bytes }, { category: f.category, partyId: partyKeys.get(f.partyKey) ?? null }, actor, `client:${request.id}`, { recompute: false, ip });
  }

  await audit(org.id, actor, "kyc.submitted", { parties: partyKeys.size, documents: files.length }, { dealId: deal.id, ip });
  await setDealStatus(org.id, deal.id, ["draft", "collecting"], "review");
  await recomputeRisk(org, deal.id);
  await db.insert(alerts).values({
    orgId: org.id,
    dealId: deal.id,
    type: "kyc_submitted",
    severity: "info",
    title: `KYC received for ${deal.reference}`,
    body: `${data.submitter.name} submitted ${partyKeys.size} parties and ${files.length} documents.`,
  });
  await notifyFirm(org, deal.id, deal.reference, deal.assetName, data.submitter.name, deal.createdBy);
  await track("kyc_submitted", { documents: files.length, parties: partyKeys.size }, { orgId: org.id, isDemo: org.isDemo });
}

async function notifyFirm(org: Organization, dealId: string, reference: string, assetName: string, submitter: string, createdBy: string | null) {
  const db = await getDb();
  let to = org.complianceOfficerEmail;
  if (!to && createdBy) {
    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, createdBy)).limit(1);
    to = u?.email ?? null;
  }
  if (!to) return;
  const tpl = kycSubmittedEmail({ orgName: org.name, reference, assetName, submitter, link: `${config.appUrl}/app/deals/${dealId}` });
  await sendEmail({ ...tpl, to, orgId: org.id }, { forceOutbox: org.isDemo });
}
