import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  EyeOff,
  FileCheck,
  FolderLock,
  Link as LinkIcon,
  Radar,
  ScrollText,
  ShieldCheck,
  Ship,
  Plane,
  Car,
  X,
} from "lucide-react";
import { FileMock } from "@/components/marketing/file-mock";
import { LinkButton } from "@/components/ui";
import { PLANS } from "@/lib/billing/plans";
import { daysUntilAmlr } from "@/lib/format";

export const revalidate = 3600;

const FAQ = [
  {
    q: "Are yacht brokers really covered by the new EU rules?",
    a: "Yes. Article 3(3)(f) of Regulation (EU) 2024/1624 makes persons trading in high-value goods — including watercraft and aircraft above €7.5m and motor vehicles above €250k — obliged entities from 10 July 2027. That covers brokers acting as intermediaries, dealers and yards selling to private buyers. France has already legislated (Loi 2025-532) and also covers yacht charters.",
  },
  {
    q: "We are in Monaco. Does any of this apply to us?",
    a: "Monaco's own AML law (Law 1.362) has covered the sale and rental of pleasure boats since 2022, and the AMSF is enforcing it: a yacht brokerage was fined €50,000 in November 2025. Separately, Monaco is on the EU high-risk third-country list, so EU counterparties must apply enhanced due diligence to Monaco-linked deals — your files need to be impeccable.",
  },
  {
    q: "What is the Article 74 threshold report?",
    a: "Traders must report every sale of a car ≥ €250k, or a yacht or aircraft ≥ €7.5m, acquired for non-commercial use to their Financial Intelligence Unit — with or without suspicion. Ensign detects when a deal crosses the threshold and prepares the full data pack (customer, beneficial owners, goods, price, payment) ready to file.",
  },
  {
    q: "Will our buyers have to take selfies or create an account?",
    a: "No. Ensign is representative-led: you send one discreet, expiring link to the buyer's lawyer or family office. They submit the ownership chain, source of funds and documents in one sitting. No app, no account, no selfie.",
  },
  {
    q: "Where does the screening data come from?",
    a: "Production screening uses OpenSanctions, which aggregates official sanctions lists (EU, UN, OFAC, UK and others), politically-exposed-person data and crime lists. Every result — including every “no match” — is stored with a timestamp as evidence. The demo uses a clearly-labelled fictional watchlist.",
  },
  {
    q: "Does Ensign replace our compliance officer or lawyer?",
    a: "No. Ensign is the system of record and decision support: it structures the evidence, applies a documented risk model and keeps the audit trail. Your MLRO decides; your counsel advises. Many consultants use Ensign to run their clients' files.",
  },
];

