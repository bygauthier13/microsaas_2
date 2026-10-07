import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ASSET_DETAIL_LABELS, getDealBundle, DomainError, type DealBundle } from "@/lib/deals/service";
import { DOC_CATEGORIES } from "@/lib/risk/engine";
import { ASSET_TYPES, type AssetType } from "@/lib/risk/thresholds";
import { countryName } from "@/lib/countries";
import { AUDIT_LABELS, audit } from "@/lib/audit";
import { track } from "@/lib/analytics";
import { clientIp } from "@/lib/request";
import { date, dateTime, money, OUR_ROLE_LABELS, PAYMENT_LABELS, ROLE_LABELS, TX_LABELS } from "@/lib/format";
import { PrintButton } from "@/components/app/print-button";

export const metadata: Metadata = { title: "AML file" };

export default async function AmlFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, org } = await requireUser();
  let b: DealBundle;
  try {
    b = await getDealBundle(org.id, id);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
  await audit(org.id, { type: "user", id: user.id, label: user.name }, "file.exported", {}, { dealId: id, ip: await clientIp() });
  await track("file_exported", {}, { orgId: org.id, userId: user.id, isDemo: org.isDemo });
  const { deal, parties, documents, screenings, risk, report } = b;
  const generated = new Date();
  const retainUntil = new Date((deal.decisionAt ?? generated).getTime() + 5 * 365 * 86_400_000);
  const nameOf = (pid: string | null) => parties.find((p) => p.id === pid)?.fullName ?? "—";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/app/deals/${deal.id}`} className="text-[13px] text-muted hover:text-ink">
          ← Back to deal
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-xl border border-line bg-white p-8 text-[13px] leading-relaxed print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b border-ink pb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brass">Customer due-diligence file · Confidential</p>
            <h1 className="mt-2 font-serif text-[32px] leading-tight">{deal.assetName}</h1>
            <p className="text-muted">
              {org.name} · {deal.reference}
            </p>
          </div>
          <div className="text-right text-[12px] text-muted">
            <p>Generated {dateTime(generated)}</p>
            <p>by {user.name}</p>
            <p className="mt-1">Retain until {date(retainUntil)} (AMLR Art. 77)</p>
          </div>
        </header>

        <Section n="1" title="Transaction">
          <KV
            rows={[
              ["Asset", `${ASSET_TYPES[deal.assetType as AssetType]?.label ?? deal.assetType} — ${deal.assetName}`],
              ["Details", Object.entries(deal.assetDetails ?? {}).map(([k, v]) => `${ASSET_DETAIL_LABELS[k] ?? k}: ${v}`).join(" · ") || "—"],
              ["Transaction", `${TX_LABELS[deal.transactionType]} · ${OUR_ROLE_LABELS[deal.ourRole] ?? deal.ourRole}`],
              ["Price", `${money(deal.priceAmount, deal.currency)}${deal.currency !== "EUR" && deal.priceEur ? ` (≈ ${money(deal.priceEur)} indicative)` : ""}`],
              ["Intended use", deal.useType === "non_commercial" ? "Non-commercial (private)" : deal.useType === "commercial" ? "Commercial" : "Unknown"],
              ["Payment", `${PAYMENT_LABELS[deal.paymentMethod]}${deal.thirdPartyPayer ? " · third-party payer" : ""} · funds from ${countryName(deal.fundsOriginCountry)}`],
              ["Expected / actual closing", date(deal.expectedClosing)],
              ["Status", deal.status],
            ]}
          />
        </Section>

        <Section n="2" title="Risk assessment">
          <KV
            rows={[
              ["Risk level", `${risk.level.toUpperCase()} — score ${risk.score}/100`],
              ["Due diligence applied", risk.ddLevel === "enhanced" ? "Enhanced due diligence (AMLR Art. 34)" : risk.ddLevel === "refuse" ? "Refuse — prohibition applies" : "Standard due diligence (AMLR Art. 20)"],
              ["Approval level", risk.approval === "senior_management" ? "Senior management" : "Compliance officer"],
              ["Article 74", `${risk.article74.applies ? "Report required" : "Not required"} — ${risk.article74.reason}`],
            ]}
          />
          <table className="mt-3 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-1.5 pr-2 font-medium">Factor</th>
                <th className="py-1.5 pr-2 font-medium">Detail</th>
                <th className="py-1.5 pr-2 font-medium">Reference</th>
                <th className="py-1.5 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {risk.factors.length ? (
                risk.factors.map((f) => (
                  <tr key={f.code} className="border-b border-line/60 align-top">
                    <td className="py-1.5 pr-2 font-medium">{f.label}</td>
                    <td className="py-1.5 pr-2">{f.detail ?? ""}</td>
                    <td className="py-1.5 pr-2 text-muted">{f.ref ?? ""}</td>
                    <td className="py-1.5 text-right font-mono">{f.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-2 text-muted">
                    No risk factors identified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {risk.blockers.length ? (
            <p className="mt-3 rounded border border-warn/30 bg-warn-soft px-3 py-2 text-[12px]">
              <strong>Open items at time of export:</strong> {risk.blockers.map((x) => x.label).join("; ")}
            </p>
          ) : null}
        </Section>

        <Section n="3" title="Parties and beneficial ownership">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-1.5 pr-2 font-medium">Name</th>
                <th className="py-1.5 pr-2 font-medium">Role</th>
                <th className="py-1.5 pr-2 font-medium">Identification</th>
                <th className="py-1.5 pr-2 font-medium">Country</th>
                <th className="py-1.5 font-medium">PEP / screening</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((p) => (
                <tr key={p.id} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-2 font-medium">
                    {p.fullName}
                    {p.parentPartyId ? <span className="block font-normal text-muted">owns/controls {nameOf(p.parentPartyId)}</span> : null}
                  </td>
                  <td className="py-1.5 pr-2">
                    {ROLE_LABELS[p.role]}
                    {p.ownershipPct != null ? ` · ${p.ownershipPct}%` : ""}
                    {p.controlType ? <span className="block text-muted">{p.controlType}</span> : null}
                  </td>
                  <td className="py-1.5 pr-2">
                    {p.kind === "person"
                      ? [p.dateOfBirth && `DOB ${p.dateOfBirth}`, p.idDocNumber && `${p.idDocType ?? "ID"} ${p.idDocNumber}`, p.idDocExpiry && `exp. ${p.idDocExpiry}`].filter(Boolean).join(" · ") || "—"
                      : [p.entityType, p.registrationNumber].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-1.5 pr-2">
                    {p.kind === "person" ? `${countryName(p.nationality)} nat. · res. ${countryName(p.residenceCountry)}` : countryName(p.jurisdiction)}
                  </td>
                  <td className="py-1.5">
                    {p.pepStatus !== "none" || p.screeningStatus === "pep_match" ? "PEP · " : ""}
                    {p.screeningStatus.replace("_", " ")}
                    {p.lastScreenedAt ? <span className="block text-muted">{dateTime(p.lastScreenedAt)}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {parties.some((p) => p.sourceOfFunds || p.sourceOfWealth) ? (
            <div className="mt-3 space-y-2">
              {parties
                .filter((p) => p.sourceOfFunds || p.sourceOfWealth)
                .map((p) => (
                  <div key={p.id} className="rounded border border-line px-3 py-2 text-[12px]">
                    <p className="font-medium">{p.fullName} — declared by the client</p>
                    {p.sourceOfFunds ? <p><span className="text-muted">Source of funds:</span> {p.sourceOfFunds}</p> : null}
                    {p.sourceOfWealth ? <p><span className="text-muted">Source of wealth:</span> {p.sourceOfWealth}</p> : null}
                  </div>
                ))}
            </div>
          ) : null}
        </Section>

        <Section n="4" title="Screening log (sanctions, PEP, watchlists)">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-1.5 pr-2 font-medium">When</th>
                <th className="py-1.5 pr-2 font-medium">Party</th>
                <th className="py-1.5 pr-2 font-medium">Lists</th>
                <th className="py-1.5 font-medium">Result &amp; resolution</th>
              </tr>
            </thead>
            <tbody>
              {screenings.map((s) => (
                <tr key={s.id} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-2 whitespace-nowrap">{dateTime(s.createdAt)}<span className="block text-muted">{s.runType}</span></td>
                  <td className="py-1.5 pr-2">{nameOf(s.partyId)}</td>
                  <td className="py-1.5 pr-2 text-muted">{s.datasets.join("; ")}</td>
                  <td className="py-1.5">
                    {s.status === "clear" && !s.matches.length ? "No match" : s.status === "error" ? `Error: ${s.error}` : `${s.matches.length} potential match(es): ${s.matches.map((m) => `${m.name} (${Math.round(m.score * 100)}%)`).join(", ")}`}
                    {s.resolution ? (
                      <span className="block text-muted">
                        {s.resolution === "false_positive" ? "Cleared as false positive" : "Confirmed match"}
                        {s.resolvedBy ? ` by ${s.resolvedBy}` : ""}
                        {s.resolvedAt ? `, ${dateTime(s.resolvedAt)}` : ""}: {s.resolutionNote}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section n="5" title="Documents (encrypted at rest, SHA-256 fingerprinted)">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-1.5 pr-2 font-medium">Category</th>
                <th className="py-1.5 pr-2 font-medium">Party</th>
                <th className="py-1.5 pr-2 font-medium">File</th>
                <th className="py-1.5 pr-2 font-medium">SHA-256</th>
                <th className="py-1.5 font-medium">Received / verified</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-line/60 align-top">
                  <td className="py-1.5 pr-2">{DOC_CATEGORIES[d.category] ?? d.category}</td>
                  <td className="py-1.5 pr-2">{d.partyId ? nameOf(d.partyId) : "Deal"}</td>
                  <td className="py-1.5 pr-2 break-all">{d.filename}</td>
                  <td className="py-1.5 pr-2 font-mono text-[10.5px]">{d.sha256.slice(0, 16)}…</td>
                  <td className="py-1.5">
                    {date(d.createdAt)}
                    {d.verifiedAt ? <span className="block text-muted">verified by {d.verifiedBy}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {risk.requiredDocs.some((d) => !d.satisfied) ? (
            <p className="mt-2 text-[12px] text-warn">
              Outstanding: {risk.requiredDocs.filter((d) => !d.satisfied).map((d) => `${d.label}${d.partyName ? ` (${d.partyName})` : ""}`).join("; ")}
            </p>
          ) : null}
        </Section>

        <Section n="6" title="Decision">
          {deal.decision ? (
            <KV
              rows={[
                ["Decision", deal.decision === "approved" ? "Approved" : "Rejected"],
                ["By", deal.decisionByName ?? "—"],
                ["When", dateTime(deal.decisionAt)],
                ["Grounds", deal.decisionNote ?? "—"],
              ]}
            />
          ) : (
            <p className="text-muted">No decision recorded at time of export.</p>
          )}
          {report ? (
            <p className="mt-3">
              Article 74 report: <strong className="capitalize">{report.status}</strong>
              {report.submissionRef ? ` · FIU reference ${report.submissionRef} · submitted ${date(report.submittedAt)}` : ""}
            </p>
          ) : null}
        </Section>

        <Section n="7" title="Audit trail" breakBefore>
          <ol className="space-y-1 text-[11.5px]">
            {[...b.audit].reverse().map((a) => (
              <li key={a.id} className="grid grid-cols-[150px_1fr] gap-3 border-b border-line/50 py-1">
                <span className="text-muted">{dateTime(a.createdAt)}</span>
                <span>
                  {AUDIT_LABELS[a.action] ?? a.action} — {a.actorLabel}
                  {a.ip ? <span className="text-muted"> · {a.ip}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <footer className="mt-8 border-t border-line pt-4 text-[11px] text-muted">
          Prepared with Ensign as decision support for {org.name}. The obliged entity remains responsible for its customer due diligence, risk assessment and reporting
          obligations. Regulatory references: Regulation (EU) 2024/1624 (AMLR) and applicable national law.
        </footer>
      </article>
    </div>
  );
}

function Section({ n, title, children, breakBefore }: { n: string; title: string; children: React.ReactNode; breakBefore?: boolean }) {
  return (
    <section className={`mt-7 ${breakBefore ? "print-break" : ""}`}>
      <h2 className="mb-2 flex items-baseline gap-2 border-b border-line pb-1.5 text-[14px] font-semibold">
        <span className="font-mono text-[11px] text-brass">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-1">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
