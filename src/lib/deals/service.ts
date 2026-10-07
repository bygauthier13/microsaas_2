import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditEvents,
  deals,
  documents,
  kycRequests,
  organizations,
  parties,
  screenings,
  thresholdReports,
  type AssetDetails,
  type Deal,
  type DealFlags,
  type Organization,
  type Party,
  type User,
} from "@/lib/db/schema";
import { audit, type Actor } from "@/lib/audit";
import { computeRisk, type RiskResult } from "@/lib/risk/engine";
import { toEur } from "@/lib/risk/thresholds";
import { planLimits } from "@/lib/billing/plans";
import { EU_MEMBER_STATES } from "@/lib/countries";
import { FIU_BY_COUNTRY } from "@/lib/risk/lists";

export type Ctx = { user: User; org: Organization; ip?: string | null };

export const ASSET_DETAIL_LABELS: Record<string, string> = {
  builder: "Builder / make",
  model: "Model",
  year: "Year",
  lengthM: "Length (m)",
  flag: "Flag",
  imo: "IMO / HIN",
  hin: "HIN",
  registration: "Registration",
  vin: "VIN",
  msn: "Serial (MSN)",
  notes: "Notes",
};

export class DomainError extends Error {}

export const actorOf = (ctx: Ctx): Actor => ({ type: "user", id: ctx.user.id, label: ctx.user.name });

export const CLOSED_STATUSES = ["completed", "rejected", "aborted"];

async function nextReference(orgId: string): Promise<string> {
  const db = await getDb();
  const [row] = await db
    .update(organizations)
    .set({ dealCounter: sql`${organizations.dealCounter} + 1` })
    .where(eq(organizations.id, orgId))
    .returning({ n: organizations.dealCounter });
  const year = new Date().getUTCFullYear();
  return `ENS-${year}-${String(row.n).padStart(4, "0")}`;
}

export type DealInput = {
  assetType: string;
  assetName: string;
  assetDetails: AssetDetails;
  transactionType: string;
  ourRole: string;
  useType: string;
  priceAmount: number | null;
  currency: string;
  paymentMethod: string;
  thirdPartyPayer: boolean;
  fundsOriginCountry: string | null;
  expectedClosing: string | null;
  flags: DealFlags;
};

export async function countActiveDeals(orgId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(deals)
    .where(and(eq(deals.orgId, orgId), notInArray(deals.status, CLOSED_STATUSES)));
  return row?.n ?? 0;
}

export async function createDeal(ctx: Ctx, input: DealInput): Promise<Deal> {
  const limit = planLimits(ctx.org.plan).activeDeals;
  if (limit != null && !ctx.org.isDemo && (await countActiveDeals(ctx.org.id)) >= limit) {
    throw new DomainError(`Your plan includes ${limit} active deal files. Close a deal or upgrade to Brokerage for unlimited files.`);
  }
  const db = await getDb();
  const reference = await nextReference(ctx.org.id);
  const [deal] = await db
    .insert(deals)
    .values({
      ...input,
      orgId: ctx.org.id,
      reference,
      priceEur: toEur(input.priceAmount, input.currency),
      createdBy: ctx.user.id,
    })
    .returning();
  await audit(ctx.org.id, actorOf(ctx), "deal.created", { reference, assetName: input.assetName }, { dealId: deal.id, ip: ctx.ip });
  await recomputeRisk(ctx.org, deal.id, { silent: true });
  return deal;
}

export async function updateDeal(ctx: Ctx, dealId: string, input: DealInput) {
  const db = await getDb();
  const deal = await getDeal(ctx.org.id, dealId);
  await db
    .update(deals)
    .set({ ...input, priceEur: toEur(input.priceAmount, input.currency), updatedAt: new Date() })
    .where(and(eq(deals.id, deal.id), eq(deals.orgId, ctx.org.id)));
  await audit(ctx.org.id, actorOf(ctx), "deal.updated", {}, { dealId, ip: ctx.ip });
  return recomputeRisk(ctx.org, dealId);
}

export async function getDeal(orgId: string, dealId: string): Promise<Deal> {
  const db = await getDb();
  const [deal] = await db.select().from(deals).where(and(eq(deals.id, dealId), eq(deals.orgId, orgId))).limit(1);
  if (!deal) throw new DomainError("Deal not found");
  return deal;
}

export async function listDeals(orgId: string) {
  const db = await getDb();
  const rows = await db.select().from(deals).where(eq(deals.orgId, orgId)).orderBy(desc(deals.updatedAt));
  const counts = rows.length
    ? await db
        .select({ dealId: parties.dealId, n: sql<number>`count(*)::int`, open: sql<number>`count(*) filter (where ${parties.screeningStatus} = 'potential_match')::int` })
        .from(parties)
        .where(inArray(parties.dealId, rows.map((r) => r.id)))
        .groupBy(parties.dealId)
    : [];
  return rows.map((d) => ({ ...d, partyCount: counts.find((c) => c.dealId === d.id)?.n ?? 0, openMatches: counts.find((c) => c.dealId === d.id)?.open ?? 0 }));
}

