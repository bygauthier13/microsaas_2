import { getDb } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";
import { config } from "@/lib/config";

/**
 * Product analytics. Events are the activation funnel, not vanity metrics:
 * signup → onboarding_completed → deal_created → kyc_link_sent → kyc_submitted →
 * screening_run → deal_decided (activation) → file_exported → checkout_started →
 * subscription_activated / subscription_canceled. Also: readiness_check_completed, demo_started.
 */
export async function track(
  name: string,
  props: Record<string, unknown> = {},
  ctx: { orgId?: string | null; userId?: string | null; isDemo?: boolean } = {},
) {
  try {
    const db = await getDb();
    await db.insert(analyticsEvents).values({
      name,
      props,
      orgId: ctx.orgId ?? null,
      userId: ctx.userId ?? null,
      isDemo: ctx.isDemo ?? false,
    });
    if (config.posthog.apiKey && !ctx.isDemo) {
      void fetch(`${config.posthog.host}/i/v0/e/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          api_key: config.posthog.apiKey,
          event: name,
          distinct_id: ctx.userId || ctx.orgId || "anonymous",
          properties: { ...props, org_id: ctx.orgId, $groups: ctx.orgId ? { company: ctx.orgId } : undefined },
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("[analytics] failed to record", name, err);
  }
}
