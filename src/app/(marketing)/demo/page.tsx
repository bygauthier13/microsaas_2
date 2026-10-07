import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { LinkButton } from "@/components/ui";
import { DemoButton } from "./demo-button";

export const metadata: Metadata = {
  title: "Live demo",
  description: "Explore a fictional superyacht brokerage workspace: six deal files, sanctions screening, PEP approvals, client KYC links and Article 74 reports. No sign-up.",
  alternates: { canonical: "/demo" },
};
export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const current = await getCurrentUser();
  const realUser = current && !current.user.isDemo;
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div>
        <p className="eyebrow">Live demo · no sign-up</p>
        <h1 className="display mt-4 text-[48px] sm:text-[60px]">Walk through a brokerage&apos;s compliance desk.</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
          We create a private, fictional workspace for <em>Riviera Yacht Partners</em> — six deal files at different stages. Click anything. Nothing is real, nothing is
          sent, and it deletes itself after 24 hours.
        </p>
        <div className="mt-8">
          {realUser ? (
            <div className="space-y-3">
              <p className="text-[14px] text-muted">You&apos;re signed in to {current!.org.name}. Open the demo in a private window to keep your session.</p>
              <LinkButton href="/app">Go to your workspace</LinkButton>
            </div>
          ) : (
            <DemoButton />
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-white p-7">
        <p className="text-[15px] font-semibold">In the demo you can:</p>
        <ul className="mt-4 space-y-3 text-[14.5px] text-ink-2">
          {[
            "Review a €38.5m Benetti sale: BVI company → Jersey trust → Monaco-resident owners (enhanced due diligence).",
            "Clear a fuzzy sanctions hit on the buyer's lawyer as a false positive — with a recorded rationale.",
            "Open the buyer's secure KYC link and submit it yourself, then watch the file screen and score itself.",
            "See a PEP-owned Gulfstream approved by senior management and its Article 74 report filed.",
            "See a sanctioned buyer caught and the deal refused.",
            "Export a complete, printable AML file.",
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-ok" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
