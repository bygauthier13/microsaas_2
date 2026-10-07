# Product Strategy — Ensign

> **Ensign** (*the flag a vessel flies to show its nationality*) produces the AML file for every superyacht, private-jet and hypercar deal. It covers buyer KYC through a discreet link, screening of the whole ownership chain, a high-value-goods risk score, an approval trail and the AMLR Article 74 threshold report. Each file takes minutes instead of weeks of email.

## 1. Problem
From **10 July 2027**, the EU AML Regulation (2024/1624) turns these businesses into *obliged entities*: anyone trading, or acting as an intermediary in the trade of, **yachts and aircraft above €7.5m** or **motor vehicles above €250k**, as a regular activity. That covers yacht brokers, shipyards, aircraft dealers and hypercar/collector-car dealers. France has already legislated, and its law also covers yacht **charters**. Monaco has regulated yacht sale and rental since 2022 and is **issuing fines now** (€50k to a yacht brokerage, Nov 2025).

Each deal needs these steps:
1. **Identify and verify the customer** and every beneficial owner. These are typically held through a BVI or Marshall Islands SPV, owned through a trust, owned by a Monaco or Dubai resident.
2. **Understand the purpose of the deal** and **source of funds and wealth.**
3. **Screen** for sanctions, PEPs and adverse media. One in eight yachting clients is a PEP according to Monaco's FIU.
4. **Apply enhanced due diligence** for high-risk countries. **Monaco and the BVI are now on both the EU high-risk list and the FATF grey list**, so EDD is the norm, not the exception.
5. **Get senior management approval** for PEPs and EDD cases.
6. **Report every qualifying sale to the FIU (Article 74),** even without suspicion.
7. **Keep everything for 5 years** and **monitor ongoing relationships.**

Today this is done by email, WhatsApp, Excel and a consultant's Word manual. Buyers' lawyers send documents piecemeal. Nobody re-screens after closing. Files are thin, which is exactly what regulators fine and what banks use to de-risk the industry.

## 2. Customer (ICP)
**Primary (beachhead):** superyacht brokerage firms with 2–50 staff, in **Monaco, Antibes/Cannes, Palma, Genoa/Viareggio and the Netherlands**, that sell or charter yachts above 30m.
- **Buyer:** the managing partner or head of sales, who signs the cheque, often with the office manager or compliance officer (MLRO).
- **Trigger:** an AMSF notice, a bank questionnaire, a lost deal because the file wasn't ready, or the 2027 deadline.

**Secondary:**
- Shipyard sales departments.
- Private-aircraft dealers and brokers in the EU.
- Franchise hypercar dealers and collector-car specialists and auction houses selling cars above €250k.

**Channel partners:** AML consultants (Monaco and Riviera), yacht lawyers, VAT and flag agents.

## 3. Existing solutions and why they fall short
See [`COMPETITORS.md`](./COMPETITORS.md). In short:
- **IDV platforms** use selfie flows built for fintech, charge per check and need a developer.
- **DNFBP suites** are relationship-centric, quote-based and heavy to configure.
- **Consultants** produce manuals, not a system of record.
- **Screening-only tools** cover one of the five steps.
- **Nobody** offers a high-value-goods deal file or Article 74 reporting.

## 4. The wedge (what we built)
1. **Deal file:** asset (yacht/aircraft/car), price, role, use, payment method.
2. **Discreet client link:** the buyer's representative submits the buyer, entity, UBOs, source of funds and wealth, payer and documents. No account, no selfie, and the link expires.
3. **Screening of every party** through OpenSanctions in production (sanctions + PEPs + crime lists, €0.10/check). A fictional watchlist is used in demo mode. Every *no-match* is kept as evidence.
4. **Risk engine** for high-value goods. It covers EU and FATF lists, PEP, third-party payer, crypto, cash, layering and secrecy jurisdictions. It outputs a level, the DD tier, the required documents and blockers, with legal references.
5. **Approval trail:** EDD requires an owner or admin (senior management) to sign off, with a reason.
6. **Article 74 detection and report pack:** a printable form plus JSON, with a due date and an FIU reference once submitted.
7. **One-click audit file:** a printable PDF of the whole file with its audit trail.
8. **Daily re-screening** of monitored parties, with alerts. This drives retention.

**Deliberately NOT built** (yet): selfie liveness, adverse-media crawling, a goAML XML export, transaction monitoring, an AML manual generator, multi-office permissions, SSO, mobile apps, multi-language UI and CRM features. See section 13.

## 5. Pricing
**Primary model: per-firm monthly subscription in EUR, tiered by seats and volume, with a 14-day free trial and no card required.**

