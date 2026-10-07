import Link from "next/link";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { daysUntilAmlr } from "@/lib/format";
import { MobileNav } from "./mobile-nav";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/aml-for-yacht-brokers", label: "Guide" },
  { href: "/amlr-readiness", label: "Readiness check" },
];

export function MarketingHeader() {
  const days = daysUntilAmlr();
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="bg-ink text-[12.5px] text-white/85">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center">
          <span className="hidden size-1.5 rounded-full bg-[#d9c49a] sm:inline-block" />
          <span>
            EU AML Regulation applies to yacht, aircraft &amp; luxury car dealers on 10 July 2027 —{" "}
            <strong className="font-semibold text-white num">{days} days</strong> left.
          </span>
          <Link href="/amlr-readiness" className="hidden underline underline-offset-2 hover:text-white sm:inline">
            Check your readiness →
          </Link>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-7 text-[14px] text-ink-2 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LinkButton href="/login" variant="ghost" size="sm">
            Sign in
          </LinkButton>
          <LinkButton href="/signup" size="sm">
            Start free trial
          </LinkButton>
        </div>
        <MobileNav items={NAV} />
      </div>
    </header>
  );
}
