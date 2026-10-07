"use client";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import type { Plan } from "@/lib/billing/plans";
import { buttonClass, cn } from "@/components/ui";

export function PricingToggle({ plans }: { plans: Plan[] }) {
  const [yearly, setYearly] = useState(false);
  return (
    <>
      <div className="mt-10 flex justify-center">
        <div role="radiogroup" aria-label="Billing interval" className="inline-flex rounded-full border border-line bg-white p-1 text-[13px]">
          {[
            { v: false, label: "Monthly" },
            { v: true, label: "Yearly · 2 months free" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={yearly === o.v}
              onClick={() => setYearly(o.v)}
              className={cn("rounded-full px-4 py-1.5 font-medium", yearly === o.v ? "bg-ink text-white" : "text-ink-2")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => {
          const price = yearly ? p.yearly : p.monthly;
          return (
            <div key={p.id} className={cn("flex flex-col rounded-2xl border p-7", p.highlighted ? "border-ink bg-white shadow-[0_20px_60px_-30px_rgba(11,27,43,0.4)]" : "border-line bg-white")}>
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-semibold">{p.name}</p>
                {p.highlighted ? <span className="rounded-full bg-brass-soft px-2.5 py-0.5 text-[12px] font-medium text-brass">Most popular</span> : null}
              </div>
              <p className="mt-1 text-[13.5px] text-muted">{p.tagline}</p>
              <p className="mt-6 font-serif text-[52px] leading-none">
                {price ? `€${price.toLocaleString("en-GB")}` : "Custom"}
                {price ? <span className="ml-1 font-sans text-[14px] text-muted">/{yearly ? "year" : "month"}</span> : null}
              </p>
              <p className="mt-2 h-5 text-[12.5px] text-muted">{price ? "Excl. VAT · billed per firm" : "From €1,250/month"}</p>
              <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-ink-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.monthly ? (
                <Link href={`/signup?plan=${p.id}&interval=${yearly ? "year" : "month"}`} className={buttonClass(p.highlighted ? "primary" : "secondary", "lg", "mt-8 w-full")}>
                  Start free trial
                </Link>
              ) : (
                <a href="mailto:hello@ensign.example?subject=Ensign%20Fleet" className={buttonClass("secondary", "lg", "mt-8 w-full")}>
                  Talk to us
                </a>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
