# Ensign — AML deal files for superyacht, jet and hypercar transactions

> One AML file per deal, ready before the deposit lands. Ensign gives you:
> - a discreet KYC link for the buyer's lawyer;
> - sanctions and PEP screening of the whole ownership chain;
> - a high-value-goods risk score with legal references;
> - a senior-management approval trail;
> - the EU AMLR **Article 74** threshold report;
> - five years of daily re-screening.

**Who it's for:** superyacht brokers, shipyards, private-aircraft dealers and hypercar or collector-car dealers.

**Why now:** these businesses become *obliged entities* under the EU AML Regulation (2024/1624) on **10 July 2027**. Monaco is already fining brokers, and France has already legislated.

The market evidence, competitor analysis and strategy are in:
[`MARKET_RESEARCH.md`](./MARKET_RESEARCH.md) · [`COMPETITORS.md`](./COMPETITORS.md) · [`PRODUCT_STRATEGY.md`](./PRODUCT_STRATEGY.md) · [`FIRST_10_CUSTOMERS.md`](./FIRST_10_CUSTOMERS.md) · [`LAUNCH_PLAN.md`](./LAUNCH_PLAN.md)

---

## What the product does

| Step | What happens |
|---|---|
| **1. Open a deal file** | Enter the asset (yacht / aircraft / car), price, your role and the intended use. The form tells you live whether the sale crosses the Article 74 threshold: €7.5m for yachts and aircraft, €250k for cars, non-commercial use. |
| **2. Send one secure link** | The buyer's lawyer or family office submits, in one sitting, with no account and no selfie: the buyer entity, intermediate holdings and trusts, beneficial owners (owners above 25% or with control), payer, source of funds and wealth, and documents. |
| **3. Screen & score** | Every person and company is screened. Production uses OpenSanctions (sanctions, PEPs, crime lists); demo mode uses a *fictional* list. A deterministic risk engine scores each deal against EU and FATF lists (Monaco, the BVI and Russia included), PEPs, layering, offshore vehicles, third-party payers, crypto, cash and red flags. Each factor carries its legal reference. |
| **4. Review & decide** | Clear or confirm each potential match, with a recorded rationale. Approve or reject with recorded grounds. Enhanced due diligence requires an owner or admin (senior management). |
| **5. Export & report** | One-click printable AML file (CDD, ownership chain, screening log including *no-match* evidence, documents with SHA-256 hashes, decision, audit trail). Article 74 report pack, printable plus JSON. FIU reference tracking. |
| **6. Monitor** | Daily cron re-screens every monitored party. New matches raise alerts and email the compliance officer. |

Also included:
- Public landing page, pricing, an **AMLR readiness check** (lead magnet) and four SEO guides.
- Auth (signup, login, logout, password reset, team invites), onboarding, dashboard and settings.
- Stripe billing (Checkout, subscriptions, billing portal, webhooks) with a simulated mode.
- Email via Resend, with an outbox fallback.
- Analytics: an internal events table, with an optional PostHog mirror.
- A **live demo workspace**.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | One deployable for marketing, app and API. Server Actions give forms without an API layer. |
| Styling | **Tailwind CSS v4**, self-hosted fonts (Inter, Instrument Serif, JetBrains Mono via Fontsource) | No external font CDN, which keeps the CSP strict. |
| Database | **Postgres** via **Drizzle ORM**. With no `DATABASE_URL`, an embedded **PGlite** (real Postgres in WASM) stored in `./.data/pglite` | Zero-setup local and demo; any managed Postgres in production; one schema for both. |
| Auth | Own implementation: scrypt password hashes, random 256-bit session tokens stored as SHA-256 hashes, httpOnly cookies | Small, auditable, no vendor. |
| Billing | **Stripe** Checkout + Billing Portal + webhooks | Self-serve subscriptions, VAT/tax IDs, promotion codes. |
| Screening | **OpenSanctions** `/match` API | Global sanctions and PEP data at €0.10/check, with no enterprise contract. |
| Email | **Resend** REST API | Simple and EU-friendly. Falls back to an outbox table. |
| Tests | **Vitest** (unit) + **Playwright** (end-to-end, desktop and mobile) | |

