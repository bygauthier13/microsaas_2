import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PLANS, TRIAL_DAYS } from "@/lib/billing/plans";
import { LinkButton } from "@/components/ui";
import { PricingToggle } from "./pricing-toggle";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple per-firm pricing for AML deal files: Starter €190/month, Brokerage €490/month, Fleet on request. 14-day free trial, no card.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1 className="display mt-4 text-[48px] sm:text-[60px]">One price per firm. No per-check surprises.</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-2">
          Brokers do few, very large deals — so we don&apos;t charge per screening. Every plan starts with a {TRIAL_DAYS}-day trial of Brokerage, no card required.
        </p>
      </div>
      <PricingToggle plans={PLANS} />
      <div className="mt-16 grid gap-8 rounded-2xl border border-line bg-white p-8 md:grid-cols-3">
        <div>
          <p className="eyebrow">Founding firms</p>
          <p className="mt-3 font-serif text-[30px] leading-tight">€390/month, locked for 24 months.</p>
          <p className="mt-2 text-[14px] text-muted">For the first 20 brokerages that sign up before the 2027 Monaco Yacht Show. Ask for the code during your trial.</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-[15px] font-semibold">Every plan includes</p>
          <ul className="mt-4 grid gap-2.5 text-[14px] text-ink-2 sm:grid-cols-2">
            {[
              "Encrypted document vault (AES-256-GCM)",
              "Client KYC links in your firm's name",
              "Sanctions, PEP & crime-list screening",
              "Risk model with legal references",
              "Audit trail with timestamps & IPs",
              "AML file export at any time",
              "5-year record retention — even after you cancel",
              "EU AMLR, Monaco and France coverage",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-12 text-center">
        <p className="text-[14px] text-muted">Prefer to see it first?</p>
        <LinkButton href="/demo" variant="secondary" className="mt-3">
          Open the live demo workspace
        </LinkButton>
      </div>
    </div>
  );
}