| Plan | Monthly | Annual | For | Limits |
|---|---:|---:|---|---|
| **Starter** | €190 | €1,900 | Solo broker / boutique | 1 seat, 10 active deal files, 50 monitored parties |
| **Brokerage** *(most popular)* | **€490** | **€4,900** | Brokerage, yard sales team, dealer | 5 seats, unlimited deal files, 500 monitored parties, Article 74 packs, priority support |
| **Fleet** | from €1,250 | custom | Multi-office groups, shipyards | Unlimited seats, SSO, API, custom risk model |

**Why this model and price:**
- **The value per firm is high:**
  - A single fine is €18k–€800k in Monaco 2025–26.
  - Losing a bank account means lost revenue.
  - A sale commission on a €10m yacht is about €1m (10%).
  - Consultants charge €1k–€3k/month for outsourced compliance (*estimate*).
- **€490/month is under 0.05% of one commission** and cheaper than a part-time compliance officer.
- **Per-firm pricing, not per check,** because brokers hate surprises and do few, large deals. Per-check pricing is how incumbents lose this segment.
- **The trial needs no card,** because tech-averse buyers must see value first. The first deal file is the activation moment.
- **Founding-customer offer:** the first 20 firms get €390/month locked for 24 months via a Stripe promotion code. This creates urgency before the 2027 deadline.
- **Gross margin about 93%:**
  - About €10–€35/month of OpenSanctions calls per firm (100–350 checks).
  - About €5/month of infrastructure per firm.
  - Email is negligible.

## 6. £10k MRR mathematics
FX is indicative: €1 ≈ £0.86.

| Mix | Customers | MRR |
|---|---:|---:|
| Brokerage only (€490 ≈ £421) | **24** | £10,104 |
| Starter only (€190 ≈ £163) | 62 | £10,106 |
| Realistic mix: 1 Fleet + 16 Brokerage + 14 Starter | **31** | ≈ £10,100 |

**Funnel to 31 customers:**
- **Target list:** 1,500 firms (yacht brokerages, yards, central agents, EU jet dealers, hypercar and collector-car dealers).
- **Outreach:** an 8–12% reply rate on deadline-driven, personalised outreach gives about 150 conversations.
- **Trials:** about 60 trials, at 40% of conversations.
- **Paid:** about 35% trial → paid gives **about 21 customers from outbound.** Partners (consultants) and inbound (SEO on "AMLR yacht broker", the readiness quiz) add 10+.
- **Timeline:** 6–9 months, with the steepest part of the curve in Q1–Q2 2027 as the deadline approaches.

## 7. Market evidence (summary)
Full detail is in [`MARKET_RESEARCH.md`](./MARKET_RESEARCH.md).
- AMLR Articles 3(3)(f) and 74 are law and apply from 10 July 2027. AMLA finalised the CDD standards on 1 Oct 2026.
- Monaco's AMSF fined a yacht brokerage €50k (Nov 2025) and issued 700+ compliance notices.
- France's Loi 2025-532 covers yacht brokers, including charter, plus car and jet dealers.
- The Italian industry calls it a "tsunami" (Pressmare, Mar 2026). Shipyards say it's "already burdensome".
- 326 superyacht resales worth $3.51bn in H1 2026. 600+ yachts under construction.

## 8. Why now, and why 2026
- **The date is fixed and the standards are now final:** AMLR applies 10 July 2027 and the CDD RTS was finalised on 1 Oct 2026. Firms have nine months.
- **The risk lists flipped in 2025–26.** Monaco (EU 2025, FATF 2024), the BVI (FATF 2025, EU 2026) and Russia (EU 2026) went onto high-risk lists. EDD is now the default for the industry's standard deal shape.
- **Banks are de-risking yachting businesses.** A clean AML file is now a commercial necessity, not just a legal one.
- **2026 tooling makes a solo build credible:**
  - OpenSanctions gives pay-per-call global sanctions and PEP data, removing the $15k+ data licence barrier.
  - Free or cheap IDV (Didit) is available when needed.
  - Serverless Postgres, Stripe Checkout and transactional email are commodities.
  - AI-assisted engineering covers the rest.

## 9. Why a solo founder can win
- The product is small: about 15 screens, one core object (the deal) and one external data API.
- The market is small and concentrated. The relevant firms meet in person at roughly six events a year: Monaco Yacht Show, Cannes, Palma, MYBA Charter Show, Fort Lauderdale and Düsseldorf.
- Big vendors' unit economics don't work in this segment: few checks, many questions.
- Trust comes from precision. Firms buy from someone who uses their vocabulary — APA, central agent, MYBA, flag, SPV, Article 74 — and who quotes the law accurately.