## Quick start (local, zero config)

```bash
npm install
npm run dev            # http://localhost:3000
```

That's it:
- The database is created and migrated automatically in `./.data/pglite`.
- Emails go to the **Email outbox** page (and the server console).
- Screening uses the fictional demo watchlist.
- Checkout is simulated.

Then try:
1. **Live demo:** open <http://localhost:3000/demo> and press *Enter the demo workspace*. It builds a fictional brokerage with six deals. Use the *Try the buyer's side* card to open and submit the client portal yourself.
2. **Your own workspace:** go to <http://localhost:3000/signup>, then onboarding, then *Open a deal file*.
3. **Password-reset emails locally:** open <http://localhost:3000/dev/outbox>. This only works in development, or with `ENABLE_DEV_TOOLS=true`.

> Use `NEXT_PUBLIC_APP_URL` matching the URL in your browser. It is used for client KYC links, email links and Stripe redirects.

### Production build locally

```bash
npm run build
ENABLE_DEV_TOOLS=true npm start      # dev tools allow the outbox & dev encryption key outside development
```

Do not run `next dev` and `next start` from the same folder at the same time: they share `.next/`.

## Environment variables

Copy `.env.example` to `.env.local`. Every external service is optional. A value that is missing, or still `replace_me`, switches that service to its local fallback.

| Variable | Required in prod | Purpose / fallback |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL (links in emails, client portal, Stripe redirects, sitemap). |
| `DATABASE_URL` | ✅ | Postgres connection string. Empty means embedded PGlite at `PGLITE_DIR`. |
| `AUTO_MIGRATE` | — | `true` runs migrations on first connection. Otherwise run `npm run db:migrate` in your deploy step. |
| `ENCRYPTION_KEY` | ✅ | 32 random bytes, base64 (`openssl rand -base64 32`). Encrypts every uploaded document (AES-256-GCM). **Without it, customer uploads are refused in production.** Demo workspaces and local dev use an insecure dev key. |
| `CRON_SECRET` | ✅ | Bearer token for `/api/cron/daily`. Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically. |
| `ADMIN_EMAILS` | — | Comma-separated emails that can open `/app/admin` (founder metrics: MRR, funnel, leads). |
| `ENABLE_DEV_TOOLS` | ❌ never | Exposes `/dev/outbox`. Local testing only. |
| `RATE_LIMIT_MULTIPLIER` | ❌ | Multiplies the in-memory rate limits. Use `100` only for automated tests. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | for billing | Missing means simulated checkout. |
| `STRIPE_PRICE_STARTER_MONTHLY`, `STRIPE_PRICE_STARTER_YEARLY`, `STRIPE_PRICE_BROKERAGE_MONTHLY`, `STRIPE_PRICE_BROKERAGE_YEARLY` | for billing | Stripe Price IDs. |
| `EMAIL_API_KEY`, `EMAIL_FROM` | for email | Resend API key and verified sender. Missing means the outbox table plus console. |
| `OPENSANCTIONS_API_KEY`, `OPENSANCTIONS_DATASET` | for real screening | Missing means the **fictional** demo watchlist (clearly labelled in the UI). |
| `POSTHOG_API_KEY`, `POSTHOG_HOST` | — | Optional analytics mirror. Events are always stored in `analytics_events`. |

*Settings → Integrations* (owners and admins) shows which services are live and which are using the fallback.

## Database

- **Schema:** `src/lib/db/schema.ts`. Migrations are SQL files in `drizzle/`.
- **New migration after a schema change:** `npm run db:generate`.
- **Apply migrations:** `npm run db:migrate`. This targets `DATABASE_URL`, or PGlite if it is empty.
- **Data stored:**
  - organizations, users, sessions, auth tokens;
  - deals, parties, KYC requests;
  - documents (encrypted `bytea`), screenings, threshold reports;
  - audit events, alerts, analytics events, emails (outbox), leads.
