import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { kycRequests, organizations, users } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { safeEqual } from "@/lib/crypto";
import { runMonitoring } from "@/lib/deals/parties";
import { purgeExpiredDemos } from "@/lib/demo/seed";
import { sendEmail } from "@/lib/email";
import { trialEndingEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Daily job (Vercel Cron): ongoing monitoring, link expiry, trial reminders, demo cleanup. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!config.cronSecret || !safeEqual(auth, `Bearer ${config.cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = await getDb();
  const now = new Date();
  const monitoring = await runMonitoring(now);
  const expired = await db
    .update(kycRequests)
    .set({ status: "expired" })
    .where(and(lt(kycRequests.expiresAt, now), eq(kycRequests.status, "sent")))
    .returning({ id: kycRequests.id });
  const demos = await purgeExpiredDemos(now);

  // Trial reminders at 3 days and 1 day before the end.
  let reminders = 0;
  const soon = await db
    .select({ org: organizations, user: users })
    .from(organizations)
    .innerJoin(users, and(eq(users.orgId, organizations.id), eq(users.role, "owner")))
    .where(and(eq(organizations.subscriptionStatus, "trialing"), eq(organizations.isDemo, false), gt(organizations.trialEndsAt, now)));
  for (const { org, user } of soon) {
    const days = Math.ceil((org.trialEndsAt!.getTime() - now.getTime()) / 86_400_000);
    if (days === 3 || days === 1) {
      await sendEmail({ ...trialEndingEmail(user.name, days), to: user.email, orgId: org.id });
      reminders++;
    }
  }
  return Response.json({ ok: true, monitoring, expiredLinks: expired.length, demosPurged: demos, trialReminders: reminders });
}