## 10. Acquisition strategy
Detail is in [`FIRST_10_CUSTOMERS.md`](./FIRST_10_CUSTOMERS.md) and [`LAUNCH_PLAN.md`](./LAUNCH_PLAN.md).
1. **Founder-led outbound (primary):** LinkedIn and email to 300 named Monaco and Riviera brokers. The hook is the AMSF fine, Monaco being on the EU high-risk list and the 2027 deadline. The offer is to build their first AML file for free in 15 minutes.
2. **Consultant partners:** Monaco and Riviera AML consultants and yacht lawyers. They give revenue share (20% recurring) or a free seat, and our software makes them scalable.
3. **Inbound:**
   - The **AMLR readiness check** (a free 2-minute quiz that captures leads).
   - SEO pages for "AML for yacht brokers", "Article 74 threshold reporting", "AML for aircraft dealers" and "AML for luxury car dealers".
4. **Events:** walk the docks at Antibes and Palma. Book a seminar slot at MYBA Charter Show 2027 (April/May), timed for maximum deadline urgency.
5. **Associations:** member discount for MYBA, IYBA, Confindustria Nautica and the Monaco yachting cluster.

## 11. Retention: why they still pay in month 6 (and year 5)
- **Legal record retention.** Files must be kept 5 years. Leaving means exporting and re-hosting regulated records, a real switching cost that is entirely legitimate.
- **Ongoing monitoring.** Daily re-screening of past buyers and owners. A new sanctions designation alerts the firm, which is exactly the risk that made 2022 so painful for the industry.
- **Every new deal** starts in Ensign. It becomes the firm's compliance system of record and its evidence for the next AMSF or FIU inspection.
- **Recurring tasks:** periodic reviews of high-risk clients, Article 74 reports, document expiry and staff turnover.

## 12. Pain-killer test

| Question | Answer |
|---|---|
| Removes a painful task? | Yes: chasing KYC by email, assembling files, screening each name by hand. |
| Saves time? | Yes: 5–15 hours per deal down to under 1 hour (*estimate, to be validated*). |
| Makes money? | Indirectly: deals close without compliance delays, and banks keep accounts open. |
| Prevents money being lost? | Yes: €18k–€800k fines, and frozen deals with sanctioned parties. |
| Reduces risk? | Yes: legal, criminal (facilitation) and reputational. |
| ROI understandable? | One avoided fine equals 8–130 years of subscription. |

## 13. Main risks and mitigations

| Risk | Mitigation |
|---|---|
| **Firms wait until mid-2027.** | Monaco is enforcing *now*, France can start earlier by decree, and banks ask today. Lead with Monaco and France. |
| **Liability or trust.** A solo vendor selling compliance software. | Precise legal references and clear "decision support, not legal advice" positioning. EU hosting. Encryption at rest. Security page. Consultant partnerships. |
| **Regulatory detail shifts** (FIU report formats, thresholds by national decree). | Lists and thresholds are configuration, not code. The report pack is format-agnostic (PDF + JSON) until FIUs publish schemas. |
| **Low deal volume per firm** makes the subscription feel optional. | Monitoring and the retention obligation make it continuous. Starter plan for small firms. |
| **Data sensitivity** (passports of UHNW buyers). | Encrypted documents (AES-256-GCM), minimal client-portal exposure, expiring links, audit log. Roadmap: EU object storage, customer-managed keys, SOC 2-lite controls. |
| **Incumbent vendors move down-market.** | Vertical depth (Article 74, broker workflow), pricing transparency, consultant channel, and speed. |

## 14. Rejected finalists, and why
- **Art market AML:** a real pain, but an insider incumbent (ArtAML), a fragmented price-sensitive market and a lower price ceiling. It is an adjacent expansion later (AMLR Art. 3(3)(i), cultural goods).
- **Luxury watch dealers:** a bigger market, but less "forgotten", price-sensitive, and already targeted by IDV and watch-ops vendors. It is the **phase-2 expansion** of the same engine (Annex IV threshold €10k).
- **Muirburn and grouse licensing:** new law (15 Sept 2026), but the whole market is a few hundred estates. Fails the £10k test.
- **Investment-migration operators:** a shrinking market as EU golden-visa schemes close.
- **Superyacht APA:** a daily pain, but an incumbent (Voly), seasonal revenue, crew churn and no deadline. A possible future module.

## 15. Roadmap after the first 10 customers
1. Optional ID-document check via an IDV partner (e.g. Didit) for non-UHNW buyers.
2. Adverse-media screening via OpenSanctions or a news API.
3. FIU-specific exports (goAML XML) as FIUs publish Article 74 schemas.
4. AML policy and business-wide risk assessment generator, with a training log (French law requires approved training).
5. Multi-entity groups and SSO (Fleet plan).
6. Expansion verticals: watches and jewellery (€10k), art (€10k), collector-car auctions.
