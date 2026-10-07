import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { analyticsEvents, leads, organizations } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { date } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Founder metrics" };

const FUNNEL = ["signup", "onboarding_completed", "deal_created", "kyc_link_sent", "kyc_submitted", "screening_run", "deal_decided", "file_exported", "checkout_started", "subscription_activated", "subscription_canceled"];

export default async function AdminPage() {
  const { user } = await requireUser();
  if (!config.adminEmails.includes(user.email)) notFound();
  const db = await getDb();
  const counts = await db
    .select({ name: analyticsEvents.name, n: sql<number>`count(distinct coalesce(${analyticsEvents.orgId}, ${analyticsEvents.id}))::int` })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.isDemo, false))
    .groupBy(analyticsEvents.name);
  const [demoStarts] = await db.select({ n: sql<number>`count(*)::int` }).from(analyticsEvents).where(eq(analyticsEvents.name, "demo_started"));
  const orgs = await db.select().from(organizations).where(eq(organizations.isDemo, false)).orderBy(desc(organizations.createdAt)).limit(30);
  const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(200);
  const leadRows = allLeads.filter((l) => l.email).slice(0, 30);
  const paying = orgs.filter((o) => o.subscriptionStatus === "active");
  const mrr = paying.reduce((s, o) => s + (o.plan === "starter" ? (o.billingInterval === "year" ? 1900 / 12 : 190) : o.plan === "brokerage" ? (o.billingInterval === "year" ? 4900 / 12 : 490) : 0), 0);
  const get = (n: string) => counts.find((c) => c.name === n)?.n ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="display text-[40px]">Founder metrics</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="MRR (EUR)" value={`€${Math.round(mrr).toLocaleString("en-GB")}`} />
        <Metric label="Paying firms" value={paying.length} />
        <Metric label="Demo workspaces opened" value={demoStarts?.n ?? 0} />
        <Metric label="Readiness checks · with email" value={`${allLeads.length} · ${leadRows.length}`} />
      </div>
      <Card>
        <CardHeader title="Activation funnel" description="Distinct organisations reaching each step (demo excluded)" />
        <ul className="divide-y divide-line">
          {FUNNEL.map((f) => (
            <li key={f} className="flex items-center gap-4 px-5 py-2.5 text-[13px]">
              <span className="w-52 font-mono text-[12px]">{f}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                <span className="block h-full rounded-full bg-sea" style={{ width: `${Math.min(100, (get(f) / Math.max(1, get("signup"))) * 100)}%` }} />
              </span>
              <span className="w-10 text-right num">{get(f)}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent firms" />
          <ul className="divide-y divide-line text-[13px]">
            {orgs.map((o) => (
              <li key={o.id} className="flex justify-between px-5 py-2.5">
                <span>{o.name}</span>
                <span className="text-muted">
                  {o.subscriptionStatus} · {o.plan} · {date(o.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Readiness-check leads" />
          <ul className="divide-y divide-line text-[13px]">
            {leadRows.map((l) => (
              <li key={l.id} className="flex justify-between px-5 py-2.5">
                <span>{l.email ?? "anonymous"} {l.company ? `· ${l.company}` : ""}</span>
                <span className="text-muted">
                  score {l.score} · {date(l.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="mt-2 font-serif text-[34px] leading-none num">{value}</p>
    </Card>
  );
}
