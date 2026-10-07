import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Radar } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { alerts, deals, parties } from "@/lib/db/schema";
import { canWrite } from "@/lib/billing/access";
import { planLimits } from "@/lib/billing/plans";
import { screeningProvider } from "@/lib/screening";
import { countryName } from "@/lib/countries";
import { dateTime, ROLE_LABELS } from "@/lib/format";
import { runMonitoringNowAction } from "@/app/actions/app";
import { Badge, Card, CardHeader, EmptyState, Notice } from "@/components/ui";
import { ActionButton } from "@/components/app/action-button";

export const metadata: Metadata = { title: "Monitoring" };

export default async function MonitoringPage() {
  const { org } = await requireUser();
  const db = await getDb();
  const [rows, recent] = await Promise.all([
    db
      .select({ party: parties, reference: deals.reference, assetName: deals.assetName, dealId: deals.id })
      .from(parties)
      .innerJoin(deals, eq(parties.dealId, deals.id))
      .where(and(eq(parties.orgId, org.id), eq(parties.monitored, true)))
      .orderBy(desc(parties.lastScreenedAt)),
    db.select().from(alerts).where(eq(alerts.orgId, org.id)).orderBy(desc(alerts.createdAt)).limit(20),
  ]);
  const limit = planLimits(org.plan).monitoredParties;
  const provider = screeningProvider({ isDemoOrg: org.isDemo });
  const open = rows.filter((r) => r.party.screeningStatus === "potential_match");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="display text-[40px]">Ongoing monitoring</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            Every monitored person and company is re-screened daily against sanctions, PEP and crime lists. A new designation of a past buyer raises an alert and emails
            your compliance officer.
          </p>
        </div>
        {canWrite(org) ? (
          <ActionButton action={runMonitoringNowAction} variant="secondary">
            <Radar className="size-4" /> Re-screen now
          </ActionButton>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[12.5px] text-muted">Monitored parties</p>
          <p className="mt-2 font-serif text-[36px] leading-none num">
            {rows.length}
            {limit ? <span className="font-sans text-[14px] text-muted"> / {limit}</span> : null}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] text-muted">Open potential matches</p>
          <p className={`mt-2 font-serif text-[36px] leading-none num ${open.length ? "text-bad" : ""}`}>{open.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] text-muted">Data source</p>
          <p className="mt-2 text-[14px] font-medium">{provider === "opensanctions" ? "OpenSanctions (live)" : "Fictional demo watchlist"}</p>
          <p className="text-[12px] text-muted">{provider === "opensanctions" ? "Sanctions, PEPs, crime & debarment" : "Set OPENSANCTIONS_API_KEY for real screening"}</p>
        </Card>
      </div>
      {provider === "demo" && !org.isDemo ? (
        <Notice tone="warn" title="Screening is in demo mode">
          No OpenSanctions API key is configured, so parties are screened against a fictional list. Configure the key before relying on results.
        </Notice>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader title="Monitored parties" />
          {rows.length === 0 ? (
            <EmptyState icon={<Radar className="size-5" />} title="Nobody monitored yet" body="Parties are monitored automatically once you add them to a deal file." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="bg-paper text-[11.5px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Party</th>
                    <th className="px-3 py-2.5 font-medium">Deal</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Last screened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(({ party: p, reference, dealId }) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3">
                        <span className="font-medium">{p.fullName}</span>
                        <span className="block text-[11.5px] text-muted">
                          {ROLE_LABELS[p.role]} · {countryName(p.kind === "entity" ? p.jurisdiction : p.residenceCountry)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/app/deals/${dealId}`} className="font-mono text-[12px] text-sea underline">
                          {reference}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        {p.screeningStatus === "potential_match" ? (
                          <Badge tone="bad">Review</Badge>
                        ) : p.screeningStatus === "confirmed_match" ? (
                          <Badge tone="bad">Confirmed</Badge>
                        ) : p.screeningStatus === "pep_match" ? (
                          <Badge tone="warn">PEP</Badge>
                        ) : (
                          <Badge tone="ok">Clear</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted">{dateTime(p.lastScreenedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent alerts" />
          {recent.length === 0 ? (
            <p className="px-5 py-6 text-[13.5px] text-muted">No alerts yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="px-5 py-3 text-[13px]">
                  <p className="font-medium">{a.title}</p>
                  {a.body ? <p className="text-[12px] text-muted">{a.body}</p> : null}
                  <p className="mt-0.5 text-[11.5px] text-faint">{dateTime(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
