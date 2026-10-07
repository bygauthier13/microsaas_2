# Market Research

**Date:** 7 October 2026
**Question:** Which painful, monetisable problem in a wealthy, small, overlooked industry can one founder solve with a tiny product, with a credible path to £10k+ MRR?

**Answer (TL;DR):** AML (anti-money-laundering) compliance for **superyacht brokers**, plus private-aircraft and hypercar/collector-car dealers.

A new EU law (AMLR, Regulation (EU) 2024/1624) makes these businesses *obliged entities* for the first time from **10 July 2027**. Monaco is already fining yacht brokerages (€50,000 in November 2025). France has already passed its own national law, which also covers yacht **charters**. And the EU now classes **Monaco and the British Virgin Islands** — the default domicile and default ownership vehicle of the superyacht world — as high-risk jurisdictions.

These firms are rich, few in number, and have never had to do formal KYC. They now face a hard deadline. Nobody sells them a tool built for how their deals actually work.

---

## 1. Method

1. **Reverse-engineered tiny compliance and vertical software businesses** to find patterns that work for a solo founder (section 2).
2. **Screened wealthy, small, neglected industries.** Examples: superyachts, private aviation, hypercars, fine art, fine wine, bloodstock, sporting estates, UHNW households, football agents, investment migration.
3. **Looked for pain signals in 2025–2026 sources.** Sources were trade press (SuperyachtNews, Pressmare, Boating Industry), regulator publications (AMSF Monaco, AMLA, FATF, EUR-Lex), law-firm and consultancy notes, vendor content and competitor pricing pages.
4. **Scored 23 opportunities on 16 weighted criteria** (section 5). Ran the £10k MRR test on the finalists (section 6).
5. **Picked one** (section 7). Detailed competitor analysis is in [`COMPETITORS.md`](./COMPETITORS.md). Strategy is in [`PRODUCT_STRATEGY.md`](./PRODUCT_STRATEGY.md).

> Honesty note: facts marked with a source were checked this session (October 2026). Numbers labelled *estimate* are my own reasoned estimates and should be validated in customer conversations. Items marked *(background knowledge)* come from prior knowledge and were not re-verified this session.

---

## 2. Pattern library: tiny businesses that won on a regulatory or vertical wedge

