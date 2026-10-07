import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { accessState } from "@/lib/billing/access";
import { billingMode } from "@/lib/billing/stripe";
import { getPlan, PLANS } from "@/lib/billing/plans";
import { date } from "@/lib/format";
import { mockCancelAction, mockResumeAction, openPortalAction } from "@/app/actions/billing";
import { Badge, Card, CardHeader, Notice } from "@/components/ui";
import { ActionButton } from "@/components/app/action-button";
import { PlanPicker } from "./plan-picker";
import { SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; canceled?: string; canceled_sub?: string; plan?: string; interval?: string }> }) {
  const { user, org } = await requireUser();
  const sp = await searchParams;
  const access = accessState(org);
  const mode = org.isDemo ? "mock" : billingMode();
  const plan = getPlan(org.plan);
  const isAdmin = ["owner", "admin"].includes(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-[40px]">Billing</h1>
        <p className="mt-1 text-[14px] text-muted">One subscription per firm. Your files stay available to view and export whatever your plan.</p>
      </div>
      {sp.success ? <Notice tone="ok" title="Subscription active">Thank you — your plan is active. Screening, monitoring and new deal files are unlocked.</Notice> : null}
      {sp.canceled ? <Notice tone="sea">Checkout cancelled — nothing was charged.</Notice> : null}
      {sp.canceled_sub ? <Notice tone="sea">Your subscription will end at the close of the current period. You can resume any time before then.</Notice> : null}
      {mode === "mock" ? (
        <Notice tone="warn" title={org.isDemo ? "Demo workspace: simulated billing" : "Stripe is not configured: simulated billing"}>
          Checkout runs in a simulated mode and nothing is charged. {org.isDemo ? "" : "Add STRIPE_SECRET_KEY and price IDs to take real payments."}
        </Notice>
      ) : null}

      <Card>
        <CardHeader title="Current plan" />
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            {access.kind === "active" ? (
              <>
                <p className="text-[18px] font-semibold">
                  {plan?.name ?? org.plan} <span className="font-normal text-muted">· billed {org.billingInterval === "year" ? "yearly" : "monthly"}</span>
                </p>
                <p className="text-[13px] text-muted">
                  {org.cancelAtPeriodEnd ? `Cancels on ${date(org.currentPeriodEnd)}` : `Renews on ${date(org.currentPeriodEnd)}`}
                </p>
              </>
            ) : access.kind === "trial" ? (
              <>
                <p className="text-[18px] font-semibold">Free trial · Brokerage features</p>
                <p className="text-[13px] text-muted">
                  {access.daysLeft} day{access.daysLeft === 1 ? "" : "s"} left · ends {date(org.trialEndsAt)}
                </p>
              </>
            ) : access.kind === "demo" ? (
              <p className="text-[18px] font-semibold">Demo workspace</p>
            ) : access.kind === "past_due" ? (
              <p className="text-[18px] font-semibold text-warn">Payment failed — please update your card</p>
            ) : (
              <p className="text-[18px] font-semibold text-bad">No active plan</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {access.kind === "active" ? <Badge tone={org.cancelAtPeriodEnd ? "warn" : "ok"}>{org.cancelAtPeriodEnd ? "Cancelling" : "Active"}</Badge> : null}
            {isAdmin && access.kind === "active" && mode === "stripe" ? (
              <ActionButton action={openPortalAction} variant="secondary" size="sm">
                Manage billing &amp; invoices
              </ActionButton>
            ) : null}
            {isAdmin && (access.kind === "active" || access.kind === "past_due") && mode === "mock" ? (
              org.cancelAtPeriodEnd ? (
                <form action={mockResumeAction}>
                  <SubmitButton variant="secondary" size="sm">
                    Resume subscription
                  </SubmitButton>
                </form>
              ) : (
                <form action={mockCancelAction}>
                  <SubmitButton variant="secondary" size="sm">
                    Cancel subscription
                  </SubmitButton>
                </form>
              )
            ) : null}
          </div>
        </div>
      </Card>

      {isAdmin && (access.kind !== "active" || org.cancelAtPeriodEnd) ? (
        <PlanPicker plans={PLANS} defaultPlan={sp.plan === "starter" ? "starter" : "brokerage"} defaultInterval={sp.interval === "year" ? "year" : "month"} />
      ) : null}
      {!isAdmin ? <Notice>Ask an owner or admin of {org.name} to manage the subscription.</Notice> : null}
    </div>
  );
}
