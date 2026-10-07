/**
 * Deal risk engine for high-value goods (yachts, aircraft, motor vehicles).
 *
 * Deterministic and explainable: every factor carries points, a severity and the legal
 * reference that motivates it, so a compliance officer can defend the outcome to a
 * supervisor. It supports — it does not replace — the firm's own risk assessment.
 */
import { countryName } from "@/lib/countries";
import type { DealFlags, StoredRiskFactor } from "@/lib/db/schema";
import {
  EU_HIGH_RISK,
  FATF_CALL_FOR_ACTION,
  FATF_GREY,
  LUXURY_GOODS_EMBARGO,
  OFFSHORE_HOLDING,
  PROHIBITED_JURISDICTIONS,
} from "./lists";
import { assessArticle74, type Article74Assessment } from "./thresholds";

export type RiskParty = {
  id: string;
  role: string;
  kind: string; // person | entity
  fullName: string;
  nationality?: string | null;
  residenceCountry?: string | null;
  jurisdiction?: string | null;
  entityType?: string | null;
  pepStatus: string; // none | declared | confirmed
  screeningStatus: string; // not_screened | clear | potential_match | confirmed_match | pep_match | cleared
  parentPartyId?: string | null;
  idDocExpiry?: string | null;
};

export type RiskDocument = { category: string; partyId: string | null };

export type RiskDealInput = {
  assetType: string;
  transactionType: string;
  useType: string;
  priceEur: number | null;
  paymentMethod: string;
  thirdPartyPayer: boolean;
  fundsOriginCountry?: string | null;
  flags: DealFlags;
};

export type Blocker = { code: string; label: string; detail?: string; prohibited?: boolean };

export type RequiredDoc = {
  key: string;
  category: string;
  label: string;
  partyId: string | null;
  partyName?: string;
  satisfied: boolean;
};

export type RiskResult = {
  score: number;
  level: "low" | "medium" | "high" | "prohibited";
  ddLevel: "standard" | "enhanced" | "refuse";
  approval: "compliance_officer" | "senior_management";
  factors: StoredRiskFactor[];
  blockers: Blocker[];
  requiredDocs: RequiredDoc[];
  article74: Article74Assessment;
  eddTriggers: string[];
};

export const DOC_CATEGORIES: Record<string, string> = {
  passport: "Passport / national ID",
  proof_of_address: "Proof of address",
  pep_declaration: "PEP declaration",
  certificate_of_incorporation: "Certificate of incorporation",
  register_of_directors: "Register of directors",
  register_of_members: "Register of members / shareholders",
  ownership_chart: "Ownership structure chart",
  ubo_declaration: "Beneficial-ownership declaration",
  good_standing: "Certificate of good standing / incumbency",
  board_resolution: "Board resolution / power of attorney",
  trust_deed: "Trust deed / trustee declaration",
  source_of_funds: "Source of funds evidence",
  source_of_wealth: "Source of wealth evidence",
  sale_agreement: "Sale agreement (MOA / APA / purchase order)",
  other: "Other",
};

const AMLR = {
  cdd: "AMLR Art. 20",
  edd: "AMLR Art. 34",
  hrtc: "AMLR Art. 29 & Delegated Reg. 2016/1675",
  pep: "AMLR Art. 42",
  str: "AMLR Art. 69",
  thresholds: "AMLR Art. 74",
  retention: "AMLR Art. 77",
  bearer: "AMLR Art. 79",
  cash: "AMLR Art. 80",
  luxury: "Reg. (EU) 833/2014 Art. 3h · Reg. (EC) 765/2006",
};

