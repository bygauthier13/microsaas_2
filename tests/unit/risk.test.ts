import { describe, expect, it } from "vitest";
import { computeRisk, type RiskParty } from "@/lib/risk/engine";
import { assessArticle74, toEur } from "@/lib/risk/thresholds";

const baseDeal = {
  assetType: "watercraft",
  transactionType: "sale",
  useType: "non_commercial",
  priceEur: 9_200_000,
  paymentMethod: "wire",
  thirdPartyPayer: false,
  fundsOriginCountry: "FR",
  flags: {},
};

const person = (over: Partial<RiskParty>): RiskParty => ({
  id: Math.random().toString(36).slice(2),
  role: "buyer",
  kind: "person",
  fullName: "Claire Fontaine",
  nationality: "FR",
  residenceCountry: "FR",
  pepStatus: "none",
  screeningStatus: "clear",
  ...over,
});

describe("Article 74 thresholds", () => {
  it("applies to yacht sales ≥ €7.5m for non-commercial use", () => {
    expect(assessArticle74({ ...baseDeal, priceEur: 7_500_000 }).applies).toBe(true);
    expect(assessArticle74({ ...baseDeal, priceEur: 7_499_999 }).applies).toBe(false);
  });
  it("applies to cars ≥ €250k", () => {
    expect(assessArticle74({ ...baseDeal, assetType: "motor_vehicle", priceEur: 250_000 }).applies).toBe(true);
  });
  it("does not apply to charters or commercial use", () => {
    expect(assessArticle74({ ...baseDeal, transactionType: "charter" }).applies).toBe(false);
    expect(assessArticle74({ ...baseDeal, useType: "commercial" }).applies).toBe(false);
  });
  it("flags values within 10% of the threshold", () => {
    expect(assessArticle74({ ...baseDeal, priceEur: 7_000_000 }).nearThreshold).toBe(true);
  });
  it("converts currencies with indicative FX", () => {
    expect(toEur(1_000_000, "EUR")).toBe(1_000_000);
    expect(toEur(1_000_000, "USD")).toBeLessThan(1_000_000);
    expect(toEur(1_000_000, "XYZ")).toBeNull();
  });
});

describe("risk engine", () => {
  it("rates a plain EU resident buyer as low risk with standard due diligence", () => {
    const r = computeRisk(baseDeal, [person({})], []);
    expect(r.level).toBe("low");
    expect(r.ddLevel).toBe("standard");
    expect(r.approval).toBe("compliance_officer");
    expect(r.article74.applies).toBe(true);
    expect(r.requiredDocs.some((d) => d.category === "source_of_funds")).toBe(true);
  });

  it("requires EDD and senior approval for a Monaco-resident UBO behind a BVI company", () => {
    const spv: RiskParty = person({ id: "spv", kind: "entity", fullName: "Lumen Maritime Holdings Ltd", jurisdiction: "VG", nationality: null, residenceCountry: null, entityType: "company" });
    const ubo = person({ id: "ubo", role: "beneficial_owner", fullName: "Aleksander Varga", nationality: "HU", residenceCountry: "MC", parentPartyId: "spv" });
    const r = computeRisk({ ...baseDeal, priceEur: 38_500_000 }, [spv, ubo], []);
    expect(r.level).toBe("high");
    expect(r.ddLevel).toBe("enhanced");
    expect(r.approval).toBe("senior_management");
    expect(r.factors.map((f) => f.code)).toEqual(expect.arrayContaining(["eu_high_risk", "offshore_vehicle"]));
    expect(r.blockers.find((b) => b.code.startsWith("no_ubo"))).toBeUndefined();
  });

  it("blocks when an entity has no identified beneficial owner", () => {
    const spv = person({ id: "spv", kind: "entity", fullName: "Opaque Holdings Ltd", jurisdiction: "MH", entityType: "company" });
    const r = computeRisk(baseDeal, [spv], []);
    expect(r.blockers.some((b) => b.code === "no_ubo_spv")).toBe(true);
  });

  it("resolves beneficial ownership through an intermediate trust", () => {
    const spv = person({ id: "spv", kind: "entity", fullName: "Lumen Maritime Holdings Ltd", jurisdiction: "VG", entityType: "company" });
    const trust = person({ id: "trust", role: "intermediate", kind: "entity", fullName: "Northgate Family Trust", jurisdiction: "JE", entityType: "trust", parentPartyId: "spv" });
    const ubo = person({ id: "ubo", role: "beneficial_owner", fullName: "A. Varga", parentPartyId: "trust" });
    const r = computeRisk(baseDeal, [spv, trust, ubo], []);
    expect(r.blockers.some((b) => b.code.startsWith("no_ubo"))).toBe(false);
    expect(r.factors.map((f) => f.code)).toEqual(expect.arrayContaining(["layered_structure", "trust"]));
  });

  it("prohibits cash above €10,000 and sales to persons in Russia", () => {
    const cash = computeRisk({ ...baseDeal, paymentMethod: "cash" }, [person({})], []);
    expect(cash.level).toBe("prohibited");
    const ru = computeRisk(baseDeal, [person({ residenceCountry: "RU", nationality: "RU" })], []);
    expect(ru.level).toBe("prohibited");
    expect(ru.blockers.some((b) => b.code === "luxury_embargo")).toBe(true);
  });

  it("treats PEPs and crypto funding as EDD triggers", () => {
    expect(computeRisk(baseDeal, [person({ pepStatus: "declared" })], []).ddLevel).toBe("enhanced");
    expect(computeRisk({ ...baseDeal, paymentMethod: "crypto" }, [person({})], []).ddLevel).toBe("enhanced");
  });

  it("blocks until potential matches are reviewed and unknown payers are identified", () => {
    const r = computeRisk({ ...baseDeal, thirdPartyPayer: true }, [person({ screeningStatus: "potential_match" })], []);
    expect(r.blockers.map((b) => b.code)).toEqual(expect.arrayContaining(["payer_unknown"]));
    expect(r.blockers.some((b) => b.code.startsWith("match_"))).toBe(true);
  });

  it("marks required documents as satisfied when uploaded", () => {
    const buyer = person({ id: "b1" });
    const r = computeRisk(baseDeal, [buyer], [{ category: "passport", partyId: "b1" }, { category: "source_of_funds", partyId: null }]);
    expect(r.requiredDocs.find((d) => d.key === "passport:b1")?.satisfied).toBe(true);
    expect(r.requiredDocs.find((d) => d.key === "source_of_funds:deal")?.satisfied).toBe(true);
    expect(r.requiredDocs.find((d) => d.key === "proof_of_address:b1")?.satisfied).toBe(false);
  });
});
