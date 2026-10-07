/**
 * Demo workspace seeding. Everything created here is FICTIONAL and lives in an
 * organisation flagged `is_demo = true` that expires after 24 hours. Demo orgs never
 * send real email, never hit paid screening APIs and never reach Stripe.
 */
import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations, screenings, users } from "@/lib/db/schema";
import { hashPassword, randomToken } from "@/lib/crypto";
import { TRIAL_DAYS } from "@/lib/billing/plans";
import { completeDeal, createDeal, decideDeal, type Ctx, type DealInput } from "@/lib/deals/service";
import { addParty, resolveScreening } from "@/lib/deals/parties";
import { storeDocument } from "@/lib/deals/documents";
import { createKycRequest } from "@/lib/deals/kyc";
import { markReportSubmitted, prepareReport } from "@/lib/deals/report";
import type { Actor } from "@/lib/audit";
import { specimenPdf } from "./pdf";

const day = 86_400_000;
const isoDate = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);

function dealInput(over: Partial<DealInput> & Pick<DealInput, "assetType" | "assetName">): DealInput {
  return {
    assetDetails: {},
    transactionType: "sale",
    ourRole: "seller_broker",
    useType: "non_commercial",
    priceAmount: null,
    currency: "EUR",
    paymentMethod: "wire",
    thirdPartyPayer: false,
    fundsOriginCountry: null,
    expectedClosing: isoDate(30),
    flags: {},
    ...over,
  };
}

