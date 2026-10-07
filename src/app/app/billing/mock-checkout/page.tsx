import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, LockKeyhole } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/billing/plans";
import { mockCompleteCheckoutAction } from "@/app/actions/billing";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Checkout (simulated)" };

export default async function MockCheckout({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string }> }) {
  const { user, org } = await requireUser();
  const sp = await searchParams;
  const plan = getPlan(sp.plan === "starter" ? "starter" : "brokerage")!;
  const interval = sp.interval === "year" ? "year" : "month";
  const price = interval === "year" ? plan.yearly! : plan.monthly!;
  return (
    <div className="mx-auto max-w-lg">
      <Notice tone="warn" title="Simulated checkout">
        Stripe is not connected {org.isDemo ? "in demo workspaces" : "in this environment"}. This screen stands in for Stripe Checkout — no card is charged.
      </Notice>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line bg-paper px-6 py-5">
          <p className="text-[13px] text-muted">{org.name}</p>
          <p className="mt-1 font-serif text-[34px] leading-none">
            €{price.toLocaleString("en-GB")}
            <span className="ml-1 font-sans text-[13px] text-muted">per {interval}</span>
          </p>
          <p className="mt-1 text-[13px]">Ensign {plan.name}</p>
        </div>
        <form action={mockCompleteCheckoutAction} className="space-y-4 px-6 py-6">
          <input type="hidden" name="plan" value={plan.id} />
          <input type="hidden" name="interval" value={interval} />
          <div className="rounded-lg border border-line-strong px-3 py-2.5 text-[14px] text-muted">{user.email}</div>
          <div className="flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2.5 text-[14px] text-muted">
            <CreditCard className="size-4" /> 4242 4242 4242 4242 · 12/34 · 123
          </div>
          <SubmitButton className="w-full" size="lg" pendingText="Processing…">
            Simulate successful payment
          </SubmitButton>
          <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted">
            <LockKeyhole className="size-3.5" /> Test mode
          </p>
        </form>
      </div>
      <p className="mt-4 text-center text-[13px]">
        <Link href="/app/billing?canceled=1" className="text-muted underline underline-offset-4">
          Cancel and return
        </Link>
      </p>
    </div>
  );
}