| Business | What they sold | Who paid | Pain | How they won | Lesson for us |
|---|---|---|---|---|---|
| **First AML** (NZ, launched July 2018) | Customer-due-diligence platform for complex entities | Lawyers, accountants, real-estate agents newly covered by NZ AML "Phase 2" | A new legal obligation, done by email and paper | Founders were ex-bankers who knew the KYC pain. They had "customers from day one" and later raised a NZ$30m Series B ([Startup Daily](https://www.startupdaily.net/2021/11/new-zealand-anti-money-laundering-startup-first-aml-raises-30-million-series-b/)) | **When regulation is extended to a new profession, a focused vertical tool wins early.** |
| **ArtAML** (UK, 2018–2020) | Step-by-step CDD, screening and records for art dealers | Galleries and art dealers covered by UK MLR from Jan 2020 (≥ €10k) | "Confusing new anti-money-laundering rules", tech-averse users ([Artnet, 2020](https://news.artnet.com/art-world/artaml-money-laundering-uk-art-1889876)) | An insider founder; "built not to be frightening"; launched at the deadline | Industry credibility plus a non-intimidating UX beats generic KYC. HMRC has since fined 35 art businesses in 6 months, including £158,679 for one gallery ([Artnews](https://www.artnews.com/art-news/news/uk-art-businesses-fined-money-laundering-compliance-aml-1234736548), [The Art Newspaper](https://www.theartnewspaper.com/2025/09/23/money-laundering-crackdown-continues-as-dealer-faces-a-fine-of-more-than-%C2%A3150000)) |
| **Sanctions Checklist** | Self-serve sanctions screening, with "no-match" evidence in a PDF | Exporters, law firms, consultants, universities | Enterprise screening costs $15k–$113k a year and needs a sales call ([sanctionschecklist.com/compare](https://sanctionschecklist.com/compare)) | Monthly self-serve plans, no sales call, **evidence** as the product | Sell the **audit trail**, not the search. |
| **Horsebills** | Owner-percentage billing for racehorse trainers | Trainers and farms | Splitting monthly bills across syndicates | Narrow job, done well, at **US$34.99/month** ([horsebills.com](https://horsebills.com/owner-percentages-bulk-invoicing/)) | Niche tools survive, but this niche's price ceiling is low. That is why we rejected it. |
| **TaxJar, Quaderno/Taxamo, Cookiebot, iubenda** *(background knowledge)* | Sales-tax, EU VAT-MOSS and GDPR consent compliance | SMBs hit by a new rule (Wayfair 2018, VAT MOSS 2015, GDPR 2018) | Legal deadline, plus complexity | Tiny teams that rode a date-certain obligation, with self-serve pricing and SEO on the regulation's name | **The deadline is the marketing.** Own the search terms for the regulation. |

**Five rules we took from these businesses**
1. A hard legal date creates urgency that no marketing can buy.
2. Customers pay for **evidence that survives an inspection**, not for features.
3. Insider-grade vocabulary and workflow beat horizontal tools in conservative industries.
4. Self-serve pricing (no sales call) wins small firms. Associations and consultants supply the distribution.
5. A legal record-retention duty (5 years) is a built-in retention mechanism.

---

## 3. Pain signals (2025–2026)

### 3.1 The law: what changes, and when
- **AMLR Article 3(3)(f):** "persons trading, as a regular or principal professional activity, in high-value goods" become obliged entities ([AMLR Art. 3 via LawPlayer](https://lawplayer.com/eu/article/32024R1624/art_3)).
- **The thresholds:** motor vehicles > €250,000; watercraft and aircraft > €7,500,000 ([CMS](https://cms.law/en/aut/legal-updates/aml-regulation-new-obligations-for-the-automotive-sector-from-10-july-2027); [Rosemont](https://rosemont-int.com/article/news/new-aml-obligations-for-yacht-brokers-real-estate-developers-car-and-jet-brokers-in-france)).
- **AMLR Article 74 ("objective reporting"):** traders must report to the FIU **all** sales of such goods acquired for non-commercial purposes, *with or without suspicion*. Recital 20 says this includes sales to companies "set up to administer the wealth of their beneficial owner", i.e. the typical yacht-owning SPV ([AMLR Art. 74 via LawPlayer](https://lawplayer.com/eu/article/32024R1624/art_74); [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2024/1624/oj/eng)).
- **Application date:** 10 July 2027, directly applicable in all 27 Member States, with no national transposition. The EU-wide cash ceiling of €10,000 applies from the same date ([SuperyachtNews, Jan 2026](https://www.superyachtnews.com/operations/2026--the-year-europe-quietly-rewrites-the-superyacht-rulebook)).
- **France got there first.** Loi n° 2025-532 (13 June 2025, the "narcotrafic" law) adds car sellers, yacht brokers (**sale and leasing/charter**), private-aircraft dealers and others to Article L.561-2. Its start date is set by decree, **no later than 10 July 2027**, and approved training becomes mandatory ([Rosemont, Aug 2025](https://rosemont-int.com/article/news/new-aml-obligations-for-yacht-brokers-real-estate-developers-car-and-jet-brokers-in-france)).
- **AMLA final draft RTS on Customer Due Diligence (Art. 28(1)), published 1 October 2026.** This fixes the minimum information to collect at standard, simplified and enhanced CDD. Its 24 March 2026 hearing drew more than 1,600 stakeholders ([Regulation Tomorrow](https://www.regulationtomorrow.com/2026/10/amla-finalises-key-standards-for-the-private-sector/); [Shufti Pro news](https://shuftipro.com/news/amla-final-eu-due-diligence-rules/)).

### 3.2 Enforcement is already happening (Monaco)
- **18 Nov 2025:** the AMSF fined a Monaco **yacht brokerage €50,000**. The failings were "outdated policies, superficial KYC, insufficient source of funds checks (including a Bitcoin-funded purchase), and improper delegation of compliance functions to unqualified third parties".
- Other fines in the same series: €60,000 for a precious-metals dealer, €18,000 for a small real-estate agency whose procedures dated from 2010, and €800,000 for a TCSP.
- **More than 700 Monaco entities received formal compliance notices** by mid-2025 ([Rosemont, May 2026](https://rosemont-int.com/article/news/summary-of-amsf-and-legal-profession-sanctions-in-monaco-20252026)).
- Monaco's national risk assessment ranks **yachting as its #1 financial-crime vulnerability**. "One in eight" yachting clients is a PEP. Banks show "a new reluctance to open and maintain accounts for the industry" ([ACAMS](https://www.acams.org/en/news/monaco-targets-key-aml-vulnerability-luxury-yachts); [Rosemont](https://rosemont-int.com/article/news/aml-obligations-in-high-value-yachting-a-positive-development-for-the-industry)).

### 3.3 The risk lists now hit the core of the superyacht world
- **EU high-risk third countries (as of 29 Jan 2026), 26 jurisdictions.** The list includes **Monaco** (added 2025), the **British Virgin Islands** and **Russia** (added 2026) ([Bird & Bird summary](https://cm.twobirds.com/en/insights/2026/eu-list-of-highrisk-countries-and-jurisdictions-for-money-laundering-and-terrorism-financing-amended); [EUR-Lex 2026/46](https://eur-lex.europa.eu/eli/reg_del/2026/46/oj/eng)).
- **FATF grey list after the 19 June 2026 plenary, 22 jurisdictions.** It includes **Monaco**, the **Virgin Islands (UK)** and **Bulgaria** ([DIA NZ](https://www.dia.govt.nz/AML-CFT-Jurisdictions-under-increased-monitoring-June-2026); [AML UAE](https://amluae.com/fatf-grey-list-countries-update-19th-june-2026/)).
- **What this means:** a typical deal — a BVI company, owned through a trust, by a Monaco resident — now triggers enhanced due diligence by default. This is the exact deal shape our product is built around.

### 3.4 The industry's own voice
- **Italy, March 2026.** At a meeting with the Bank of Italy FIU, Confindustria Nautica and Azimut-Benetti, Pressmare reported the sector fears "a tsunami". Azimut-Benetti's counsel said the requirements "are already burdensome, and we are concerned they may be further expanded". The meeting worried about objective reporting "impacting client relations" and about penalties based on total company turnover. "The discussion raised more questions than answers" ([Pressmare, 20 Mar 2026](https://www.pressmare.it/en/media/press-mare/2026-03-20/yachting-and-anti-money-laundering-regulations-88834)).
- **SuperyachtNews (Jan 2026):** "Treat every high-value transaction as an AML exam. Thin files invite delay at best – and regulatory friction at worst." Brokers should "deliver 'boringly complete' files at closing".
- **UK (not yet legally obliged).** ABYA, the UK yacht brokers' association, partnered with SmartSearch so members can verify buyers and sellers, which shows demand even before a mandate ([Boating Industry](https://boatingindustry.com/news/2022/08/23/abya-partners-with-smartsearch/)).
- **Monaco consultancies already sell this work.** They offer AML manuals, outsourced compliance officers and the LEXCO KYC Portal to yacht brokers ([Rosemont services](https://rosemont-int.com/zh/article/compliance/aml-compliance-support-services-summary)). This is evidence of budget; the services are consultant-heavy and expensive.

### 3.5 Vendors are circling, but horizontally
Signicat (Feb 2026), Shufti Pro, Didit, iDenfy and Joinble (May 2026) all publish "AMLR and luxury" content ([Signicat](https://www.signicat.com/blog/amlr-and-the-high-value-and-luxury-sectors); [Joinble](https://joinble.io/en/blog/amlr-non-financial-obliged-entities-kyc-2027); [iDenfy](https://idenfy.com/blog/aml-requirements-private-aviation/)).
- **What they sell:** identity verification (selfie, liveness, document OCR) built for high-volume consumer onboarding.
- **What none of them ship:** a deal-centric file that collects an SPV's ownership chain from the buyer's lawyer, screens every person in it, scores the deal against the high-value-goods risk factors, and produces the Article 74 report.
- This confirms the demand **and** the gap.

---

## 4. Market size

| Metric | Figure | Source |
|---|---|---|
| Pre-owned superyachts (>30m) sold, H1 2026 | 326 sales, US$3.51bn (+15% value YoY) | [Top Yacht Design / Fraser](https://top-yachtdesign.com/superyachts-market-sales-first-quarter-2026/), [Pressmare](https://www.pressmare.it/en/media/press-mare/2026-04-01/superyacht-market-26-fewer-units-higher-values-fraser-report-88937) |
| Superyacht sales (>30m), Q1 2026 | 80 sales, €971m | Pressmare / Fraser |
| Yachts >30m listed for sale | ~1,210 | Pressmare / Fraser |
| Superyachts >30m under construction | 600+ | [Pressmare, June 2026](https://pressmare.it/en/media/press-mare/2026-06-15/superyacht-new-build-market-2026-90724) |
| MYBA member companies | ~120 | [superyachts.com](https://www.superyachts.com/yacht-brokers/associations/myba.htm) |
| Monaco companies in the superyacht ecosystem | 252 (2022) | ACAMS |
| EU + Monaco yacht brokerages, yards and central agents in scope | **400–700** | *estimate* |
| EU aircraft dealers/brokers trading ≥ €7.5m | **150–300** | *estimate* |
| EU dealers/auctioneers regularly selling vehicles ≥ €250k (franchise hypercar, collector-car specialists, auction houses) | **1,500–3,000** | *estimate* |
| **Serviceable market at launch** | **~2,000–4,000 firms** | *estimate* |

At €490/month we need about **24 firms for £10k MRR**, which is 1% or less of the serviceable market.

---

## 5. Opportunity shortlist and scoring (23 ideas)

**Scale:** 1–10, where 10 is best. For *Comp*, 10 means little competition. For *MVP*, 10 means a simple MVP.

**Weights:** Pain ×3, WTP ×3, Frequency ×1, Market size ×1, Competition ×2, Reach ×2, MVP simplicity ×1, Tech feasibility ×1, Time-to-revenue ×2, Recurring ×2, Gross margin ×1, Retention ×2, Viral/referral ×1, Founder independence ×1, 2026 tailwind ×2, **Golden-rule fit ×3**. Golden-rule fit means the industry is wealthy, small and forgotten, and will reply.

| # | Opportunity | Pain | WTP | Freq | Mkt | Comp | Reach | MVP | Tech | TTR | Recur | GM | Ret | Viral | Indep | 2026 | Gold | **Weighted** |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **AML deal files for superyacht / jet / hypercar dealers (EU AMLR + Monaco)** | 9 | 9 | 6 | 6 | 8 | 8 | 6 | 8 | 7 | 9 | 9 | 9 | 6 | 8 | 10 | 10 | **8.39** |
| 2 | Art market participant AML (UK/EU galleries) | 7 | 6 | 7 | 7 | 5 | 7 | 6 | 8 | 6 | 8 | 9 | 8 | 5 | 8 | 7 | 7 | **6.86** |
| 3 | Luxury watch dealer AMLR compliance (>€10k) | 7 | 5 | 8 | 8 | 5 | 6 | 6 | 8 | 6 | 8 | 9 | 8 | 5 | 8 | 9 | 5 | **6.68** |
| 4 | Scottish muirburn / grouse licence record-keeping | 6 | 5 | 5 | 2 | 8 | 7 | 8 | 8 | 6 | 6 | 9 | 7 | 5 | 8 | 8 | 8 | **6.64** |
| 5 | Investment-migration operator AMLR compliance | 7 | 7 | 6 | 2 | 6 | 6 | 6 | 8 | 5 | 8 | 9 | 8 | 4 | 8 | 6 | 6 | **6.46** |
| 6 | Superyacht charter APA management | 7 | 6 | 8 | 5 | 5 | 6 | 7 | 8 | 6 | 6 | 8 | 6 | 6 | 8 | 4 | 8 | **6.39** |
| 7 | Collector car / art auction bidder KYC | 6 | 6 | 6 | 4 | 5 | 6 | 6 | 8 | 5 | 6 | 9 | 6 | 5 | 7 | 8 | 7 | **6.21** |
| 8 | Corporate aircraft SIFL / entertainment-disallowance tracker (US) | 6 | 7 | 6 | 5 | 5 | 5 | 6 | 7 | 5 | 7 | 9 | 8 | 3 | 8 | 3 | 7 | **6.07** |
| 9 | UHNW tax-residency day tracking | 7 | 7 | 6 | 6 | 3 | 4 | 5 | 6 | 4 | 8 | 9 | 7 | 4 | 7 | 5 | 7 | **6.00** |
| 10 | Racehorse trainer owner billing & syndicate splits | 7 | 4 | 8 | 5 | 5 | 6 | 6 | 8 | 6 | 8 | 8 | 8 | 5 | 8 | 3 | 5 | **6.00** |
| 11 | Prime-property buying-agent off-market inbox parser | 6 | 6 | 8 | 4 | 5 | 6 | 5 | 6 | 5 | 7 | 7 | 6 | 5 | 6 | 6 | 7 | **6.00** |
| 12 | UHNW household / estate operations | 5 | 7 | 7 | 4 | 6 | 3 | 5 | 8 | 3 | 8 | 9 | 8 | 3 | 8 | 3 | 8 | **5.93** |
| 13 | Football agent compliance & CRM (AMLR 2029) | 5 | 6 | 5 | 6 | 5 | 6 | 6 | 8 | 4 | 7 | 9 | 7 | 5 | 8 | 5 | 6 | **5.93** |
| 14 | Superyacht crew hours-of-rest / MLC logs | 6 | 5 | 9 | 5 | 3 | 6 | 7 | 9 | 5 | 7 | 9 | 7 | 5 | 8 | 3 | 6 | **5.89** |
| 15 | EUDR due-diligence statements for importers | 7 | 6 | 7 | 8 | 3 | 5 | 5 | 6 | 5 | 8 | 8 | 8 | 4 | 6 | 7 | 3 | **5.86** |
| 16 | Classic-car restoration client progress portal | 4 | 5 | 6 | 5 | 5 | 6 | 7 | 8 | 6 | 6 | 9 | 6 | 6 | 8 | 4 | 6 | **5.71** |
| 17 | Post-Brexit horse movement paperwork | 7 | 5 | 6 | 4 | 6 | 6 | 5 | 6 | 5 | 5 | 8 | 5 | 6 | 6 | 5 | 6 | **5.68** |
| 18 | Diamond memo / consignment tracking | 6 | 5 | 8 | 5 | 5 | 4 | 6 | 8 | 4 | 7 | 9 | 7 | 6 | 8 | 3 | 5 | **5.64** |
| 19 | Shooting-estate guest certificates & game book | 4 | 4 | 5 | 3 | 6 | 6 | 8 | 9 | 5 | 6 | 9 | 6 | 5 | 9 | 3 | 7 | **5.61** |
| 20 | Charter-broker proposal/brochure builder | 5 | 5 | 8 | 5 | 3 | 7 | 6 | 7 | 5 | 7 | 8 | 6 | 6 | 6 | 3 | 6 | **5.57** |
| 21 | Stud-farm mare & foal records | 4 | 5 | 6 | 3 | 5 | 5 | 7 | 8 | 4 | 7 | 9 | 8 | 4 | 8 | 2 | 7 | **5.54** |
| 22 | Private-jet charter quoting | 6 | 6 | 9 | 6 | 2 | 6 | 4 | 6 | 4 | 8 | 8 | 7 | 4 | 5 | 4 | 5 | **5.54** |
| 23 | Fine-wine in-bond reserves reconciliation | 5 | 5 | 6 | 4 | 6 | 5 | 5 | 5 | 4 | 7 | 8 | 7 | 4 | 5 | 3 | 7 | **5.43** |

### Evidence behind the main scores for the rejected ideas
- **Superyacht APA:** Voly already sells APA management with a prepaid Mastercard and app ([Voly](https://www.voly.co.uk/apa-management)). Captains are told to use QuickBooks. Revenue would be seasonal, crew turnover drives churn, and there is no deadline.
- **Racehorse billing:** Horsebills is at $34.99/month with 4.5/5 reviews, so the price ceiling is low ([Capterra](https://www.capterra.co.uk/software/145296/horsebills)).
- **Muirburn licensing:** real and new (licences required from 15 Sept 2026) ([NatureScot](https://www.nature.scot/doc/muirburn-licensing-guidance-applicants); [Turcan Connell](https://www.turcanconnell.com/news/new-muirburn-licensing-scheme-due-to-come-into-force-on-1-january-2026)). But the total market is a few hundred estates, so £10k MRR is out of reach.
- **Tax-residency tracking:** crowded. Monaeo, TaxBird, TaxDay, Flamingo, Domicile365, iReside and TAX Resident all exist ([AOL / Business Insider](https://www.aol.com/articles/ultrawealthy-smartphone-apps-avoid-millions-100500321.html)).
- **Buying-agent tooling:** LonRes, HomeHapp AI, Vyomm and Invisible Homes already compete ([The Negotiator](https://thenegotiator.co.uk/news/off-market-goes-on-the-move-lonres-launches-industry-first-app/)).
- **Watch dealers:** WatchManager, WristBook, TWICE and Elefta compete on operations, and IDV vendors target their AMLR needs ([Product Hunt](https://www.producthunt.com/products/watchmanager-app); [Signicat](https://www.signicat.com/blog/is-your-luxury-watch-business-ready-for-the-new-eu-anti-money-laundering-rules)). Large market, but price-sensitive and less "forgotten". This is our **phase-2 expansion**, not the wedge.
- **Aircraft SIFL tax:** desktop and mobile "Aircraft Tax Software" products already exist ([App Store](https://apps.apple.com/us/app/id1600943620)).
- **Restoration portals:** generic shop software plus custom builds; this is a vitamin, not a painkiller.

---

## 6. The £10k MRR test (finalists)

FX: £1 ≈ €1.16 (indicative).

| Finalist | Realistic price | Customers for £10k MRR | Reachable pool | Can a solo founder get there? |
|---|---|---|---|---|
| **AML deal files (yacht/jet/hypercar)** | €490/mo (~£421) | **24** | 2,000–4,000 firms; concentrated in Monaco, Antibes, Palma, Genoa/Viareggio and the boat shows; reachable via MYBA/associations, consultants and LinkedIn | **Yes.** Deadline-driven, needs fewer than 1–2% of the pool, high ACV, low churn. |
| Art market AML | £79–£149/mo | 67–127 | Thousands of galleries, but an incumbent exists (ArtAML), fragmented and price-sensitive | Possible but slow. Competing with an insider incumbent. |
| Watch-dealer AMLR | €99–€199/mo | 58–117 | Large | Possible later, as an expansion of the same engine. |
| Muirburn / grouse licensing | £99/mo | 101 | Fewer than 400 estates | **No.** The pool is too small. |
| Investment-migration AMLR | €390/mo | 30 | Shrinking market (EU golden visas closing) | Marginal. |
| Superyacht APA | €69/yacht/mo | 167 yachts | ~1,500 charter yachts | Possible, but seasonal, with churn and an incumbent. |

---

## 7. Decision

**Build Ensign: AML deal files for high-value goods traders. Beachhead: superyacht brokers in Monaco and France. Expansion: EU yacht brokers and yards, then private-aircraft and hypercar/collector-car dealers.**

Why this one:
- **It wins the weighted score by 1.5 points.**
- **It is the only finalist with all of these at once:** a legal deadline, enforcement already happening, a very wealthy customer base, a small and concentrated set of firms, and no vertical incumbent.

Full reasoning, risks and the rejected finalists are in [`PRODUCT_STRATEGY.md`](./PRODUCT_STRATEGY.md).

---

## 8. Source list
- AMLR text: [EUR-Lex 2024/1624](https://eur-lex.europa.eu/eli/reg/2024/1624/oj/eng) · [Art. 3](https://lawplayer.com/eu/article/32024R1624/art_3) · [Art. 74](https://lawplayer.com/eu/article/32024R1624/art_74) · [Better Regulation Art. 74](https://service.betterregulation.com/document/739338)
- CMS, automotive obligations from 10 July 2027: <https://cms.law/en/aut/legal-updates/aml-regulation-new-obligations-for-the-automotive-sector-from-10-july-2027>
- Rosemont (Monaco):
  - France Loi 2025-532: <https://rosemont-int.com/article/news/new-aml-obligations-for-yacht-brokers-real-estate-developers-car-and-jet-brokers-in-france>
  - AMSF sanctions 2025–26: <https://rosemont-int.com/article/news/summary-of-amsf-and-legal-profession-sanctions-in-monaco-20252026>
  - High-value yachting: <https://rosemont-int.com/article/news/aml-obligations-in-high-value-yachting-a-positive-development-for-the-industry>
- SuperyachtNews, "2026 – The year Europe quietly rewrites the superyacht rulebook": <https://www.superyachtnews.com/operations/2026--the-year-europe-quietly-rewrites-the-superyacht-rulebook>
- Pressmare, "Yachting and anti-money laundering regulations" (20 Mar 2026): <https://www.pressmare.it/en/media/press-mare/2026-03-20/yachting-and-anti-money-laundering-regulations-88834>
- ACAMS, "Monaco Targets Key AML Vulnerability: Luxury Yachts": <https://www.acams.org/en/news/monaco-targets-key-aml-vulnerability-luxury-yachts>
- AMLA final draft RTS (1 Oct 2026): <https://www.regulationtomorrow.com/2026/10/amla-finalises-key-standards-for-the-private-sector/>
- FATF June 2026 lists: <https://www.dia.govt.nz/AML-CFT-Jurisdictions-under-increased-monitoring-June-2026> · <https://amluae.com/fatf-grey-list-countries-update-19th-june-2026/>
- EU high-risk third countries 2026: <https://cm.twobirds.com/en/insights/2026/eu-list-of-highrisk-countries-and-jurisdictions-for-money-laundering-and-terrorism-financing-amended> · <https://www.revisorforeningen.no/en/fag/nyheter/endringer-hoyrisikoland-hvitvaskingsforskriften/>
- OpenSanctions API pricing (€0.10/call): <https://www.opensanctions.org/faq/api/metering/>
- Sanctions screening market pricing: <https://sanctionschecklist.com/compare>
- Didit KYC pricing (free core KYC): <https://didit.me/blog/kyc-costs-explained-pricing-models-hidden-fees-revealed/>
- First AML funding: <https://www.startupdaily.net/2021/11/new-zealand-anti-money-laundering-startup-first-aml-raises-30-million-series-b/>
- ArtAML launch: <https://news.artnet.com/art-world/artaml-money-laundering-uk-art-1889876>
- UK art-market fines: <https://www.artnews.com/art-news/news/uk-art-businesses-fined-money-laundering-compliance-aml-1234736548>
- ABYA × SmartSearch: <https://boatingindustry.com/news/2022/08/23/abya-partners-with-smartsearch/>
- Superyacht market 2026: <https://top-yachtdesign.com/superyachts-market-sales-first-quarter-2026/> · <https://www.pressmare.it/en/media/press-mare/2026-04-01/superyacht-market-26-fewer-units-higher-values-fraser-report-88937>
