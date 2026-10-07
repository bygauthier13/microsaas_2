import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, FolderLock } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listDeals } from "@/lib/deals/service";
import { ASSET_TYPES, type AssetType } from "@/lib/risk/thresholds";
import { Badge, Card, EmptyState, LinkButton, RiskBadge, StatusBadge } from "@/components/ui";
import { date, money, TX_LABELS } from "@/lib/format";

export const metadata: Metadata = { title: "Deal files" };

export default async function DealsPage() {
  const { org } = await requireUser();
  const rows = await listDeals(org.id);
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="display text-[40px]">Deal files</h1>
          <p className="mt-1 text-[14px] text-muted">One AML file per sale, charter or new build. Kept for five years.</p>
        </div>
        <LinkButton href="/app/deals/new">
          <FilePlus2 className="size-4" /> New deal file
        </LinkButton>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={<FolderLock className="size-5" />} title="No deal files yet" body="Open a file for your current deal — it takes two minutes." action={<LinkButton href="/app/deals/new">Open a deal file</LinkButton>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13.5px]">
              <thead className="border-b border-line bg-paper text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Deal</th>
                  <th className="px-5 py-3 font-medium">Value</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((d) => (
                  <tr key={d.id} className="hover:bg-paper">
                    <td className="px-5 py-3.5">
                      <Link href={`/app/deals/${d.id}`} className="block">
                        <span className="font-medium text-ink">{d.assetName}</span>
                        <span className="mt-0.5 block text-[12px] text-muted">
                          <span className="font-mono">{d.reference}</span> · {ASSET_TYPES[d.assetType as AssetType]?.short} · {TX_LABELS[d.transactionType]}
                          {d.openMatches ? (
                            <Badge tone="bad" className="ml-2">
                              {d.openMatches} to review
                            </Badge>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 num">{money(d.priceAmount, d.currency)}</td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={d.riskLevel} dd={d.ddLevel} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted">{date(d.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
