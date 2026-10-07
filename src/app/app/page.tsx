import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { ArrowRight, Bell, CircleCheck, FilePlus2, Hourglass, Radar, ShieldAlert, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { alerts, deals, kycRequests, parties, thresholdReports } from "@/lib/db/schema";
import { listDeals } from "@/lib/deals/service";
import { markAlertsReadAction } from "@/app/actions/app";
import { Badge, Card, CardHeader, EmptyState, LinkButton, Notice, RiskBadge, StatusBadge } from "@/components/ui";
import { compactMoney, date, daysUntilAmlr } from "@/lib/format";
import { CopyField } from "@/components/app/copy-field";
import { config } from "@/lib/config";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { user, org } = await requireUser();
  const { welcome } = await searchParams;
  const db = await getDb();
  const [dealRows, unread, [kycOpen], [openMatches], dueReports] = await Promise.all([
    listDeals(org.id),
    db.select().from(alerts).where(and(eq(alerts.orgId, org.id), isNull(alerts.readAt))).orderBy(desc(alerts.createdAt)).limit(8),
    db.select({ n: sql<number>`count(*)::int` }).from(kycRequests).where(and(eq(kycRequests.orgId, org.id), sql`${kycRequests.status} in ('sent','opened')`)),
    db.select({ n: sql<number>`count(*)::int` }).from(parties).where(and(eq(parties.orgId, org.id), eq(parties.screeningStatus, "potential_match"))),
    db
      .select({ id: thresholdReports.id, dealId: thresholdReports.dealId, status: thresholdReports.status, dueDate: thresholdReports.dueDate, reference: deals.reference, assetName: deals.assetName })
      .from(thresholdReports)
      .innerJoin(deals, eq(thresholdReports.dealId, deals.id))
      .where(and(eq(thresholdReports.orgId, org.id), sql`${thresholdReports.status} <> 'submitted'`, sql`${deals.status} not in ('rejected','aborted')`)),
  ]);
  const active = dealRows.filter((d) => !["completed", "rejected", "aborted"].includes(d.status));
  const awaitingApproval = active.filter((d) => d.status === "review" && !d.decision);
  const highRisk = active.filter((d) => d.riskLevel === "high" || d.riskLevel === "prohibited");
  const days = daysUntilAmlr();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{org.name}</p>
          <h1 className="display mt-2 text-[40px]">Good day, {firstName}.</h1>
        </div>
        <LinkButton href="/app/deals/new">
          <FilePlus2 className="size-4" /> New deal file
        </LinkButton>
      </div>

      {welcome && dealRows.length === 0 ? (
        <Card tone="accent" className="overflow-hidden">
          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <Badge tone="brass">
                <Sparkles className="size-3" /> Step 2 of 2
              </Badge>
              <h2 className="display mt-3 text-[32px]">Open your first deal file</h2>
              <p className="mt-2 text-[14.5px] text-ink-2">
                Pick a live or recent deal. Enter the asset and price — Ensign tells you immediately whether Article 74 applies — then send the buyer&apos;s lawyer the
                secure KYC link. Most firms finish this in under five minutes.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <LinkButton href="/app/deals/new" size="lg">
                Open a deal file <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/demo" variant="secondary" size="lg">
                See a finished example first
              </LinkButton>
            </div>
          </div>
        </Card>
      ) : null}

      {org.isDemo && org.settings?.demoClientLink ? (
        <Notice tone="brass" title="Try the buyer's side">
          <p>M/Y SERENITY BAY is waiting for the buyer&apos;s lawyer. Open the client link in a new tab to see exactly what your client sees — then submit it and watch the file screen and score itself.</p>
          <div className="mt-3 max-w-xl">
            <CopyField value={`${config.appUrl}${org.settings.demoClientLink}`} openLabel="Open client view" />
          </div>
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<FilePlus2 className="size-4" />} label="Active deal files" value={active.length} href="/app/deals" />
        <Stat icon={<Hourglass className="size-4" />} label="Awaiting client KYC" value={kycOpen?.n ?? 0} href="/app/deals" />
        <Stat icon={<ShieldAlert className="size-4" />} label="Potential matches to review" value={openMatches?.n ?? 0} tone={(openMatches?.n ?? 0) > 0 ? "bad" : undefined} href="/app/monitoring" />
        <Stat icon={<CircleCheck className="size-4" />} label="Awaiting approval" value={awaitingApproval.length} href="/app/deals" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Deal files" description="Most recently updated" action={<Link href="/app/deals" className="text-[13px] font-medium text-sea">View all</Link>} />
          {dealRows.length === 0 ? (
            <EmptyState
              icon={<FilePlus2 className="size-5" />}
              title="No deal files yet"
              body="Every sale, charter or new build gets its own AML file: parties, documents, screening, risk, approval and report."
              action={<LinkButton href="/app/deals/new">Open a deal file</LinkButton>}
            />
          ) : (
            <ul className="divide-y divide-line">
              {dealRows.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <Link href={`/app/deals/${d.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-paper sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-medium">{d.assetName}</p>
                      <p className="text-[12.5px] text-muted">
                        <span className="font-mono">{d.reference}</span> · {compactMoney(d.priceAmount, d.currency)} · {d.partyCount} part{d.partyCount === 1 ? "y" : "ies"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {d.openMatches ? <Badge tone="bad">{d.openMatches} to review</Badge> : null}
                      <RiskBadge level={d.riskLevel} />
                      <StatusBadge status={d.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card tone="ink">
            <div className="p-6">
              <p className="text-[12px] uppercase tracking-[0.16em] text-[#d9c49a]">EU AML Regulation</p>
              <p className="mt-3 font-serif text-[56px] leading-none num">{days}</p>
              <p className="mt-1 text-[14px] text-white/70">days until 10 July 2027</p>
              <p className="mt-4 text-[13px] leading-relaxed text-white/60">
                {highRisk.length} of your active files are high-risk. {dueReports.length} Article 74 report{dueReports.length === 1 ? "" : "s"} to prepare or file.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Alerts"
              action={
                unread.length ? (
                  <form action={markAlertsReadAction}>
                    <button className="text-[12.5px] text-muted hover:text-ink">Mark all read</button>
                  </form>
                ) : null
              }
            />
            {unread.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-6 text-[13.5px] text-muted">
                <Bell className="size-4" /> You&apos;re up to date. Daily monitoring runs every morning.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {unread.map((a) => (
                  <li key={a.id} className="px-5 py-3.5">
                    <Link href={a.dealId ? `/app/deals/${a.dealId}` : "/app/monitoring"} className="block">
                      <p className="flex items-center gap-2 text-[13.5px] font-medium">
                        <span className={`size-1.5 rounded-full ${a.severity === "critical" ? "bg-bad" : a.severity === "warning" ? "bg-warn" : "bg-sea"}`} />
                        {a.title}
                      </p>
                      {a.body ? <p className="mt-0.5 text-[12.5px] text-muted">{a.body}</p> : null}
                      <p className="mt-1 text-[11.5px] text-faint">{date(a.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {dueReports.length ? (
            <Card>
              <CardHeader title="Article 74 reports" description="Threshold reports to the FIU" />
              <ul className="divide-y divide-line">
                {dueReports.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <Link href={`/app/deals/${r.dealId}#report`} className="flex items-center justify-between gap-3 text-[13.5px]">
                      <span className="truncate">{r.assetName}</span>
                      <Badge tone={r.status === "prepared" ? "sea" : "warn"}>{r.dueDate ? `Due ${date(r.dueDate)}` : r.status === "prepared" ? "Prepared" : "On completion"}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Link href="/app/monitoring" className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4 text-[14px] hover:border-ink/30">
            <span className="flex items-center gap-2.5">
              <Radar className="size-4 text-brass" /> Ongoing monitoring
            </span>
            <ArrowRight className="size-4 text-muted" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, href, tone }: { icon: React.ReactNode; label: string; value: number; href: string; tone?: "bad" }) {
  return (
    <Link href={href} className="rounded-xl border border-line bg-white p-5 hover:border-ink/30">
      <span className={`flex items-center gap-2 text-[12.5px] ${tone === "bad" ? "text-bad" : "text-muted"}`}>
        {icon}
        {label}
      </span>
      <span className={`mt-3 block font-serif text-[40px] leading-none num ${tone === "bad" ? "text-bad" : ""}`}>{value}</span>
    </Link>
  );
}
