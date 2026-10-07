"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/session";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";
import { audit } from "@/lib/audit";
import { billingMode, priceIdFor, recordActivation, stripe } from "@/lib/billing/stripe";
import type { ActionResult } from "@/lib/actions-util";

function parsePlan(form: FormData) {
  const plan = form.get("plan") === "starter" ? "starter" : "brokerage";
  const interval = form.get("interval") === "year" ? "year" : "month";
  return { plan, interval } as const;
}

export async function startCheckoutAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const { user, org } = await requireUser();
  if (!["owner", "admin"].includes(user.role)) return { error: "Only owners and admins can manage billing." };
  const { plan, interval } = parsePlan(form);
  await track("checkout_started", { plan, interval, mode: org.isDemo ? "demo" : billingMode() }, { orgId: org.id, userId: user.id, isDemo: org.isDemo });

  // Demo workspaces and unconfigured environments use the simulated checkout.
  if (org.isDemo || billingMode() === "mock") redirect(`/app/billing/mock-checkout?plan=${plan}&interval=${interval}`);

  const price = priceIdFor(plan, interval);
  if (!price) return { error: `Stripe price for ${plan}/${interval} is not configured (STRIPE_PRICE_${plan.toUpperCase()}_${interval === "year" ? "YEARLY" : "MONTHLY"}).` };
  const s = stripe()!;
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: org.id,
    customer: org.stripeCustomerId ?? undefined,
    customer_email: org.stripeCustomerId ? undefined : user.email,
    subscription_data: { metadata: { orgId: org.id, plan, interval } },
    metadata: { orgId: org.id, plan, interval },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    success_url: `${config.appUrl}/app/billing?success=1`,
    cancel_url: `${config.appUrl}/app/billing?canceled=1`,
  });
  redirect(session.url!);
}

export async function openPortalAction(): Promise<ActionResult> {
  const { user, org } = await requireUser();
  if (!["owner", "admin"].includes(user.role)) return { error: "Only owners and admins can manage billing." };
  const s = stripe();
  if (!s || org.isDemo || !org.stripeCustomerId) return { error: "Billing portal is available once you subscribe through Stripe." };
  const portal = await s.billingPortal.sessions.create({ customer: org.stripeCustomerId, return_url: `${config.appUrl}/app/billing` });
  redirect(portal.url);
}

/** Simulated checkout for demo workspaces and local development (no Stripe keys). */
export async function mockCompleteCheckoutAction(form: FormData): Promise<void> {
  const { user, org } = await requireUser();
  if (billingMode() === "stripe" && !org.isDemo) redirect("/app/billing");
  const { plan, interval } = parsePlan(form);
  const db = await getDb();
  const periodEnd = new Date(Date.now() + (interval === "year" ? 365 : 30) * 86_400_000);
  await db
    .update(organizations)
    .set({ plan, billingInterval: interval, subscriptionStatus: "active", cancelAtPeriodEnd: false, currentPeriodEnd: periodEnd, stripeCustomerId: org.stripeCustomerId ?? `mock_cus_${org.id.slice(0, 8)}` })
    .where(eq(organizations.id, org.id));
  await audit(org.id, { type: "user", id: user.id, label: user.name }, "billing.subscribed", { plan, interval, mode: "mock" });
  if (!org.isDemo) await recordActivation(org, plan, interval, "mock");
  else await track("subscription_activated", { plan, interval, source: "mock" }, { orgId: org.id, isDemo: true });
  redirect("/app/billing?success=1");
}

export async function mockCancelAction(): Promise<void> {
  const { user, org } = await requireUser();
  if (billingMode() === "stripe" && !org.isDemo) redirect("/app/billing");
  const db = await getDb();
  await db.update(organizations).set({ cancelAtPeriodEnd: true }).where(eq(organizations.id, org.id));
  await audit(org.id, { type: "user", id: user.id, label: user.name }, "billing.canceled", { mode: "mock" });
  await track("subscription_canceled", { plan: org.plan, mode: "mock" }, { orgId: org.id, userId: user.id, isDemo: org.isDemo });
  redirect("/app/billing?canceled_sub=1");
}

export async function mockResumeAction(): Promise<void> {
  const { org } = await requireUser();
  if (billingMode() === "stripe" && !org.isDemo) redirect("/app/billing");
  const db = await getDb();
  await db.update(organizations).set({ cancelAtPeriodEnd: false }).where(eq(organizations.id, org.id));
  redirect("/app/billing");
}
