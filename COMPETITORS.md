# Competitors

Ensign's customers today choose between five options. None of them was built for a superyacht or private-aircraft deal.

## 1. The landscape

| Category | Examples | Price (published or indicative) | Built for | Why it fails a yacht broker |
|---|---|---|---|---|
| **Status quo** | Email, WhatsApp, Excel, Word templates, scanned passports in Dropbox | "Free", but takes 5–15 broker and admin hours per deal (*estimate*) | — | No audit trail. Documents scattered across inboxes. No re-screening. It is exactly the "superficial KYC" and "outdated policies" the AMSF fined a Monaco brokerage €50k for in Nov 2025. |
| **Compliance consultants** | Rosemont Consulting (Monaco), GCG Monaco, law firms (Hill Dickinson, HFW, etc.) | AML manual about €5k–€20k one-off; outsourced compliance officer about €1k–€3k/month (*estimate*) | Policies, training, audits | They produce a manual, not a workflow. The AMSF explicitly sanctioned "improper delegation of compliance functions to unqualified third parties". **Consultants are a channel for us, not a competitor:** they need a tool to put their clients on. |
| **Enterprise screening** | Refinitiv World-Check, Dow Jones, LexisNexis | From about $15k/year, averaging about $113k/year ([Sanctions Checklist analysis](https://sanctionschecklist.com/compare)) | Banks | Sold through sales calls and annual contracts. Screening only — no CDD file, no client portal. |
| **Identity-verification platforms** | Sumsub, Onfido/Entrust, Veriff, Shufti Pro, Signicat, iDenfy, ComplyCube, Didit | Per check, about $1–5 each with monthly minimums (Didit offers free core KYC with paid add-ons) ([Didit](https://didit.me/blog/kyc-costs-explained-pricing-models-hidden-fees-revealed/)) | High-volume consumer onboarding (fintech, crypto, marketplaces) | Selfie and liveness flows are culturally wrong for a principal buying a €40m yacht through his lawyer. They don't model **SPV → trust → UBO** chains collected from a representative. No deal object, no Article 74 report, no broker vocabulary, and they need a developer to integrate. |
| **AML suites for regulated professions (DNFBPs)** | SmartSearch (UK; ABYA partner), LEXCO KYC Portal (resold by Rosemont), Vertex Compliance, First AML (law/accounting/real estate, ANZ & UK), Thirdfort / Credas (UK property & legal), ArtAML (art) | Quote-based; usually per check plus platform fee | Lawyers, accountants, estate agents, art dealers | Built around a client relationship, not a single high-value deal with a buyer, seller, payer and SPV. Generic risk factors. No high-value-goods thresholds. UK-centric (SmartSearch, Thirdfort) or art-centric (ArtAML). Heavy configuration (LEXCO is "fully customisable", which means it needs a consultant). |
| **Screening-only self-serve** | ComplyAdvantage (from $119/month for 100 entities), Sanctions Checklist, sanctions.io, OpenSanctions API (€0.10/call) | $50–$500/month | Exporters, compliance teams | Covers one step of the five. Still needs the file, client collection, risk scoring, approval and reporting. **OpenSanctions is our data supplier, not a competitor.** |
| **Yacht operations software** | Voly (APA and finance), Seahub, Deep Blue, IDEA Yacht, Yachtfolio / Ankor (charter brokerage) | €50–€500/month | Captains, managers, charter brokers | No brokerage AML at all. These are possible **integration partners**. |

## 2. What buyers love and hate (inferred from reviews, articles and regulator findings)

**What they love:**
- Speed: "the vast majority of transactions will be quick to check" (ArtAML's pitch).
- Not being made to feel stupid: tools that are "not frightening" for tech-averse dealers.
- One-click evidence: Sanctions Checklist's PDF that proves a no-match.
- Discretion: luxury clients expect "discretion, authenticity and confidence" (Signicat).

**What they hate:**
- Per-check fees and sales calls before seeing a price.
- Selfie flows for principals.
- Generic questionnaires that ask a billionaire's lawyer for a utility bill.
- Tools that need a developer.
- Compliance theatre: manuals nobody follows.
- Being told by their bank that their account is under review because their files are thin.

**What the regulator hates (AMSF sanction findings, 2025):**
- Outdated policies.
- Superficial KYC.
- No documented source-of-funds checks, especially for crypto-funded purchases.
- No documented risk assessment.
- No periodic review of high-risk clients.
- Late suspicious-transaction reports.
- Delegating compliance to unqualified third parties.

## 3. Our wedge

> **Existing complex/expensive solution:** an IDV platform plus a screening subscription plus a consultant-written manual, glued together with email.
> **Ensign:** the *20%* that matters for a high-value deal, done extremely well and set up in 5 minutes.

1. **Deal-first, not customer-first.** Each file is one transaction (asset, price, parties, payer), which is how brokers think and how Article 74 reports.
2. **Representative-led KYC.** A discreet, branded secure link for the buyer's lawyer or family office to submit the whole ownership chain and documents. No selfie, no app, no account.
3. **Screen everyone in the chain** — buyer, SPV, trustees, UBOs, payers, representatives — and keep evidence of every *no match*.
4. **High-value-goods risk model out of the box.** It covers the EU high-risk list (now including Monaco, BVI and Russia), FATF lists, PEPs, third-party payers, crypto, cash above €10k and layered structures. Each factor cites its legal basis.
5. **Article 74 threshold detection and report pack.** Neither the IDV vendors nor the screening tools offer this.
6. **An audit-ready file in one click,** plus **daily re-screening** of every party for 5 years, which is the legal retention period.
7. **Self-serve pricing published on the website,** with a 14-day trial and no sales call.

## 4. Feature and price comparison

| | Email + Excel | Consultant | IDV platform | DNFBP AML suite | Screening-only | **Ensign** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Deal-centric file (asset, price, parties) | ✗ | ✗ | ✗ | ◐ | ✗ | **✓** |
| Ownership chain via buyer's representative | ✗ | ✗ | ◐ | ◐ | ✗ | **✓** |
| Sanctions / PEP screening with no-match evidence | ✗ | ◐ | ✓ | ✓ | ✓ | **✓** |
| High-value-goods risk model with legal references | ✗ | ◐ (in a PDF) | ✗ | ◐ | ✗ | **✓** |
| Article 74 threshold report pack | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Senior-management approval trail for EDD | ✗ | ✗ | ✗ | ◐ | ✗ | **✓** |
| Ongoing monitoring (daily re-screen) | ✗ | ✗ | ◐ | ✓ | ✓ | **✓** |
| Setup time | — | Weeks | Days (developer) | Days to weeks | Minutes | **5 minutes** |
| Published price | — | No | Partly | No | Yes | **Yes (€190–€490/mo)** |

## 5. Competitive risks and responses

| Risk | Likelihood | Response |
|---|---|---|
| An IDV vendor launches a "luxury" vertical | Medium | Their economics depend on per-check volume, and yacht brokers generate few checks per year, so they are unlikely to build deal files. **We can use them** (e.g. Didit) as an optional ID step. |
| SmartSearch / LEXCO localise for EU yacht brokers | Medium | Win on vocabulary, Article 74, speed and published pricing. Partner with consultants who resell. |
| An association (MYBA) endorses a single vendor | Medium | Become that vendor: offer MYBA a member discount and AMLR webinars before the 2027 charter show season. |
| Brokers pay a consultant and ignore software | High at first | The consultant needs a system of record, so sell **through** them (partner plan). |