- **Reset local data:** stop the server and run `rm -rf .data`.

Any Postgres 14+ works: Neon, Supabase, RDS or Crunchy. Use an **EU region**, because the data is CDD data on EU obliged entities' customers.

## Deployment (Vercel + Neon/Supabase)

1. Create a Postgres database in an EU region and copy its URL.
2. Import the repo into Vercel and set the environment variables above. `NEXT_PUBLIC_APP_URL` must be your production domain.
3. Set the build command: `npm run db:migrate && npm run build`.
4. Cron is pre-configured in `vercel.json`. `/api/cron/daily` runs at 05:17 UTC and does four jobs:
   - ongoing monitoring;
   - KYC link expiry;
   - trial reminders;
   - demo purge.

   Set `CRON_SECRET`.
5. Add the Stripe webhook (below) and verify your sending domain in Resend.

Other hosts (Docker, Fly, Render) work the same way: `npm run build && npm start`. Trigger the cron route daily with the bearer secret, for example:

`curl -H "Authorization: Bearer $CRON_SECRET" https://your.app/api/cron/daily`

## Stripe setup

1. **Products & prices** (EUR, recurring):
   - *Ensign Starter*: €190/month and €1,900/year.
   - *Ensign Brokerage*: €490/month and €4,900/year.

   Put the four Price IDs in the `STRIPE_PRICE_*` variables.
2. **Founding-firm offer (optional):** a coupon for €100 off monthly for 24 months, with a promotion code such as `FOUNDING390`. Checkout has `allow_promotion_codes` enabled.
3. **Webhook endpoint:** `https://your.app/api/stripe/webhook`.
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. **Billing portal:** enable it in Stripe (cancel, update payment method, invoices). The *Manage billing & invoices* button opens it.
5. **Local testing:** `stripe listen --forward-to localhost:3000/api/stripe/webhook` with test keys.

**Access model:**
- Trial (14 days, Brokerage limits, no card), active and past-due firms can create files, send links and screen.
- When the trial ends or the plan is cancelled, the workspace becomes read-only: view and export only, because firms must retain files for five years.

## API setup

- **OpenSanctions:** create an API key at opensanctions.org and buy credits (€0.10 per match call). Set `OPENSANCTIONS_API_KEY`.
  - Each party is matched against the configured dataset (`default`), and results with a score of 0.7 or more are stored.
  - Daily monitoring re-screens monitored parties at most once every 20 hours.
- **Resend:** verify your domain and set `EMAIL_API_KEY` and `EMAIL_FROM`.
- **PostHog (optional):** set `POSTHOG_API_KEY`. Only server-side events are sent, without CDD data.

## Demo mode

- `/demo` creates a fresh organisation flagged `is_demo = true`, signs the visitor in for 24 hours and seeds six fictional deals:
  - an EDD superyacht with a Monaco and BVI chain and a false-positive match to clear;
  - a deal awaiting the client;
  - a PEP-owned jet with an Article 74 report filed;
  - a crypto-funded hypercar;
  - a low-risk charter;
  - a sanctioned buyer that is refused.
- **Separation from real data:**
  - demo organisations always use the fictional watchlist;
  - their email goes only to the outbox;
  - their checkout is simulated;
  - their users cannot sign in with a password;
  - they are excluded from analytics and monitoring;
  - they are purged by the daily cron after 24 hours.
- The fictional watchlist (`src/lib/screening/demo-watchlist.ts`) contains invented people and companies only.

## Architecture