export async function createDemoWorkspace() {
  const db = await getDb();
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Riviera Yacht Partners (demo)",
      country: "FR",
      businessType: "yacht_broker",
      activities: ["sales", "charter", "new_build"],
      registrationNumber: "RCS Antibes 000 000 000 (fictional)",
      complianceOfficerName: "Camille Laurent",
      complianceOfficerEmail: "compliance@riviera-yacht-partners.example",
      plan: "brokerage",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * day),
      isDemo: true,
      demoExpiresAt: new Date(Date.now() + day),
      onboardedAt: new Date(),
    })
    .returning();
  const [user] = await db
    .insert(users)
    .values({
      orgId: org.id,
      email: `demo-${randomToken(9).toLowerCase()}@demo.ensign.invalid`,
      name: "Camille Laurent",
      role: "owner",
      passwordHash: await hashPassword(randomToken(24)),
      isDemo: true,
    })
    .returning();

  const ctx: Ctx = { user, org };
  const me: Actor = { type: "user", id: user.id, label: user.name };
  const client: Actor = { type: "client", label: "Client portal" };
  const doc = (title: string, ...lines: string[]) => ({ name: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`, bytes: specimenPdf(title, lines) });
  const opts = { recompute: false } as const;

  // ── A. Superyacht sale: BVI SPV → Jersey trust → Monaco-resident UBOs (EDD), open potential match ──
  const a = await createDeal(
    ctx,
    dealInput({
      assetType: "watercraft",
      assetName: "M/Y AURELIA — 52m Benetti (2019)",
      assetDetails: { builder: "Benetti", model: "B.Now 52", year: "2019", lengthM: "52", flag: "Malta", imo: "9000001 (fictional)" },
      priceAmount: 38_500_000,
      fundsOriginCountry: "CH",
      expectedClosing: isoDate(21),
    }),
  );
  const spv = await addParty(org, a.id, { role: "buyer", kind: "entity", fullName: "Lumen Maritime Holdings Ltd", jurisdiction: "VG", entityType: "company", registrationNumber: "BVI 2091442 (fictional)" }, client, opts);
  const trust = await addParty(org, a.id, { role: "intermediate", kind: "entity", fullName: "Northgate Family Trust", jurisdiction: "JE", entityType: "trust", parentPartyId: spv.id }, client, opts);
  const ubo1 = await addParty(org, a.id, { role: "beneficial_owner", kind: "person", fullName: "Aleksander Varga", dateOfBirth: "1971-04-18", nationality: "HU", residenceCountry: "MC", ownershipPct: 70, controlType: "Settlor & principal beneficiary", parentPartyId: trust.id, idDocType: "Passport", idDocNumber: "HU-X0000001 (fictional)", idDocExpiry: isoDate(900) }, client, opts);
  await addParty(org, a.id, { role: "beneficial_owner", kind: "person", fullName: "Natalia Varga", dateOfBirth: "1975-09-02", nationality: "HU", residenceCountry: "MC", ownershipPct: 30, controlType: "Beneficiary", parentPartyId: trust.id }, client, opts);
  await addParty(org, a.id, { role: "representative", kind: "person", fullName: "Dmitri Orlanski", nationality: "DE", residenceCountry: "DE", email: "d.orlanski@kanzlei.example" }, client, opts);
  await storeDocument(org, a.id, doc("Certificate of Incorporation", "Lumen Maritime Holdings Ltd", "BVI Business Companies Act 2004", "Company no. 2091442"), { category: "certificate_of_incorporation", partyId: spv.id }, client, "demo", opts);
  await storeDocument(org, a.id, doc("Register of Directors", "Lumen Maritime Holdings Ltd", "Director: Northgate Trustees (Jersey) Ltd"), { category: "register_of_directors", partyId: spv.id }, client, "demo", opts);
  await storeDocument(org, a.id, doc("Trustee Declaration", "Northgate Family Trust (Jersey)", "Settlor: Aleksander Varga", "Beneficiaries: A. Varga, N. Varga"), { category: "trust_deed", partyId: trust.id }, client, "demo", opts);
  await storeDocument(org, a.id, doc("Passport", "Aleksander Varga", "Hungary · born 18 Apr 1971"), { category: "passport", partyId: ubo1.id }, client, "demo", opts);
  await storeDocument(org, a.id, doc("Bank Comfort Letter", "Funds held at a Geneva private bank", "EUR 40,000,000 available for the purchase"), { category: "source_of_funds", partyId: null }, client, "demo", opts);
  await storeDocument(org, a.id, doc("MYBA Memorandum of Agreement", "M/Y AURELIA", "Price EUR 38,500,000"), { category: "sale_agreement", partyId: null }, me, "demo", opts);

  // ── B. Sale awaiting the buyer's lawyer (client link open) ──
  const b = await createDeal(
    ctx,
    dealInput({
      assetType: "watercraft",
      assetName: "M/Y SERENITY BAY — 34m Sanlorenzo (2021)",
      assetDetails: { builder: "Sanlorenzo", model: "SL106", year: "2021", lengthM: "34", flag: "Cayman Islands" },
      priceAmount: 9_200_000,
      expectedClosing: isoDate(45),
    }),
  );
  await addParty(org, b.id, { role: "seller", kind: "entity", fullName: "Serenity Marine Ltd", jurisdiction: "MT", entityType: "company" }, me, opts);
  const { link } = await createKycRequest(ctx, b.id, {
    recipientName: "Maître Hélène Duval",
    recipientEmail: "h.duval@cabinet-duval.example",
    message: "Dear Maître Duval, as discussed, please complete your client's due-diligence file for M/Y SERENITY BAY.",
    send: true,
  });

  // ── C. Private jet: PEP beneficial owner, approved by senior management, Art. 74 report filed ──
  const c = await createDeal(
    ctx,
    dealInput({
      assetType: "aircraft",
      assetName: "Gulfstream G650ER — MSN 6xxx (2021)",
      assetDetails: { builder: "Gulfstream", model: "G650ER", year: "2021", registration: "M-ABCD (fictional)", msn: "6xxx" },
      ourRole: "buyer_broker",
      priceAmount: 46_000_000,
      currency: "USD",
      paymentMethod: "escrow",
      fundsOriginCountry: "CH",
      expectedClosing: isoDate(-12),
    }),
  );
  const helios = await addParty(org, c.id, { role: "buyer", kind: "entity", fullName: "Helios Aviation Holdings Ltd", jurisdiction: "IM", entityType: "company" }, client, opts);
  const pep = await addParty(org, c.id, { role: "beneficial_owner", kind: "person", fullName: "Tomasz Wierzbicki-Lange", dateOfBirth: "1975-03-03", nationality: "PL", residenceCountry: "CH", ownershipPct: 100, parentPartyId: helios.id, idDocType: "Passport", idDocNumber: "PL-0000002 (fictional)", idDocExpiry: isoDate(1200) }, client, opts);
  for (const [cat, title, pid] of [
    ["certificate_of_incorporation", "Certificate of Incorporation", helios.id],
    ["register_of_directors", "Register of Directors", helios.id],
    ["register_of_members", "Register of Members", helios.id],
    ["good_standing", "Certificate of Good Standing", helios.id],
    ["passport", "Passport", pep.id],
    ["proof_of_address", "Utility Bill", pep.id],
    ["pep_declaration", "PEP Declaration", pep.id],
    ["ubo_declaration", "Beneficial Ownership Declaration", null],
    ["board_resolution", "Board Resolution", null],
    ["source_of_funds", "Escrow Agent Confirmation", null],
    ["source_of_wealth", "Source of Wealth Report (accountant)", null],
    ["sale_agreement", "Aircraft Purchase Agreement", null],
  ] as const) {
    await storeDocument(org, c.id, doc(title, "Helios Aviation Holdings Ltd", "Gulfstream G650ER"), { category: cat, partyId: pid }, client, "demo", opts);
  }
  const [pepScreen] = await db.select().from(screenings).where(and(eq(screenings.partyId, pep.id), eq(screenings.status, "potential_match"))).limit(1);
  if (pepScreen) {
    await resolveScreening(ctx, pepScreen.id, "true_match", "Confirmed PEP: CEO of a state-owned energy company (fictional). Source of wealth corroborated by accountant's report; EDD applied.");
  }
  await decideDeal(ctx, c.id, "approved", "EDD completed: PEP status confirmed, source of wealth corroborated, funds via regulated escrow agent in Geneva. Approved by senior management.");
  await completeDeal(ctx, c.id, isoDate(-12));
  await prepareReport(ctx, c.id);
  await markReportSubmitted(ctx, c.id, "TRACFIN-2026-000000 (fictional)", isoDate(-5));

  // ── D. Hypercar: crypto-funded, high risk, evidence missing ──
  const d = await createDeal(
    ctx,
    dealInput({
      assetType: "motor_vehicle",
      assetName: "Ferrari Daytona SP3 (2023, 900 km)",
      assetDetails: { builder: "Ferrari", model: "Daytona SP3", year: "2023", vin: "ZFF00000000000000 (fictional)" },
      ourRole: "dealer",
      priceAmount: 2_400_000,
      paymentMethod: "crypto",
      fundsOriginCountry: "AE",
      expectedClosing: isoDate(10),
      flags: { unusualUrgency: true },
    }),
  );
  const julien = await addParty(org, d.id, { role: "buyer", kind: "person", fullName: "Julien Marchetti", dateOfBirth: "1988-11-23", nationality: "FR", residenceCountry: "AE" }, me, opts);
  await storeDocument(org, d.id, doc("Passport", "Julien Marchetti", "France"), { category: "passport", partyId: julien.id }, me, "demo", opts);

  // ── E. Charter (France): low risk, outside Article 74 ──
  const e = await createDeal(
    ctx,
    dealInput({
      assetType: "watercraft",
      assetName: "Charter of M/Y ALBA — 2 weeks, August 2027",
      transactionType: "charter",
      ourRole: "charter_broker",
      priceAmount: 1_200_000,
      fundsOriginCountry: "US",
      expectedClosing: isoDate(60),
    }),
  );
  const rebecca = await addParty(org, e.id, { role: "buyer", kind: "person", fullName: "Rebecca Thornton", dateOfBirth: "1979-06-14", nationality: "US", residenceCountry: "US" }, me, opts);
  await storeDocument(org, e.id, doc("Passport", "Rebecca Thornton", "United States"), { category: "passport", partyId: rebecca.id }, me, "demo", opts);
  await storeDocument(org, e.id, doc("Proof of Address", "Rebecca Thornton"), { category: "proof_of_address", partyId: rebecca.id }, me, "demo", opts);
  await storeDocument(org, e.id, doc("Bank Statement", "Charter fee + APA from own account"), { category: "source_of_funds", partyId: null }, me, "demo", opts);
  await storeDocument(org, e.id, doc("MYBA Charter Agreement", "M/Y ALBA"), { category: "sale_agreement", partyId: null }, me, "demo", opts);
  await decideDeal(ctx, e.id, "approved", "Standard due diligence complete. US resident, funds from own account at a US bank. No adverse findings.");

  // ── F. Sanctioned buyer caught by screening: rejected ──
  const f = await createDeal(
    ctx,
    dealInput({ assetType: "watercraft", assetName: "M/Y NORDIC STAR — 41m (2015)", priceAmount: 12_000_000, fundsOriginCountry: "CY", expectedClosing: isoDate(40) }),
  );
  const nz = await addParty(org, f.id, { role: "buyer", kind: "entity", fullName: "Novaya Zarya Holding Ltd", jurisdiction: "CY", entityType: "company" }, client, opts);
  const [nzScreen] = await db.select().from(screenings).where(and(eq(screenings.partyId, nz.id), eq(screenings.status, "potential_match"))).limit(1);
  if (nzScreen) {
    await resolveScreening(ctx, nzScreen.id, "true_match", "Exact entity name and Cypriot jurisdiction match the listed holding company. Escalated to the MLRO.");
  }
  await decideDeal(ctx, f.id, "rejected", "Buyer entity is on a sanctions list (fictional demo list). Business refused; asset-freeze and STR obligations assessed by the MLRO.");

  // Files A and D arrived through the client portal / dealer and are under compliance review.
  const { recomputeRisk, setDealStatus } = await import("@/lib/deals/service");
  await setDealStatus(org.id, a.id, ["draft", "collecting"], "review");
  await setDealStatus(org.id, d.id, ["draft", "collecting"], "review");
  // Settle every risk score once (silently) after seeding.
  for (const id of [a.id, b.id, c.id, d.id, e.id, f.id]) await recomputeRisk(org, id, { silent: true });

  const path = new URL(link).pathname;
  await db.update(organizations).set({ settings: { demoClientLink: path } }).where(eq(organizations.id, org.id));
  return { user, org };
}

export async function purgeExpiredDemos(now = new Date()) {
  const db = await getDb();
  const removed = await db
    .delete(organizations)
    .where(and(eq(organizations.isDemo, true), lt(organizations.demoExpiresAt, now)))
    .returning({ id: organizations.id });
  return removed.length;
}