export type DealBundle = Awaited<ReturnType<typeof getDealBundle>>;

export async function getDealBundle(orgId: string, dealId: string) {
  const db = await getDb();
  const deal = await getDeal(orgId, dealId);
  const [partyRows, docRows, screeningRows, kycRows, reportRows, auditRows] = await Promise.all([
    db.select().from(parties).where(and(eq(parties.dealId, dealId), eq(parties.orgId, orgId))).orderBy(asc(parties.createdAt)),
    db
      .select({
        id: documents.id,
        partyId: documents.partyId,
        category: documents.category,
        filename: documents.filename,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        sha256: documents.sha256,
        uploadedBy: documents.uploadedBy,
        verifiedBy: documents.verifiedBy,
        verifiedAt: documents.verifiedAt,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(and(eq(documents.dealId, dealId), eq(documents.orgId, orgId)))
      .orderBy(asc(documents.createdAt)),
    db.select().from(screenings).where(and(eq(screenings.dealId, dealId), eq(screenings.orgId, orgId))).orderBy(desc(screenings.createdAt)),
    db.select().from(kycRequests).where(and(eq(kycRequests.dealId, dealId), eq(kycRequests.orgId, orgId))).orderBy(desc(kycRequests.createdAt)),
    db.select().from(thresholdReports).where(and(eq(thresholdReports.dealId, dealId), eq(thresholdReports.orgId, orgId))).limit(1),
    db.select().from(auditEvents).where(and(eq(auditEvents.dealId, dealId), eq(auditEvents.orgId, orgId))).orderBy(desc(auditEvents.createdAt)),
  ]);
  const org = (await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1))[0];
  const risk = riskFor(org, deal, partyRows, docRows);
  return { deal, parties: partyRows, documents: docRows, screenings: screeningRows, kycRequests: kycRows, report: reportRows[0] ?? null, audit: auditRows, risk, org };
}

export function riskFor(org: Organization, deal: Deal, partyRows: Party[], docRows: { category: string; partyId: string | null }[]): RiskResult {
  return computeRisk(
    {
      assetType: deal.assetType,
      transactionType: deal.transactionType,
      useType: deal.useType,
      priceEur: deal.priceEur,
      paymentMethod: deal.paymentMethod,
      thirdPartyPayer: deal.thirdPartyPayer,
      fundsOriginCountry: deal.fundsOriginCountry,
      flags: deal.flags ?? {},
    },
    partyRows,
    docRows,
    { extraHighRisk: org.settings?.extraHighRiskCountries ?? [] },
  );
}

/** Re-scores a deal and persists the result (plus the Article 74 obligation row). */
export async function recomputeRisk(org: Organization, dealId: string, opts: { silent?: boolean } = {}): Promise<RiskResult> {
  const db = await getDb();
  const deal = await getDeal(org.id, dealId);
  const partyRows = await db.select().from(parties).where(eq(parties.dealId, dealId));
  const docRows = await db.select({ category: documents.category, partyId: documents.partyId }).from(documents).where(eq(documents.dealId, dealId));
  const risk = riskFor(org, deal, partyRows, docRows);
  const changed = deal.riskLevel !== risk.level || deal.riskScore !== risk.score;
  await db
    .update(deals)
    .set({ riskScore: risk.score, riskLevel: risk.level, ddLevel: risk.ddLevel, riskFactors: risk.factors, riskComputedAt: new Date(), updatedAt: new Date() })
    .where(eq(deals.id, dealId));

  const [existing] = await db.select().from(thresholdReports).where(eq(thresholdReports.dealId, dealId)).limit(1);
  const refused = deal.status === "rejected" || deal.status === "aborted";
  if (risk.article74.applies && !existing && !refused) {
    await db.insert(thresholdReports).values({ orgId: org.id, dealId, status: "required", fiu: fiuFor(org.country) });
  } else if ((!risk.article74.applies || refused) && existing && existing.status !== "submitted") {
    await db.delete(thresholdReports).where(eq(thresholdReports.id, existing.id));
  }
  if (changed && !opts.silent) {
    await audit(org.id, { type: "system", label: "Ensign risk engine" }, "risk.computed", { score: risk.score, level: risk.level, dd: risk.ddLevel }, { dealId });
  }
  return risk;
}

export function fiuFor(country: string | null | undefined): string | null {
  if (!country) return null;
  if (!EU_MEMBER_STATES.includes(country)) return null;
  return FIU_BY_COUNTRY[country] ?? null;
}

export type ChecklistItem = { key: string; label: string; state: "done" | "todo" | "blocked" | "na"; detail: string };

export function dealChecklist(bundle: DealBundle): ChecklistItem[] {
  const { risk, deal, parties: ps, report } = bundle;
  const idBlockers = risk.blockers.filter((b) => b.code === "no_buyer" || b.code.startsWith("no_ubo") || b.code === "payer_unknown");
  const docsDone = risk.requiredDocs.filter((d) => d.satisfied).length;
  const unscreened = ps.filter((p) => p.screeningStatus === "not_screened").length;
  const open = ps.filter((p) => p.screeningStatus === "potential_match").length;
  return [
    {
      key: "identify",
      label: "Customer & beneficial owners identified",
      state: idBlockers.length ? "todo" : "done",
      detail: idBlockers.length ? idBlockers.map((b) => b.label).join(" · ") : `${ps.length} parties on file`,
    },
    {
      key: "evidence",
      label: "Evidence collected",
      state: risk.requiredDocs.length && docsDone === risk.requiredDocs.length ? "done" : "todo",
      detail: `${docsDone} of ${risk.requiredDocs.length} required documents`,
    },
    {
      key: "screening",
      label: "Sanctions & PEP screening",
      state: ps.length === 0 || unscreened ? "todo" : open ? "blocked" : "done",
      detail: ps.length === 0 ? "No parties yet" : unscreened ? `${unscreened} not screened` : open ? `${open} potential match${open > 1 ? "es" : ""} to review` : "All parties screened",
    },
    {
      key: "risk",
      label: "Risk assessed",
      state: risk.level === "prohibited" ? "blocked" : "done",
      detail: `${risk.level[0].toUpperCase()}${risk.level.slice(1)} risk · ${risk.ddLevel === "refuse" ? "do not proceed" : `${risk.ddLevel} due diligence`}`,
    },
    {
      key: "approval",
      label: risk.approval === "senior_management" ? "Senior-management approval" : "Compliance sign-off",
      state: deal.decision ? "done" : "todo",
      detail: deal.decision ? `${deal.decision === "approved" ? "Approved" : "Rejected"} by ${deal.decisionByName ?? "—"}` : "Pending",
    },
    {
      key: "report",
      label: "Article 74 threshold report",
      state: !risk.article74.applies ? "na" : report?.status === "submitted" ? "done" : "todo",
      detail: !risk.article74.applies ? risk.article74.reason : report?.status === "submitted" ? `Submitted · ref ${report.submissionRef ?? "—"}` : report?.status === "prepared" ? "Prepared — file with the FIU" : "Required once the sale completes",
    },
  ];
}

export async function decideDeal(ctx: Ctx, dealId: string, decision: "approved" | "rejected", note: string) {
  const db = await getDb();
  const bundle = await getDealBundle(ctx.org.id, dealId);
  if (CLOSED_STATUSES.includes(bundle.deal.status) && bundle.deal.status !== "rejected") {
    throw new DomainError("This deal is closed.");
  }
  if (decision === "approved") {
    if (bundle.risk.level === "prohibited") throw new DomainError("This deal cannot be approved: a prohibition applies.");
    const open = bundle.risk.blockers.filter((b) => !b.prohibited);
    if (open.length) throw new DomainError(`Resolve ${open.length} open item${open.length > 1 ? "s" : ""} before approving: ${open[0].label}.`);
    if (bundle.risk.approval === "senior_management" && !["owner", "admin"].includes(ctx.user.role)) {
      throw new DomainError("Enhanced due diligence requires approval by senior management (owner or admin).");
    }
  }
  if (note.trim().length < 10) throw new DomainError("Record the grounds for your decision (at least 10 characters).");
  await db
    .update(deals)
    .set({
      decision,
      decisionBy: ctx.user.id,
      decisionByName: `${ctx.user.name} (${ctx.user.role})`,
      decisionAt: new Date(),
      decisionNote: note.trim(),
      status: decision,
      updatedAt: new Date(),
    })
    .where(and(eq(deals.id, dealId), eq(deals.orgId, ctx.org.id)));
  await audit(ctx.org.id, actorOf(ctx), decision === "approved" ? "deal.approved" : "deal.rejected", { note: note.trim(), risk: bundle.risk.level }, { dealId, ip: ctx.ip });
  await recomputeRisk(ctx.org, dealId, { silent: true });
}

export async function completeDeal(ctx: Ctx, dealId: string, completedOn: string) {
  const db = await getDb();
  const deal = await getDeal(ctx.org.id, dealId);
  if (deal.decision !== "approved") throw new DomainError("Only approved deals can be marked completed.");
  await db.update(deals).set({ status: "completed", expectedClosing: completedOn, updatedAt: new Date() }).where(eq(deals.id, dealId));
  const days = ctx.org.settings?.reportDeadlineDays ?? 30;
  const due = new Date(new Date(completedOn).getTime() + days * 86_400_000).toISOString().slice(0, 10);
  await db.update(thresholdReports).set({ dueDate: due, updatedAt: new Date() }).where(eq(thresholdReports.dealId, dealId));
  await audit(ctx.org.id, actorOf(ctx), "deal.completed", { completedOn }, { dealId, ip: ctx.ip });
}

export async function setDealStatus(orgId: string, dealId: string, from: string[], to: string) {
  const db = await getDb();
  await db
    .update(deals)
    .set({ status: to, updatedAt: new Date() })
    .where(and(eq(deals.id, dealId), eq(deals.orgId, orgId), inArray(deals.status, from)));
}
