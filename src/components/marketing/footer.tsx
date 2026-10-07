import Link from "next/link";
import { Logo } from "@/components/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-sand/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
            AML deal files for high-value transactions — superyachts, private aircraft and collector cars. Decision support for obliged entities; not legal advice.
          </p>
        </div>
        <div>
          <p className="eyebrow">Product</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-ink-2">
            <li><Link href="/#how">How it works</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/demo">Live demo</Link></li>
            <li><Link href="/security">Security</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Guides</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-ink-2">
            <li><Link href="/aml-for-yacht-brokers">AML for yacht brokers</Link></li>
            <li><Link href="/amlr-article-74-threshold-reporting">Article 74 reporting</Link></li>
            <li><Link href="/aml-for-aircraft-dealers">AML for aircraft dealers</Link></li>
            <li><Link href="/aml-for-luxury-car-dealers">AML for luxury car dealers</Link></li>
            <li><Link href="/amlr-readiness">AMLR readiness check</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Company</p>
          <ul className="mt-4 space-y-2.5 text-[14px] text-ink-2">
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><a href="mailto:hello@ensign.example">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[12px] text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Ensign. All rights reserved.</p>
          <p>Regulatory references are summaries. Verify obligations with your counsel and supervisor.</p>
        </div>
      </div>
    </footer>
  );
}
