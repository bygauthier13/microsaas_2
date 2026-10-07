import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { DomainError, getDealBundle, type DealBundle } from "@/lib/deals/service";
import { buildReportPayload } from "@/lib/deals/report";
import { date } from "@/lib/format";
import { Notice } from "@/components/ui";
import { PrintButton } from "@/components/app/print-button";

export const metadata: Metadata = { title: "Article 74 report pack" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireUser();
  let b: DealBundle;
  try {
    b = await getDealBundle(org.id, id);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
  const payload = (b.report?.payload as ReturnType<typeof buildReportPayload> | null) ?? buildReportPayload(b);
  const isDraft = !b.report?.payload;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/app/deals/${b.deal.id}#report`} className="text-[13px] text-muted hover:text-ink">
          ← Back to deal
        </Link>
        <div className="flex gap-2">
          <a href={`/api/deals/${b.deal.id}/report`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-[13px] font-medium hover:bg-sand">
            <Download className="size-3.5" /> JSON
          </a>
          <PrintButton />
        </div>
      </div>
      {!b.risk.article74.applies ? (
        <Notice tone="sea" className="no-print mb-6">
          Article 74 does not apply to this deal: {b.risk.article74.reason}
        </Notice>
      ) : isDraft ? (
        <Notice tone="warn" className="no-print mb-6">
          Live preview — press “Prepare report” on the deal to freeze the data that you file.
        </Notice>
      ) : null}
      <article className="rounded-xl border border-line bg-white p-8 text-[13px] print:border-0 print:p-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-brass">Threshold-based report · Regulation (EU) 2024/1624, Article 74(1)</p>
        <h1 className="mt-2 font-serif text-[30px] leading-tight">{payload.goods.description}</h1>
        <p className="text-muted">
          {payload.transaction.reference} · generated {date(payload.generatedAt)} · recipient: {payload.recipientFiu.name}
        </p>
        <Block title="Reporting entity" data={payload.reportingEntity} />
        <Block title="Transaction" data={payload.transaction} />
        <Block title="Goods" data={payload.goods} />
        <Block title="Customer" data={payload.customer ?? {}} />
        {payload.beneficialOwners.length ? <List title="Beneficial owners" items={payload.beneficialOwners} /> : null}
        {payload.intermediateEntities.length ? <List title="Intermediate entities" items={payload.intermediateEntities} /> : null}
        {payload.payers.length ? <List title="Payers" items={payload.payers} /> : null}
        {payload.representatives.length ? <List title="Representatives" items={payload.representatives} /> : null}
        <Block title="Due diligence" data={payload.dueDiligence} />
        <p className="mt-8 border-t border-line pt-4 text-[11px] text-muted">
          FIUs set the submission channel and deadline (AMLR Art. 74(3)); many use goAML portals. Record the acknowledgement reference in Ensign once filed.
        </p>
      </article>
    </div>
  );
}

function humanKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function render(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString("en-GB");
  if (Array.isArray(v)) return v.map(render).join(", ");
  if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${humanKey(k)}: ${render(x)}`).join(" · ");
  return String(v);
}

function Block({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <section className="mt-6">
      <h2 className="border-b border-line pb-1 text-[14px] font-semibold">{title}</h2>
      <dl className="mt-2 grid grid-cols-[200px_1fr] gap-x-4 gap-y-1">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{humanKey(k)}</dt>
            <dd>{render(v)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function List({ title, items }: { title: string; items: Record<string, unknown>[] }) {
  return (
    <section className="mt-6">
      <h2 className="border-b border-line pb-1 text-[14px] font-semibold">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="rounded border border-line px-3 py-2">
            {render(it)}
          </li>
        ))}
      </ul>
    </section>
  );
}
