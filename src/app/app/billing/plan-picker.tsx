"use client";
import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { startCheckoutAction } from "@/app/actions/billing";
import type { ActionResult } from "@/lib/actions-util";
import type { Plan } from "@/lib/billing/plans";
import { FormError, cn } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function PlanPicker({ plans, defaultPlan, defaultInterval }: { plans: Plan[]; defaultPlan: string; defaultInterval: "month" | "year" }) {
  const [interval, setInterval] = useState(defaultInterval);
  const [state, action] = useActionState<ActionResult, FormData>(startCheckoutAction, {});
  const purchasable = plans.filter((p) => p.monthly);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold">Choose a plan</h2>
        <div className="inline-flex rounded-full border border-line bg-white p-1 text-[12.5px]">
          {(["month", "year"] as const).map((i) => (
            <button key={i} type="button" onClick={() => setInterval(i)} className={cn("rounded-full px-3 py-1 font-medium", interval === i ? "bg-ink text-white" : "text-ink-2")}>
              {i === "month" ? "Monthly" : "Yearly · 2 months free"}
            </button>
          ))}
        </div>
      </div>
      <FormError message={state.error} />
      <div className="grid gap-4 md:grid-cols-2">
        {purchasable.map((p) => (
          <form key={p.id} action={action} className={cn("flex flex-col rounded-2xl border bg-white p-6", p.id === defaultPlan ? "border-ink" : "border-line")}>
            <input type="hidden" name="plan" value={p.id} />
            <input type="hidden" name="interval" value={interval} />
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold">{p.name}</p>
              {p.highlighted ? <span className="rounded-full bg-brass-soft px-2.5 py-0.5 text-[12px] font-medium text-brass">Most popular</span> : null}
            </div>
            <p className="mt-1 text-[13px] text-muted">{p.tagline}</p>
            <p className="mt-4 font-serif text-[44px] leading-none">
              €{(interval === "year" ? p.yearly : p.monthly)?.toLocaleString("en-GB")}
              <span className="ml-1 font-sans text-[13px] text-muted">/{interval} excl. VAT</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-[13.5px] text-ink-2">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-ok" /> {f}
                </li>
              ))}
            </ul>
            <SubmitButton className="mt-6 w-full" variant={p.highlighted ? "primary" : "secondary"} pendingText="Opening checkout…">
              Subscribe to {p.name}
            </SubmitButton>
          </form>
        ))}
      </div>
      <p className="text-[12.5px] text-muted">Secure payment by Stripe. Cancel any time from the billing portal; your files remain exportable.</p>
    </div>
  );
}