export default function Home() {
  const days = daysUntilAmlr();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Ensign",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "AML deal files for superyacht, private aircraft and luxury car transactions.",
        offers: PLANS.filter((p) => p.monthly).map((p) => ({ "@type": "Offer", name: p.name, price: p.monthly, priceCurrency: "EUR" })),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <p className="eyebrow">AML compliance for superyacht deals</p>
            <h1 className="display mt-5 text-[46px] text-ink sm:text-[60px] lg:text-[68px]">
              The AML file for every superyacht deal — <em className="text-brass">done before the deposit lands.</em>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              From 10 July 2027, EU law makes yacht brokers, shipyards, aircraft and hypercar dealers obliged entities. Monaco is already fining brokers. Ensign
              collects your buyer&apos;s KYC through one discreet link, screens everyone in the ownership chain, scores the risk and produces the
              inspection-ready file — and the Article 74 report.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/signup" size="lg">
                Start 14-day trial <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/demo" size="lg" variant="secondary">
                Explore the live demo
              </LinkButton>
            </div>
            <p className="mt-4 text-[13px] text-muted">No card required · First deal file in 5 minutes · Your data stays encrypted</p>
          </div>
          <FileMock />
        </div>
      </section>

      {/* Regulatory strip */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 text-[13px] text-muted">
          <span className="font-medium text-ink-2">Built around</span>
          <span>EU AMLR 2024/1624 · Art. 3, 20, 29, 34, 42, 74, 77, 80</span>
          <span>AMLA CDD standards (final, Oct 2026)</span>
          <span>Monaco Law 1.362</span>
          <span>France Loi 2025-532</span>
        </div>
      </section>

      {/* Why now */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <p className="eyebrow">Why now</p>
        <h2 className="display mt-4 max-w-3xl text-[40px] sm:text-[48px]">An unregulated, very wealthy trade becomes a regulated one — in {days} days.</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Fact
            figure="€50,000"
            text="Fine imposed on a Monaco yacht brokerage in November 2025 for outdated policies, superficial KYC and an unverified, Bitcoin-funded purchase."
            source="AMSF Sanctions Commission, Nov 2025"
          />
          <Fact
            figure="10 July 2027"
            text="The AML Regulation applies across the EU. Traders of yachts and aircraft ≥ €7.5m and cars ≥ €250k must run full customer due diligence — and report every qualifying sale."
            source="Regulation (EU) 2024/1624, Art. 3 & 74"
          />
          <Fact
            figure="Monaco + BVI"
            text="Both now sit on the EU high-risk list and the FATF grey list. The industry's default ownership structure triggers enhanced due diligence by design."
            source="Delegated Reg. 2016/1675 (Jan 2026) · FATF, June 2026"
          />
        </div>
        <blockquote className="mt-12 max-w-3xl border-l-2 border-brass pl-5 font-serif text-[24px] leading-snug text-ink-2">
          “Treat every high-value transaction as an AML exam. Thin files invite delay at best – and regulatory friction at worst.”
          <footer className="mt-2 font-sans text-[13px] not-italic text-muted">— SuperyachtNews, January 2026</footer>
        </blockquote>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <p className="eyebrow">How it works</p>
          <h2 className="display mt-4 max-w-3xl text-[40px] sm:text-[48px]">Four steps. One file a supervisor can read in ten minutes.</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
            <StepCard n="01" icon={<Ship className="size-5" />} title="Open a deal file" body="Asset, price, your role and the intended use. Ensign immediately tells you whether the sale crosses the Article 74 threshold." />
            <StepCard
              n="02"
              icon={<LinkIcon className="size-5" />}
              title="Send one discreet link"
              body="The buyer's lawyer or family office submits the SPV, trusts, beneficial owners, payer, source of funds and documents — in one sitting, no account needed."
            />
            <StepCard
              n="03"
              icon={<Radar className="size-5" />}
              title="Screen and score everyone"
              body="Every person and company in the chain is screened against sanctions, PEP and crime lists. A transparent high-value-goods risk model sets the due-diligence level, with the legal reference for each factor."
            />
            <StepCard
              n="04"
              icon={<FileCheck className="size-5" />}
              title="Approve, export, report — then monitor"
              body="Senior-management sign-off when EDD applies, a one-click AML file, the Article 74 report pack, and daily re-screening of every party for five years."
            />
          </div>
        </div>
      </section>

      {/* What's in the file */}
      <section className="mx-auto grid max-w-6xl gap-14 px-4 py-24 md:grid-cols-2">
        <div>
          <p className="eyebrow">What&apos;s in the file</p>
          <h2 className="display mt-4 text-[40px] sm:text-[44px]">Everything an AMSF, TRACFIN or UIF inspector asks for — already in order.</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
            Regulators don&apos;t fine brokers for having rich clients. They fine them for files they cannot defend: no documented risk assessment, no source of funds,
            no evidence of screening, no record of who approved what. Ensign makes the defensible file the default output of doing the deal.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Customer & beneficial-ownership chain (25% + control)",
            "Identity and corporate documents, encrypted and hashed",
            "Source of funds & source of wealth evidence",
            "Sanctions / PEP screening log — including every no-match",
            "Risk factors with points and legal references",
            "Due-diligence tier: standard or enhanced",
            "Senior-management approval with recorded grounds",
            "Article 74 threshold report pack (JSON + print)",
            "Timestamped audit trail with IP addresses",
            "Daily monitoring alerts for 5 years (Art. 77)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-[14px]">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Discretion */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow text-[#d9c49a]">Built for discretion</p>
            <h2 className="display mt-4 text-[40px] sm:text-[48px]">Your clients buy €40m yachts. Treat their data accordingly.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Feature icon={<EyeOff className="size-5" />} title="No selfies, no apps" body="Representative-led onboarding, the way UHNW deals actually work. Principals never touch the software." />
            <Feature icon={<FolderLock className="size-5" />} title="Encrypted documents" body="AES-256-GCM at rest, SHA-256 fingerprints, access logged per download." />
            <Feature icon={<ShieldCheck className="size-5" />} title="Expiring client links" body="Single-use, 14-day links that show the client only your firm name and the deal reference." />
            <Feature icon={<ScrollText className="size-5" />} title="Retention built in" body="Records kept for the 5 years the AMLR requires, exportable at any time — even if you stop paying." />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <p className="eyebrow">The alternatives</p>
        <h2 className="display mt-4 max-w-3xl text-[40px] sm:text-[48px]">Built for the deal, not adapted from a bank.</h2>
        <div className="mt-12 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-muted">
                <th className="px-5 py-4 font-medium" />
                <th className="px-5 py-4 font-medium">Email &amp; spreadsheets</th>
                <th className="px-5 py-4 font-medium">Generic KYC platforms</th>
                <th className="bg-sand/60 px-5 py-4 font-semibold text-ink">Ensign</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Deal-centric file (asset, price, parties)", false, false, true],
                ["Ownership chain collected from the buyer's lawyer", false, "partial", true],
                ["Screening with stored no-match evidence", false, true, true],
                ["High-value-goods risk model with legal references", false, false, true],
                ["Article 74 threshold report", false, false, true],
                ["Selfie-free for principals", true, false, true],
                ["Published pricing, no developer needed", true, false, true],
              ].map(([label, a, b, c]) => (
                <tr key={label as string} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5 font-medium">{label}</td>
                  {[a, b, c].map((v, i) => (
                    <td key={i} className={`px-5 py-3.5 ${i === 2 ? "bg-sand/60" : ""}`}>
                      {v === true ? <Check className="size-4 text-ok" /> : v === "partial" ? <span className="text-[13px] text-warn">Partly</span> : <X className="size-4 text-faint" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Segment icon={<Ship className="size-5" />} title="Yacht brokers & yards" href="/aml-for-yacht-brokers" />
          <Segment icon={<Plane className="size-5" />} title="Aircraft dealers" href="/aml-for-aircraft-dealers" />
          <Segment icon={<Car className="size-5" />} title="Hypercar & collector-car dealers" href="/aml-for-luxury-car-dealers" />
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Pricing</p>
              <h2 className="display mt-4 text-[40px] sm:text-[48px]">Less than a day of a compliance consultant.</h2>
            </div>
            <Link href="/pricing" className="text-[14px] font-medium text-sea underline underline-offset-4">
              Compare plans →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.id} className={`rounded-2xl border p-6 ${p.highlighted ? "border-ink bg-ink text-white" : "border-line bg-paper"}`}>
                <p className="text-[15px] font-semibold">{p.name}</p>
                <p className={`mt-1 text-[13px] ${p.highlighted ? "text-white/70" : "text-muted"}`}>{p.tagline}</p>
                <p className="mt-5 font-serif text-[44px] leading-none">
                  {p.monthly ? `€${p.monthly}` : "Custom"}
                  {p.monthly ? <span className={`ml-1 font-sans text-[14px] ${p.highlighted ? "text-white/60" : "text-muted"}`}>/month</span> : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-24">
        <p className="eyebrow text-center">Questions</p>
        <h2 className="display mt-4 text-center text-[40px]">What brokers ask us first</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                {f.q}
                <span className="text-brass transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-sea px-8 py-16 text-center text-white md:px-16">
          <BadgeCheck className="mx-auto size-8 text-[#d9c49a]" />
          <h2 className="display mx-auto mt-5 max-w-2xl text-[40px] sm:text-[52px]">Your next deal is your next inspection.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] text-white/75">Open your first AML file today. If it isn&apos;t faster than your current process, don&apos;t pay.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href="/signup" size="lg" variant="brass">
              Start 14-day trial
            </LinkButton>
            <LinkButton href="/amlr-readiness" size="lg" variant="secondary">
              Take the 2-minute readiness check
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({ figure, text, source }: { figure: string; text: string; source: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-6">
      <p className="font-serif text-[40px] leading-none text-ink">{figure}</p>
      <p className="mt-4 flex-1 text-[14.5px] leading-relaxed text-ink-2">{text}</p>
      <p className="mt-5 text-[12px] text-muted">{source}</p>
    </div>
  );
}

function StepCard({ n, icon, title, body }: { n: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white p-8">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] text-brass">{n}</span>
        <span className="grid size-9 place-items-center rounded-lg bg-sand text-ink">{icon}</span>
      </div>
      <h3 className="mt-5 text-[18px] font-semibold">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <span className="grid size-10 place-items-center rounded-lg bg-white/10 text-[#d9c49a]">{icon}</span>
      <h3 className="mt-4 text-[16px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">{body}</p>
    </div>
  );
}

function Segment({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4 text-[14.5px] font-medium hover:border-ink/30">
      <span className="flex items-center gap-3">
        <span className="text-brass">{icon}</span>
        {title}
      </span>
      <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
