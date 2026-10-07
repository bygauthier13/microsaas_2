import type Stripe from "stripe";
import { config } from "@/lib/config";
import { recordActivation, stripe, syncSubscription } from "@/lib/billing/stripe";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const s = stripe();
  if (!s || !config.stripe.webhookSecret) return new Response("Stripe not configured", { status: 501 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(body, signature, config.stripe.webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await s.subscriptions.retrieve(typeof session.subscription === "string" ? session.subscription : session.subscription.id);
          const res = await syncSubscription(sub);
          if (res) await recordActivation(res.org, sub.metadata?.plan ?? "", sub.metadata?.interval ?? "", "stripe");
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const res = await syncSubscription(event.data.object as Stripe.Subscription);
        if (res) await track("subscription_canceled", { source: "stripe" }, { orgId: res.org.id });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as unknown as { subscription?: string | null }).subscription ?? invoice.parent?.subscription_details?.subscription;
        if (subId) await syncSubscription(await s.subscriptions.retrieve(typeof subId === "string" ? subId : subId.id));
        break;
      }
    }
  } catch (err) {
    console.error("[stripe] webhook handling failed", event.type, err);
    return new Response("Webhook handler error", { status: 500 });
  }
  return Response.json({ received: true });
}
