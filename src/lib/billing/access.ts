import type { Organization } from "@/lib/db/schema";

export type AccessState =
  | { kind: "demo" }
  | { kind: "trial"; daysLeft: number }
  | { kind: "active"; plan: string; cancelAtPeriodEnd: boolean; periodEnd: Date | null }
  | { kind: "past_due" }
  | { kind: "expired" };

export function accessState(org: Organization, now = new Date()): AccessState {
  if (org.isDemo) return { kind: "demo" };
  if (org.subscriptionStatus === "active") {
    return { kind: "active", plan: org.plan, cancelAtPeriodEnd: org.cancelAtPeriodEnd, periodEnd: org.currentPeriodEnd };
  }
  if (org.subscriptionStatus === "past_due") return { kind: "past_due" };
  if (org.subscriptionStatus === "trialing" && org.trialEndsAt && org.trialEndsAt > now) {
    return { kind: "trial", daysLeft: Math.max(1, Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / 86_400_000)) };
  }
  return { kind: "expired" };
}

/** Writes (new deals, KYC links, screening) need an active plan, trial or grace period. Reading/exporting never does. */
export function canWrite(org: Organization): boolean {
  const s = accessState(org);
  return s.kind === "demo" || s.kind === "trial" || s.kind === "active" || s.kind === "past_due";
}
