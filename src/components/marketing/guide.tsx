import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { daysUntilAmlr } from "@/lib/format";

export function Guide({ eyebrow, title, lead, updated, children }: { eyebrow: string; title: string; lead: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
        <article>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display mt-4 text-[44px] sm:text-[56px]">{title}</h1>
          <p className="mt-5 text-[18px] leading-relaxed text-ink-2">{lead}</p>
          <p className="mt-4 text-[12.5px] text-muted">Updated {updated} · Summary of the law, not legal advice. Verify with your counsel and supervisor.</p>
          <div className="prose-guide mt-6 max-w-[68ch]">{children}</div>
        </article>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-6">
            <p className="font-serif text-[48px] leading-none num">{daysUntilAmlr()}</p>
            <p className="text-[13px] text-muted">days until the AMLR applies (10 July 2027)</p>
            <p className="mt-4 text-[14px] text-ink-2">Ensign turns these obligations into one AML file per deal — client KYC link, screening, risk scoring, approvals and the Article 74 report.</p>
            <div className="mt-5 flex flex-col gap-2">
              <LinkButton href="/signup">Start 14-day trial</LinkButton>
              <LinkButton href="/amlr-readiness" variant="secondary">
                Check your readiness
              </LinkButton>
            </div>
          </div>
          <nav className="mt-6 space-y-2 text-[13.5px]">
            <p className="eyebrow">Guides</p>
            <Link href="/aml-for-yacht-brokers" className="block text-ink-2 hover:text-ink">AML for yacht brokers</Link>
            <Link href="/amlr-article-74-threshold-reporting" className="block text-ink-2 hover:text-ink">Article 74 threshold reporting</Link>
            <Link href="/aml-for-aircraft-dealers" className="block text-ink-2 hover:text-ink">AML for aircraft dealers</Link>
            <Link href="/aml-for-luxury-car-dealers" className="block text-ink-2 hover:text-ink">AML for luxury car dealers</Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
