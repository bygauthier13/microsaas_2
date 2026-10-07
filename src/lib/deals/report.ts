import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { thresholdReports } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { countryName } from "@/lib/countries";
import { ASSET_TYPES, type AssetType } from "@/lib/risk/thresholds";
import { actorOf, DomainError, fiuFor, getDealBundle, type Ctx, type DealBundle } from "./service";

/**
 * Builds the Article 74 threshold report pack. FIUs have not yet published a harmonised
 * schema for these reports, so the pack is format-agnostic: a structured JSON document
 * and a printable form containing every data point an FIU portal (often goAML) asks for.
 */
export function buildReportPayload(bundle: DealBundle) {
  const { deal, org, parties, risk } = bundle;
  const buyer = parties.find((p) => p.role === "buyer");
  const mapPerson = (p: (typeof parties)[number]) => ({
    name: p.fullName,
    kind: p.kind,
    dateOfBirth: p.dateOfBirth ?? null,
    nationality: p.nationality ? countryName(p.nationality) : null,
    residence: p.residenceCountry ? countryName(p.residenceCountry) : null,
    jurisdiction: p.jurisdiction ? countryName(p.jurisdiction) : null,
    registrationNumber: p.registrationNumber ?? null,
    idDocument: p.idDocNumber ? `${p.idDocType ?? "ID"} ${p.idDocNumber}` : null,
    ownershipPct: p.ownershipPct ?? null,
    pep: p.pepStatus !== "none" || p.screeningStatus === "pep_match",
  });
  return {
    schema: "ensign.article74.v1",
    generatedAt: new Date().toISOString(),
    legalBasis: "Regulation (EU) 2024/1624 (AMLR), Article 74(1) — threshold-based report of transactions in certain high-value goods",
    reportingEntity: {
      name: org.name,
      country: org.country ? countryName(org.country) : null,
      registrationNumber: org.registrationNumber ?? null,
      complianceOfficer: { name: org.complianceOfficerName ?? null, email: org.complianceOfficerEmail ?? null },
    },
    recipientFiu: { country: org.country ? countryName(org.country) : null, name: fiuFor(org.country) ?? "Verify the competent FIU" },
    transaction: {
      reference: deal.reference,
      type: deal.transactionType,
      completionDate: deal.status === "completed" ? deal.expectedClosing : null,
      expectedCompletion: deal.expectedClosing,
      price: { amount: deal.priceAmount, currency: deal.currency },
      priceEurIndicative: deal.priceEur,
      paymentMethod: deal.paymentMethod,
      thirdPartyPayer: deal.thirdPartyPayer,
      fundsOriginCountry: deal.fundsOriginCountry ? countryName(deal.fundsOriginCountry) : null,
      useDeclared: deal.useType === "non_commercial" ? "Non-commercial (private) use" : deal.useType,
      ourRole: deal.ourRole,
    },
    goods: {
      category: ASSET_TYPES[deal.assetType as AssetType]?.label ?? deal.assetType,
      threshold: risk.article74.threshold,
      description: deal.assetName,
      ...deal.assetDetails,
    },
    customer: buyer ? mapPerson(buyer) : null,
    beneficialOwners: parties.filter((p) => p.role === "beneficial_owner").map(mapPerson),
    intermediateEntities: parties.filter((p) => p.role === "intermediate").map(mapPerson),
    payers: parties.filter((p) => p.role === "payer").map(mapPerson),
    representatives: parties.filter((p) => p.role === "representative").map(mapPerson),
    sellers: parties.filter((p) => p.role === "seller").map(mapPerson),
    dueDiligence: {
      level: risk.ddLevel,
      riskLevel: risk.level,
      riskScore: risk.score,
      factors: risk.factors.map((f) => f.label),
      partiesScreened: parties.filter((p) => p.lastScreenedAt).length,
      decision: deal.decision,
      decisionBy: deal.decisionByName,
      decisionAt: deal.decisionAt?.toISOString() ?? null,
    },
  };
}

export async function prepareReport(ctx: Ctx, dealId: string) {
  const bundle = await getDealBundle(ctx.org.id, dealId);
  if (!bundle.risk.article74.applies || !bundle.report) throw new DomainError("No Article 74 report is required for this deal.");
  const db = await getDb();
  await db
    .update(thresholdReports)
    .set({ status: bundle.report.status === "submitted" ? "submitted" : "prepared", preparedAt: new Date(), payload: buildReportPayload(bundle), fiu: fiuFor(ctx.org.country), updatedAt: new Date() })
    .where(and(eq(thresholdReports.id, bundle.report.id), eq(thresholdReports.orgId, ctx.org.id)));
  await audit(ctx.org.id, actorOf(ctx), "report.prepared", {}, { dealId, ip: ctx.ip });
}

export async function markReportSubmitted(ctx: Ctx, dealId: string, reference: string, submittedOn: string) {
  const bundle = await getDealBundle(ctx.org.id, dealId);
  if (!bundle.report) throw new DomainError("No Article 74 report on this deal.");
  if (bundle.deal.status !== "completed") throw new DomainError("Mark the sale completed first — the report covers a completed sale.");
  const db = await getDb();
  await db
    .update(thresholdReports)
    .set({
      status: "submitted",
      submissionRef: reference,
      submittedAt: new Date(submittedOn),
      payload: bundle.report.payload ?? buildReportPayload(bundle),
      preparedAt: bundle.report.preparedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(thresholdReports.id, bundle.report.id));
  await audit(ctx.org.id, actorOf(ctx), "report.submitted", { reference, submittedOn }, { dealId, ip: ctx.ip });
}