```
src/
  app/
    (marketing)/            landing, pricing, demo, readiness check, SEO guides, legal
    (auth)/                 login, signup, forgot/reset password
    app/                    authenticated workspace (dashboard, deals, monitoring, settings, billing, outbox, admin)
      deals/[id]/           deal workspace · /file (printable AML file) · /report (Article 74 pack)
    kyc/[token]/            public client portal (token-gated, no account)
    api/                    stripe/webhook · cron/daily · documents/[id] · deals/[id]/report · health
    actions/                server actions (auth, app, billing, kyc, public)
  lib/
    db/                     Drizzle schema + client (PGlite or node-postgres)
    risk/                   engine.ts (scoring), lists.ts (EU/FATF/embargo lists, FIUs), thresholds.ts (Art. 74)
    screening/              OpenSanctions + fictional demo provider, name matcher (Jaro-Winkler, token alignment)
    deals/                  service (deals, checklist, decisions), parties (screening, monitoring), kyc, documents, report
    billing/                plans, access state, Stripe helpers
    email/                  Resend/outbox transport + templates
    demo/                   demo seeding + specimen PDFs
    auth/session.ts         sessions & guards
  components/               UI primitives, marketing and app components
tests/unit                  risk engine, thresholds, matcher, crypto, rate limiter (Vitest)
tests/e2e                   full customer journey + mobile layout (Playwright)
```

**Data flow for a deal:**
1. Broker creates the deal.
2. `createKycRequest` issues a random token. Only its SHA-256 is stored, and the link expires in 14 days.
3. The client submits through `/kyc/[token]`, and `submitKyc` runs:
   - it claims the token (single use);
   - it creates the parties and links the chain;
   - it encrypts the documents;
   - it screens each party;
   - `recomputeRisk` scores the deal and creates or removes the `threshold_reports` row;
   - it raises an alert and emails the firm.
4. The broker resolves matches and decides (approval rules are enforced server-side), completes the deal, prepares and submits the report, and exports the file.

**Security notes:**
- Every query is scoped by organisation id.
- Server Actions carry Next.js origin checks.
- Uploads are type-sniffed from magic bytes, size-limited and encrypted.
- Downloads are authenticated, logged and sandboxed by CSP.
- Session, reset, invite and KYC tokens are stored hashed.
- Rate limits cover signup, login, reset, KYC submissions, screening and demos.
- Strict security headers are set in `next.config.ts`.
- The audit trail records the actor, time and IP address.

## Testing

```bash
npm test                 # unit tests (risk engine, thresholds, matcher, crypto, rate limiter)
npm run typecheck
npm run build && npm run test:e2e   # Playwright: full journey + mobile layout (starts `next start` if needed)
```

The end-to-end suite covers the whole journey:
- landing, pricing, guides and readiness check;
- protected routes, anonymous API access and the cron secret;
- signup, onboarding and the first deal with the live Article 74 check;
- manual parties: a BVI SPV needing a UBO, and a Monaco UBO triggering EDD;
- the client portal submission, revisiting a used link, and a screening hit;
- clearing a false positive, approving, completing the sale, filing Article 74, exporting the AML file, the JSON report and document download;
- simulated checkout and cancellation;
- settings, team invite, outbox and the admin guard;
- logout, password reset by email and login;
- demo mode;
- mobile layouts with no horizontal scroll.

## Known limitations

- **Rate limiting is in-memory.** It is per instance, so use Upstash or Redis on multi-instance serverless.
- **Documents are stored encrypted in Postgres `bytea`.** That is fine for the first hundreds of deals; move to EU object storage (S3 or R2) with customer-managed keys before scale.
- **No live identity verification (selfie/liveness), adverse-media search or goAML XML export yet.** The report pack is format-agnostic until FIUs publish Article 74 schemas.
- **Risk lists are configuration.** The EU list is as of 29 Jan 2026; the FATF lists are as of June 2026. Update them after each FATF plenary (February, June, October) in `src/lib/risk/lists.ts`. Firms can add countries in Settings.
- **Currency conversion uses indicative rates** for the threshold check. The UI tells users to confirm the EUR value at the transaction date.
- **The legal pages are templates.** Have counsel review them, along with a DPA, before taking customer data.
- **Ensign is decision support, not legal advice.** The obliged entity remains responsible.
