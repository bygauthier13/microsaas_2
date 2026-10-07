import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { organizations, type Organization } from "@/lib/db/schema";
import { track } from "@/lib/analytics";

let client: Stripe | null = null;
export function stripe(): Stripe | null {
  if (!config.stripe.secretKey) return null;
  client ??= new Stripe(config.stripe.secretKey, { appInfo: { name: "Ensign" } });
  return client;
}

export function billingMode(): "stripe" | "mock" {
  return stripe() ? "stripe" : "mock";
}

export function priceIdFor(plan: string, interval: string): string | undefined {
  return config.stripe.prices[`${plan}_${interval}`];
}

export function planForPrice(priceId: string | undefined | null): { plan: string; interval: string } | null {
  if (!priceId) return null;
  for (const [key, id] of Object.entries(config.stripe.prices)) {
    if (id === priceId) {
      const [plan, interval] = key.split("_");
      return { plan, interval };
    }
  }
  return null;
}

/** Applies a Stripe subscription object to the organisation it belongs to. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const db = await getDb();
  const orgId = sub.metadata?.orgId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const [org] = orgId
    ? await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1)
    : await db.select().from(organizations).where(eq(organizations.stripeCustomerId, customerId)).limit(1);
  if (!org) return null;
  const item = sub.items.data[0];
  const mapped = planForPrice(item?.price?.id);
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const status =
    sub.status === "active" || sub.status === "trialing" ? "active" : sub.status === "past_due" || sub.status === "unpaid" ? "past_due" : sub.status === "canceled" ? "canceled" : "incomplete";
  await db
    .update(organizations)
    .set({
      plan: status === "canceled" ? org.plan : (mapped?.plan ?? org.plan),
      billingInterval: mapped?.interval ?? org.billingInterval,
      subscriptionStatus: status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    })
    .where(eq(organizations.id, org.id));
  return { org, status };
}

export async function recordActivation(org: Organization, plan: string, interval: string, source: "stripe" | "mock") {
  await track("subscription_activated", { plan, interval, source }, { orgId: org.id });
}