export function computeRisk(
  deal: RiskDealInput,
  parties: RiskParty[],
  docs: RiskDocument[],
  opts: { extraHighRisk?: string[]; today?: Date } = {},
): RiskResult {
  const factors: StoredRiskFactor[] = [];
  const blockers: Blocker[] = [];
  const eddTriggers: string[] = [];
  const extra = new Set((opts.extraHighRisk ?? []).map((c) => c.toUpperCase()));
  const today = opts.today ?? new Date();

  const add = (f: StoredRiskFactor) => factors.push(f);
  const buyers = parties.filter((p) => p.role === "buyer");
  const entities = parties.filter((p) => p.kind === "entity" && ["buyer", "intermediate"].includes(p.role));
  const ubos = parties.filter((p) => p.role === "beneficial_owner");

  // ── Customer identification ───────────────────────────────────────────────
  if (buyers.length === 0) {
    blockers.push({ code: "no_buyer", label: "Identify the customer (buyer)", detail: "Add the buyer or send the client KYC link." });
  }
  // An entity is "resolved" when the chain above it ends in at least one natural-person
  // beneficial owner (UBO → parentPartyId = the entity it owns or controls). UBOs entered
  // without a parent count for every entity on the deal.
  const unparentedUbo = ubos.some((u) => !u.parentPartyId);
  const resolved = (entityId: string, seen: Set<string>): boolean => {
    if (unparentedUbo) return true;
    if (seen.has(entityId)) return false;
    seen.add(entityId);
    return parties.some(
      (c) =>
        c.parentPartyId === entityId &&
        ((c.kind === "person" && c.role === "beneficial_owner") ||
          (c.kind === "entity" && c.role === "intermediate" && resolved(c.id, seen))),
    );
  };
  for (const e of entities) {
    if (!resolved(e.id, new Set())) {
      blockers.push({
        code: `no_ubo_${e.id}`,
        label: `Identify the beneficial owner(s) of ${e.fullName}`,
        detail: "Natural persons holding more than 25% or exercising control by other means.",
      });
    }
  }

  // ── Ownership structure ───────────────────────────────────────────────────
  if (entities.length >= 2) {
    add({
      code: "layered_structure",
      label: "Multi-layered ownership structure",
      points: 15,
      severity: "medium",
      detail: `${entities.length} legal entities between the asset and its beneficial owners.`,
      ref: AMLR.edd,
    });
  }
  const trusts = parties.filter((p) => p.kind === "entity" && ["trust", "foundation"].includes(p.entityType ?? ""));
  if (trusts.length > 0) {
    add({
      code: "trust",
      label: "Trust or foundation in the ownership chain",
      points: 10,
      severity: "medium",
      detail: `${trusts.map((t) => t.fullName).join(", ")} — identify settlor, trustees, protector and beneficiaries.`,
      ref: AMLR.cdd,
    });
  }
  const offshore = [...new Set(entities.map((e) => e.jurisdiction).filter((j): j is string => !!j && OFFSHORE_HOLDING.has(j)))];
  if (offshore.length > 0) {
    add({
      code: "offshore_vehicle",
      label: "Offshore holding vehicle",
      points: 10,
      severity: "medium",
      detail: `Entity incorporated in ${offshore.map(countryName).join(", ")}.`,
      ref: AMLR.edd,
    });
  }
  if (deal.flags.nomineeOrBearer) {
    add({
      code: "nominee_bearer",
      label: "Nominee shareholders/directors or bearer instruments",
      points: 20,
      severity: "high",
      detail: "Bearer shares are prohibited under the AMLR; nominee arrangements must be disclosed.",
      ref: AMLR.bearer,
    });
  }

  // ── Geography ─────────────────────────────────────────────────────────────
  type Hit = { country: string; who: string; how: "residence" | "jurisdiction" | "nationality" | "funds" };
  const hits: Hit[] = [];
  for (const p of parties) {
    if (p.kind === "person") {
      if (p.residenceCountry) hits.push({ country: p.residenceCountry, who: p.fullName, how: "residence" });
      if (p.nationality) hits.push({ country: p.nationality, who: p.fullName, how: "nationality" });
    } else if (p.jurisdiction) {
      hits.push({ country: p.jurisdiction, who: p.fullName, how: "jurisdiction" });
    }
  }
  if (deal.fundsOriginCountry) hits.push({ country: deal.fundsOriginCountry, who: "Funds", how: "funds" });
  const establishing = hits.filter((h) => h.how !== "nationality");
  const describe = (list: Hit[]) =>
    [...new Set(list.map((h) => `${countryName(h.country)} (${h.how === "funds" ? "origin of funds" : `${h.how} of ${h.who}`})`))].join("; ");

  const prohibited = establishing.filter((h) => PROHIBITED_JURISDICTIONS.has(h.country));
  if (prohibited.length) {
    blockers.push({
      code: "prohibited_jurisdiction",
      label: "Comprehensive-sanctions jurisdiction involved",
      detail: describe(prohibited),
      prohibited: true,
    });
    add({ code: "prohibited_jurisdiction", label: "Sanctioned jurisdiction (FATF countermeasures)", points: 60, severity: "critical", detail: describe(prohibited), ref: AMLR.hrtc });
  }

  const embargo = establishing.filter((h) => LUXURY_GOODS_EMBARGO.has(h.country));
  if (embargo.length) {
    blockers.push({
      code: "luxury_embargo",
      label: "EU luxury-goods sales ban (Russia / Belarus)",
      detail: `${describe(embargo)}. Sales of luxury goods to persons in, or for use in, Russia or Belarus are prohibited.`,
      prohibited: true,
    });
    add({ code: "luxury_embargo", label: "Person or funds in Russia / Belarus", points: 60, severity: "critical", detail: describe(embargo), ref: AMLR.luxury });
  }
  const embargoNationals = hits.filter((h) => h.how === "nationality" && LUXURY_GOODS_EMBARGO.has(h.country));
  if (embargoNationals.length && !embargo.length) {
    add({
      code: "embargo_nationality",
      label: "Russian / Belarusian national",
      points: 25,
      severity: "high",
      detail: `${describe(embargoNationals)}. Verify residence and that the asset will not be used in Russia/Belarus.`,
      ref: AMLR.luxury,
    });
    eddTriggers.push("Russian/Belarusian national");
  }

  const cfa = establishing.filter((h) => FATF_CALL_FOR_ACTION.has(h.country) && !PROHIBITED_JURISDICTIONS.has(h.country));
  if (cfa.length) {
    add({ code: "fatf_cfa", label: "FATF call-for-action jurisdiction", points: 40, severity: "high", detail: describe(cfa), ref: AMLR.hrtc });
    eddTriggers.push("FATF call-for-action jurisdiction");
  }

  const euHigh = establishing.filter((h) => EU_HIGH_RISK.has(h.country) && !PROHIBITED_JURISDICTIONS.has(h.country) && !LUXURY_GOODS_EMBARGO.has(h.country));
  if (euHigh.length) {
    add({
      code: "eu_high_risk",
      label: "EU high-risk third country involved",
      points: 25,
      severity: "high",
      detail: `${describe(euHigh)}. Enhanced due diligence is mandatory.`,
      ref: AMLR.hrtc,
    });
    eddTriggers.push("EU high-risk third country");
  }
  const euHighNationals = hits.filter((h) => h.how === "nationality" && EU_HIGH_RISK.has(h.country) && !LUXURY_GOODS_EMBARGO.has(h.country));
  if (euHighNationals.length && !euHigh.length) {
    add({ code: "eu_high_risk_nationality", label: "National of an EU high-risk third country", points: 10, severity: "medium", detail: describe(euHighNationals), ref: AMLR.hrtc });
  }

  const grey = establishing.filter((h) => FATF_GREY.has(h.country) && !EU_HIGH_RISK.has(h.country));
  if (grey.length) {
    add({ code: "fatf_grey", label: "FATF increased-monitoring jurisdiction", points: 10, severity: "medium", detail: describe(grey), ref: AMLR.edd });
  }

  const firmList = establishing.filter((h) => extra.has(h.country));
  if (firmList.length) {
    add({ code: "firm_high_risk", label: "Country on the firm's own high-risk list", points: 15, severity: "high", detail: describe(firmList), ref: "Business-wide risk assessment" });
    eddTriggers.push("Firm high-risk country");
  }

  // ── PEPs & screening ──────────────────────────────────────────────────────
  const peps = parties.filter((p) => p.pepStatus === "declared" || p.pepStatus === "confirmed" || p.screeningStatus === "pep_match");
  if (peps.length) {
    add({
      code: "pep",
      label: "Politically exposed person",
      points: 30,
      severity: "high",
      detail: `${peps.map((p) => p.fullName).join(", ")} — senior management approval, source of wealth and funds, enhanced ongoing monitoring.`,
      ref: AMLR.pep,
    });
    eddTriggers.push("Politically exposed person");
  }
  for (const p of parties) {
    if (p.screeningStatus === "not_screened") {
      blockers.push({ code: `unscreened_${p.id}`, label: `Screen ${p.fullName}`, detail: "Sanctions, PEP and watchlist screening has not run yet." });
    } else if (p.screeningStatus === "potential_match") {
      blockers.push({ code: `match_${p.id}`, label: `Review potential match for ${p.fullName}`, detail: "Clear as a false positive with a rationale, or confirm the match." });
    } else if (p.screeningStatus === "confirmed_match") {
      blockers.push({
        code: `confirmed_${p.id}`,
        label: `Confirmed sanctions / watchlist match: ${p.fullName}`,
        detail: "Do not proceed. Assess asset-freezing obligations and file a suspicious transaction report.",
        prohibited: true,
      });
      add({ code: `confirmed_${p.id}`, label: "Confirmed watchlist match", points: 100, severity: "critical", detail: p.fullName, ref: AMLR.str });
    }
    if (p.idDocExpiry && p.kind === "person") {
      const exp = new Date(p.idDocExpiry);
      if (!Number.isNaN(exp.getTime()) && exp < today) {
        blockers.push({ code: `expired_id_${p.id}`, label: `ID document expired: ${p.fullName}`, detail: "Request a current passport or national ID." });
      }
    }
  }

  // ── Funds & payment ───────────────────────────────────────────────────────
  if (deal.thirdPartyPayer) {
    add({ code: "third_party_payer", label: "Payment from a third party", points: 15, severity: "medium", detail: "Funds do not come from the buyer's own account.", ref: AMLR.edd });
    if (!parties.some((p) => p.role === "payer")) {
      blockers.push({ code: "payer_unknown", label: "Identify and screen the third-party payer" });
    }
  }
  if (deal.paymentMethod === "crypto") {
    add({
      code: "crypto",
      label: "Crypto-asset funding",
      points: 25,
      severity: "high",
      detail: "Trace the on-chain source of funds; Monaco's AMSF fined a yacht brokerage over a Bitcoin-funded purchase (Nov 2025).",
      ref: AMLR.edd,
    });
    eddTriggers.push("Crypto-asset funding");
  }
  const cash = deal.flags.cashComponentEur ?? 0;
  if (deal.paymentMethod === "cash" || cash > 0) {
    if (cash > 10_000 || (deal.paymentMethod === "cash" && (deal.priceEur ?? 0) > 10_000)) {
      blockers.push({
        code: "cash_limit",
        label: "Cash above €10,000",
        detail: "Prohibited under the AMLR from 10 July 2027; stricter national limits already apply in many Member States.",
        prohibited: true,
      });
      add({ code: "cash_limit", label: "Cash payment above €10,000", points: 60, severity: "critical", ref: AMLR.cash });
    } else {
      add({ code: "cash", label: "Cash component", points: 10, severity: "medium", ref: AMLR.cash });
    }
  }
  if (deal.flags.unusualUrgency) {
    add({ code: "urgency", label: "Unusual urgency or secrecy requested", points: 15, severity: "medium", ref: AMLR.edd });
  }
  if (deal.flags.priceAnomaly) {
    add({ code: "price_anomaly", label: "Price materially above or below market", points: 15, severity: "medium", ref: AMLR.edd });
  }
  if (parties.some((p) => p.role === "representative")) {
    add({
      code: "representative",
      label: "Customer acts through a representative",
      points: 5,
      severity: "low",
      detail: "Verify the representative's authority (power of attorney / engagement letter).",
      ref: AMLR.cdd,
    });
  }
  if ((deal.priceEur ?? 0) >= 20_000_000) {
    add({ code: "very_high_value", label: "Very high transaction value", points: 5, severity: "low", detail: "≥ €20m", ref: AMLR.cdd });
  }

  // ── Score, level, due-diligence tier ──────────────────────────────────────
  const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  const isProhibited = blockers.some((b) => b.prohibited);
  let level: RiskResult["level"];
  if (isProhibited) level = "prohibited";
  else if (eddTriggers.length > 0 || score >= 45) level = "high";
  else if (score >= 20) level = "medium";
  else level = "low";
  const ddLevel: RiskResult["ddLevel"] = level === "prohibited" ? "refuse" : level === "high" ? "enhanced" : "standard";
  const approval: RiskResult["approval"] = level === "high" || level === "prohibited" ? "senior_management" : "compliance_officer";

  // ── Required evidence ─────────────────────────────────────────────────────
  const requiredDocs: RequiredDoc[] = [];
  // Party-specific evidence must be linked to that party; deal-level evidence can be any document of the category.
  const has = (category: string, partyId: string | null) =>
    docs.some((d) => d.category === category && (partyId === null || d.partyId === partyId));
  const need = (category: string, party: RiskParty | null) =>
    requiredDocs.push({
      key: `${category}:${party?.id ?? "deal"}`,
      category,
      label: DOC_CATEGORIES[category] ?? category,
      partyId: party?.id ?? null,
      partyName: party?.fullName,
      satisfied: has(category, party?.id ?? null),
    });

  const keyPersons = parties.filter((p) => p.kind === "person" && ["buyer", "beneficial_owner", "payer"].includes(p.role));
  for (const p of keyPersons) {
    need("passport", p);
    need("proof_of_address", p);
    if (peps.includes(p)) need("pep_declaration", p);
  }
  const keyEntities = parties.filter((p) => p.kind === "entity" && ["buyer", "intermediate", "payer"].includes(p.role));
  for (const e of keyEntities) {
    if (["trust", "foundation"].includes(e.entityType ?? "")) {
      need("trust_deed", e);
      continue;
    }
    need("certificate_of_incorporation", e);
    need("register_of_directors", e);
    need("register_of_members", e);
    if (ddLevel === "enhanced") need("good_standing", e);
  }
  if (keyEntities.length > 0) {
    need("ubo_declaration", null);
    if (keyEntities.length > 1 || trusts.length > 0) need("ownership_chart", null);
    if (buyers.some((b) => b.kind === "entity")) need("board_resolution", null);
  }
  need("source_of_funds", null);
  if (ddLevel === "enhanced" || peps.length > 0) need("source_of_wealth", null);
  need("sale_agreement", null);

  return {
    score,
    level,
    ddLevel,
    approval,
    factors: factors.sort((a, b) => b.points - a.points),
    blockers,
    requiredDocs,
    article74: assessArticle74(deal),
    eddTriggers,
  };
}
