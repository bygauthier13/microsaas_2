# Launch Plan

**North star:** paying firms. **Activation:** first client KYC link sent on a real deal.

**Target:**
- 10 paying firms by day 90 (≈ €4–5k MRR).
- 25–30 firms (≈ £10k MRR) by the AMLR date, 10 July 2027.

## Pre-launch checklist (week 0)

**Domain, infrastructure and security**
- [ ] Domain plus a professional email on that domain (e.g. `ensign-compliance.com`; brand is provisional). Set up SPF, DKIM and DMARC.
- [ ] Postgres in an EU region (Neon or Supabase, Frankfurt or Paris). Set `DATABASE_URL`, then run `npm run db:migrate`.
- [ ] Set `ENCRYPTION_KEY`, `CRON_SECRET` and `ADMIN_EMAILS` on Vercel. Never set `ENABLE_DEV_TOOLS` in production.
- [ ] Check that the uptime monitor on `/api/health` and the daily cron (`/api/cron/daily`) both succeed.

**Integrations**
- [ ] Stripe live mode: create the 2 products × 2 prices, the `FOUNDING390` promotion code, the webhook and the billing portal.
- [ ] Resend: verify the domain and set `EMAIL_FROM`.
- [ ] OpenSanctions: buy €400 of credits (5,000 checks), which covers the first ~50 firms for months. Set `OPENSANCTIONS_API_KEY`.

**Legal and trust**
- [ ] Have counsel review the Terms, Privacy notice and a **DPA (Art. 28 GDPR)** template (≈ €1–2k). Add the "decision support, not legal advice" disclaimer to the contract.
- [ ] Professional indemnity / cyber insurance quote. Conservative buyers ask for it.

**Market inputs**
- [ ] Re-verify the risk lists against the **FATF plenary of October 2026**, and any EU delegated act since January 2026. Update `src/lib/risk/lists.ts` and the as-of dates.

## Weeks 1–2: founder-led validation

- **Build the target list:** 300 Tier-A contacts (see `FIRST_10_CUSTOMERS.md` §2). Score them and pick the top 100.
- **Send** 20 personalised emails and LinkedIn notes per weekday, in English or French depending on the firm.
- **Call partners:** 5 calls with Monaco/Riviera AML consultants and yacht lawyers (Rosemont-type firms, maritime law boutiques). Offer the partner terms.
- **Product rule:** fix only what blocks a real deal file. Log every request; ship nothing that isn't asked for twice.
- **Exit criteria:** 10 demos booked and 3 trials on real deals.

## Weeks 3–4: first revenue

- **Run demos** using the "build your file, live" script and the Day 1/3/7/11 trial follow-ups.
- **Publish** two LinkedIn posts per week from the founder. Topics:
  - "What the AMSF's 2025 decisions tell brokers";
  - "Article 74 in 5 lines";
  - "Why Monaco being on the EU high-risk list changes your next sale".
- **Ship from feedback.** Likely first asks:
  - CSV export of the screening log;
  - a French version of the client portal (i18n of the portal only);
  - an optional ID-document check via an IDV partner.
- **Exit criteria:** first 3 paying firms, and 1 consultant partner signed.

## Weeks 5–8: repeatability

- **Outreach:** extend to Tier B (Palma, Barcelona, Genoa/Viareggio, Netherlands) and Tier C (EU jet dealers). Same scripts, local languages (Italian and Spanish versions).
- **SEO** (already live): `/aml-for-yacht-brokers`, `/amlr-article-74-threshold-reporting`, `/aml-for-aircraft-dealers`, `/aml-for-luxury-car-dealers`.
  - Add one article per week on high-intent topics: "AML for yacht charter brokers in France", "Monaco Law 1.362 for yacht brokers", "Source of wealth for UHNW buyers: what to collect".
  - Track rankings for "AMLR yacht", "Article 74 AMLR", "yacht broker AML".
- **Readiness check:** promote `/amlr-readiness` in every post. Leads appear in *Founder metrics*.
- **Associations:** propose an AMLR briefing to MYBA, the Monaco yachting cluster and Confindustria Nautica, with a member discount (10%).
- **Exit criteria:** 10 paying firms, about €4–5k MRR, and trial-to-paid above 50%.

## Months 3–9: the deadline curve

| When | Move |
|---|---|
| Late Oct 2026 | **Fort Lauderdale International Boat Show.** Not core (US), but many EU brokerages attend. Collect meetings for Monaco follow-ups. *(Verify dates.)* |
| Jan 2027 | **boot Düsseldorf.** German and Dutch yards and dealers (Tier B/C). Run a "6 months to AMLR" campaign. |
| Feb–Mar 2027 | After the FATF February plenary, send a "lists changed: here is what it means for your files" email to all users and leads. |
| Apr–May 2027 | **Palma show + MYBA Charter Show.** Book a seminar slot: "AMLR in 10 weeks". Peak urgency. |
| Jun 2027 | "30 days to AMLR" campaign. Offer a done-with-you file migration for €950 one-off. |
| 10 Jul 2027 | AMLR applies. Push Article 74 workflows and FIU-specific exports as FIUs publish formats. |
| Sep 2027 | **Monaco Yacht Show + Cannes Yachting Festival.** Stand or hospitality suite with partners. The founding-firm offer ends here. |

*(Event dates are typical windows. Verify each year's calendar.)*

## Metrics dashboard

Most of these are already instrumented in `/app/admin` plus `analytics_events`.

| Metric | Target by day 90 |
|---|---|
| Demo workspaces opened | 150 |
| Readiness checks completed / with email | 200 / 60 |
| Signups | 40 |
| Signup → first deal file | 70% |
| First deal → client link sent (activation) | 60% |
| Link sent → client submitted | 50% |
| Trial → paid | 45%+ |
| Logo churn | 0 (records lock-in plus monitoring) |
| MRR | €4–5k |

## Budget (first 90 days)

| Item | Cost |
|---|---:|
| Domain, email, Vercel Pro, Neon | ~€60/month |
| OpenSanctions credits | €400 |
| Legal review (Terms / Privacy / DPA) | €1,500 |
| LinkedIn Sales Navigator | ~€100/month |
| One boat-show visit (travel) | ~€800 |
| **Total** | **≈ €3,200** |

## Risks to watch during launch

- **"We'll do it in 2027."** Lead with Monaco enforcement and the bank-questionnaire angle. Offer founding pricing that expires.
- **Trust in a solo vendor.** Name the consultants you partner with, show the security page, sign a DPA, and answer the phone.
- **Regulatory changes** (national thresholds, FIU formats). Lists and thresholds are configuration; ship updates within a week of publication and email users about them, which doubles as retention content.
