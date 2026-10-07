import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  Check,
  CircleAlert,
  CircleX,
  Download,
  FileDown,
  FileText,
  Printer,
  RefreshCw,
  ShieldAlert,
  User,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { canWrite } from "@/lib/billing/access";
import { DomainError, dealChecklist, getDealBundle, type DealBundle } from "@/lib/deals/service";
import { DOC_CATEGORIES } from "@/lib/risk/engine";
import { ASSET_TYPES, type AssetType } from "@/lib/risk/thresholds";
import { countryName } from "@/lib/countries";
import { AUDIT_LABELS } from "@/lib/audit";
import { bytes, date, dateTime, money, OUR_ROLE_LABELS, PAYMENT_LABELS, ROLE_LABELS, TX_LABELS } from "@/lib/format";
import {
  addPartyAction,
  completeDealAction,
  createKycAction,
  decideAction,
  prepareReportAction,
  removePartyAction,
  resolveScreeningAction,
  screenDealAction,
  submitReportAction,
  toggleMonitoringAction,
  updateDealAction,
  uploadDocumentAction,
  verifyDocumentAction,
} from "@/app/actions/app";
import { Badge, Card, CardHeader, cn, LinkButton, Notice, RiskBadge, StatusBadge } from "@/components/ui";
import { ActionButton } from "@/components/app/action-button";
import { PartyForm } from "@/components/app/deal/party-form";
import { KycLinkForm } from "@/components/app/deal/kyc-panel";
import { DocumentUpload } from "@/components/app/deal/document-upload";
import { ResolveForm } from "@/components/app/deal/resolve-form";
import { DecisionForm } from "@/components/app/deal/decision-form";
import { CompleteForm, SubmitReportForm } from "@/components/app/deal/report-forms";
import { DealForm } from "@/components/app/deal-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { org } = await requireUser();
  try {
    const b = await getDealBundle(org.id, id);
    return { title: b.deal.assetName };
  } catch {
    return { title: "Deal file" };
  }
}

type Party = DealBundle["parties"][number];

export default async function DealPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const { user, org } = await requireUser();
  let bundle: DealBundle;
  try {
    bundle = await getDealBundle(org.id, id);
  } catch (err) {
    if (err instanceof DomainError) notFound();
    throw err;
  }
  const { deal, parties, documents, screenings, kycRequests, report, audit, risk } = bundle;
  const writable = canWrite(org);
  const checklist = dealChecklist(bundle);
  const latestByParty = new Map<string, (typeof screenings)[number]>();
  for (const s of screenings) if (!latestByParty.has(s.partyId)) latestByParty.set(s.partyId, s);
  const openScreenings = parties
    .map((p) => ({ party: p, s: latestByParty.get(p.id) }))
    .filter((x) => x.party.screeningStatus === "potential_match" && x.s && x.s.matches.length && !x.s.resolution);
  const entities = parties.filter((p) => p.kind === "entity" && ["buyer", "intermediate"].includes(p.role)).map((p) => ({ id: p.id, name: p.fullName }));
  const nonBlockers = risk.blockers.filter((b) => !b.prohibited);
  const seniorRequired = risk.approval === "senior_management";
  const isSenior = ["owner", "admin"].includes(user.role);
  const canApprove = writable && risk.level !== "prohibited" && nonBlockers.length === 0 && (!seniorRequired || isSenior);
  const approveHint =
    risk.level === "prohibited"
      ? "A prohibition applies — this deal cannot be approved."
      : nonBlockers.length
        ? `Resolve ${nonBlockers.length} open item${nonBlockers.length > 1 ? "s" : ""} first.`
        : seniorRequired && !isSenior
          ? "Enhanced due diligence: an owner or admin must approve."
          : undefined;
  const missingDocs = risk.requiredDocs.filter((d) => !d.satisfied);
  const firstMissing = missingDocs[0];
  const asset = ASSET_TYPES[deal.assetType as AssetType];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/deals" className="text-[13px] text-muted hover:text-ink">
          ← Deal files
        </Link>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12.5px] text-muted">{deal.reference}</span>
              <StatusBadge status={deal.status} />
              <RiskBadge level={risk.level} dd={risk.ddLevel} />
            </div>
            <h1 className="display mt-2 text-[36px] sm:text-[42px]">{deal.assetName}</h1>
            <p className="mt-1 text-[14px] text-muted">
              {asset?.label} · {TX_LABELS[deal.transactionType]} · {money(deal.priceAmount, deal.currency)}
              {deal.currency !== "EUR" && deal.priceEur ? ` (≈ ${money(deal.priceEur)})` : ""} · {OUR_ROLE_LABELS[deal.ourRole] ?? deal.ourRole} ·{" "}
              {deal.useType === "non_commercial" ? "non-commercial use" : deal.useType === "commercial" ? "commercial use" : "use not yet known"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {writable && parties.length ? (
              <ActionButton action={screenDealAction.bind(null, deal.id)} variant="secondary" size="sm">
                <RefreshCw className="size-3.5" /> Re-screen all
              </ActionButton>
            ) : null}
            <LinkButton href={`/app/deals/${deal.id}/file`} variant="secondary" size="sm">
              <Printer className="size-3.5" /> AML file
            </LinkButton>
            {risk.article74.applies ? (
              <LinkButton href={`/app/deals/${deal.id}/report`} variant="secondary" size="sm">
                <FileDown className="size-3.5" /> Article 74 pack
              </LinkButton>
            ) : null}
          </div>
        </div>
      </div>

      {created ? (
        <Notice tone="ok" title="Deal file opened">
          Next: send the buyer&apos;s representative a secure KYC link (right), or add the parties yourself (below). Screening and scoring run automatically.
        </Notice>
      ) : null}
      {risk.level === "prohibited" ? (
        <Notice tone="bad" title="Do not proceed">
          {risk.blockers
            .filter((b) => b.prohibited)
            .map((b) => `${b.label}${b.detail ? ` — ${b.detail}` : ""}`)
            .join(" · ")}
        </Notice>
      ) : null}

      {/* Progress */}
      <Card>
        <ol className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6">
          {checklist.map((c, i) => (
            <li key={c.key} className={cn("flex gap-3 px-4 py-4", i > 0 && "xl:border-l xl:border-line")}>
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                  c.state === "done" && "border-ok/30 bg-ok-soft text-ok",
                  c.state === "todo" && "border-line-strong bg-white text-muted",
                  c.state === "blocked" && "border-bad/30 bg-bad-soft text-bad",
                  c.state === "na" && "border-line bg-sand text-faint",
                )}
              >
                {c.state === "done" ? <Check className="size-3.5" /> : c.state === "blocked" ? <CircleAlert className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-snug">{c.label}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-muted">{c.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="min-w-0 space-y-6">
          {/* Screening review */}
          {openScreenings.length ? (
            <Card tone="danger">
              <CardHeader title={<span className="flex items-center gap-2 text-bad"><ShieldAlert className="size-4" /> Potential matches to review</span>} description="Decide each one. Your rationale becomes part of the AML file." />
              <div className="divide-y divide-line">
                {openScreenings.map(({ party, s }) => (
                  <div key={party.id} className="px-5 py-4">
                    <p className="text-[14px] font-medium">
                      {party.fullName} <span className="font-normal text-muted">· {ROLE_LABELS[party.role]}</span>
                    </p>
                    <ul className="mt-2 space-y-2">
                      {s!.matches.map((m) => (
                        <li key={m.id} className="rounded-lg border border-line bg-paper px-3 py-2.5 text-[13px]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{m.name}</span>
                            <Badge tone={m.score >= 0.95 ? "bad" : "warn"}>{Math.round(m.score * 100)}% match</Badge>
                          </div>
                          <p className="mt-1 text-[12px] text-muted">
                            {m.datasets.join(" · ")}
                            {m.birthDate ? ` · born ${m.birthDate}` : ""}
                            {m.countries?.length ? ` · ${m.countries.map(countryName).join(", ")}` : ""}
                          </p>
                          {m.explanation ? <p className="mt-1 text-[12px] text-ink-2">{m.explanation}</p> : null}
                          {m.url ? (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[12px] text-sea underline">
                              Source record
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {writable ? <ResolveForm action={resolveScreeningAction.bind(null, deal.id)} screeningId={s!.id} /> : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Parties */}
          <Card>
            <CardHeader title="Parties & ownership chain" description="Everyone is screened on entry and re-screened daily while monitoring is on." />
            {parties.length === 0 ? (
              <p className="px-5 py-6 text-[14px] text-muted">No parties yet. Send the client KYC link, or add the buyer and beneficial owners manually.</p>
            ) : (
              <div className="divide-y divide-line">
                <OwnershipTree parties={parties} />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-[13px]">
                    <thead className="bg-paper text-[11.5px] uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-5 py-2.5 font-medium">Name</th>
                        <th className="px-3 py-2.5 font-medium">Role</th>
                        <th className="px-3 py-2.5 font-medium">Country</th>
                        <th className="px-3 py-2.5 font-medium">Screening</th>
                        <th className="px-3 py-2.5 font-medium">Monitoring</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {parties.map((p) => (
                        <tr key={p.id}>
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-2 font-medium">
                              {p.kind === "entity" ? <Building2 className="size-3.5 text-muted" /> : <User className="size-3.5 text-muted" />}
                              {p.fullName}
                            </span>
                            <span className="mt-0.5 block text-[11.5px] text-muted">
                              {p.kind === "person" ? [p.dateOfBirth && `b. ${p.dateOfBirth}`, p.nationality && `${countryName(p.nationality)} national`].filter(Boolean).join(" · ") : [p.entityType, p.registrationNumber].filter(Boolean).join(" · ")}
                              {p.pepStatus !== "none" || p.screeningStatus === "pep_match" ? <Badge tone="warn" className="ml-1.5">PEP</Badge> : null}
                              {p.source === "client_portal" ? <span className="ml-1.5">· via client portal</span> : null}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ink-2">
                            {ROLE_LABELS[p.role] ?? p.role}
                            {p.ownershipPct != null ? <span className="text-muted"> · {p.ownershipPct}%</span> : null}
                          </td>
                          <td className="px-3 py-3 text-ink-2">{countryName(p.kind === "entity" ? p.jurisdiction : p.residenceCountry)}</td>
                          <td className="px-3 py-3">
                            <ScreeningBadge status={p.screeningStatus} />
                          </td>
                          <td className="px-3 py-3">
                            {writable ? (
                              <ActionButton action={toggleMonitoringAction.bind(null, deal.id, p.id, !p.monitored)} variant="ghost" size="sm" className="h-7 px-2 text-[12px]">
                                {p.monitored ? "On" : "Off"}
                              </ActionButton>
                            ) : (
                              <span className="text-[12px] text-muted">{p.monitored ? "On" : "Off"}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {writable ? (
                              <ActionButton action={removePartyAction.bind(null, deal.id, p.id)} confirmText={`Remove ${p.fullName} from this file?`} variant="ghost" size="sm" className="h-7 px-2 text-[12px] text-muted">
                                Remove
                              </ActionButton>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {writable ? <PartyForm action={addPartyAction.bind(null, deal.id)} entities={entities} /> : null}
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader
              title="Evidence"
              description={`${risk.requiredDocs.length - missingDocs.length} of ${risk.requiredDocs.length} required documents · encrypted at rest`}
            />
            {risk.requiredDocs.length ? (
              <ul className="grid gap-x-6 gap-y-1.5 px-5 py-4 text-[13px] sm:grid-cols-2">
                {risk.requiredDocs.map((d) => (
                  <li key={d.key} className="flex items-start gap-2">
                    {d.satisfied ? <Check className="mt-0.5 size-3.5 shrink-0 text-ok" /> : <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn" />}
                    <span className={d.satisfied ? "text-muted" : ""}>
                      {d.label}
                      {d.partyName ? <span className="text-muted"> — {d.partyName}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {documents.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {documents.map((d) => (
                  <li key={d.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex min-w-0 items-start gap-2.5">
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium">{d.filename}</span>
                        <span className="block text-[11.5px] text-muted">
                          {DOC_CATEGORIES[d.category] ?? d.category}
                          {d.partyId ? ` · ${parties.find((p) => p.id === d.partyId)?.fullName ?? ""}` : ""} · {bytes(d.sizeBytes)} · {d.uploadedBy.startsWith("client") ? "from client" : d.uploadedBy === "demo" ? "specimen" : "uploaded"} {date(d.createdAt)}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {d.verifiedAt ? (
                        <Badge tone="ok">
                          <BadgeCheck className="size-3" /> Verified by {d.verifiedBy}
                        </Badge>
                      ) : writable ? (
                        <ActionButton action={verifyDocumentAction.bind(null, deal.id, d.id)} variant="secondary" size="sm" className="h-7 text-[12px]">
                          Mark verified
                        </ActionButton>
                      ) : null}
                      <a href={`/api/documents/${d.id}`} className="inline-flex h-7 items-center gap-1 rounded-lg border border-line-strong bg-white px-2.5 text-[12px] font-medium hover:bg-sand">
                        <Download className="size-3.5" /> Open
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {writable ? (
              <DocumentUpload
                action={uploadDocumentAction.bind(null, deal.id)}
                categories={DOC_CATEGORIES}
                partiesList={parties.map((p) => ({ id: p.id, name: p.fullName }))}
                suggested={firstMissing ? { category: firstMissing.category, partyId: firstMissing.partyId } : undefined}
              />
            ) : null}
          </Card>

          {/* Audit trail */}
          <Card>
            <CardHeader title="Audit trail" description="Every action, with who, when and from where. Part of the exported file." />
            <ol className="max-h-[420px] divide-y divide-line overflow-y-auto">
              {audit.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-2.5 text-[12.5px]">
                  <span className="w-36 shrink-0 text-muted">{dateTime(a.createdAt)}</span>
                  <span className="min-w-0">
                    <span className="font-medium">{AUDIT_LABELS[a.action] ?? a.action}</span>
                    <span className="text-muted"> · {a.actorLabel}</span>
                    {auditDetail(a.details) ? <span className="block truncate text-muted">{auditDetail(a.details)}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {/* Risk */}
          <Card>
            <CardHeader title="Risk assessment" description="Transparent, rule-based, with legal references." />
            <div className="px-5 py-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-serif text-[48px] leading-none num">{risk.score}</p>
                  <p className="text-[12px] text-muted">score / 100</p>
                </div>
                <div className="text-right">
                  <RiskBadge level={risk.level} />
                  <p className="mt-1 text-[12.5px] text-ink-2">
                    {risk.ddLevel === "refuse" ? "Refuse / do not proceed" : risk.ddLevel === "enhanced" ? "Enhanced due diligence" : "Standard due diligence"}
                  </p>
                  <p className="text-[12px] text-muted">{seniorRequired ? "Senior-management approval" : "Compliance-officer sign-off"}</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sand">
                <div className={cn("h-full rounded-full", risk.level === "low" ? "bg-ok" : risk.level === "medium" ? "bg-warn" : "bg-bad")} style={{ width: `${Math.max(4, risk.score)}%` }} />
              </div>
            </div>
            {risk.factors.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {risk.factors.map((f) => (
                  <li key={f.code} className="px-5 py-3 text-[13px]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{f.label}</span>
                      <span className="shrink-0 font-mono text-[12px] text-muted">+{f.points}</span>
                    </div>
                    {f.detail ? <p className="mt-0.5 text-[12px] text-ink-2">{f.detail}</p> : null}
                    {f.ref ? <p className="mt-0.5 text-[11.5px] text-brass">{f.ref}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-line px-5 py-3 text-[13px] text-muted">No risk factors identified yet.</p>
            )}
            {nonBlockers.length ? (
              <div className="border-t border-line bg-warn-soft/50 px-5 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-warn">Open items before approval</p>
                <ul className="mt-1.5 space-y-1 text-[12.5px] text-ink-2">
                  {nonBlockers.map((b) => (
                    <li key={b.code}>• {b.label}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          {/* KYC link */}
          <Card>
            <CardHeader title="Client KYC" description="One secure link for the buyer's representative." />
            {kycRequests.length ? (
              <ul className="divide-y divide-line border-b border-line">
                {kycRequests.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[13px]">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{k.recipientName}</span>
                      <span className="block text-[11.5px] text-muted">
                        Sent {date(k.createdAt)} · {k.status === "submitted" ? `submitted ${date(k.submittedAt)}` : k.status === "opened" ? `opened ${date(k.openedAt)}` : k.status === "revoked" ? "revoked" : `expires ${date(k.expiresAt)}`}
                      </span>
                    </span>
                    <Badge tone={k.status === "submitted" ? "ok" : k.status === "revoked" ? "neutral" : "sea"}>{k.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            {writable ? (
              <KycLinkForm
                action={createKycAction.bind(null, deal.id)}
                defaultMessage={`Please complete the customer due-diligence file for ${deal.assetName}. It takes about 15 minutes; have the ownership documents and a source-of-funds letter at hand.`}
              />
            ) : null}
          </Card>

          {/* Decision */}
          <Card>
            <CardHeader title={seniorRequired ? "Senior-management approval" : "Compliance sign-off"} description={seniorRequired ? `Required because: ${risk.eddTriggers.join(", ") || "high risk score"}.` : "Record the decision and its grounds."} />
            <div className="px-5 py-4">
              {deal.decision ? (
                <div className="space-y-2 text-[13px]">
                  <p className="flex items-center gap-2 font-medium">
                    {deal.decision === "approved" ? <BadgeCheck className="size-4 text-ok" /> : <CircleX className="size-4 text-bad" />}
                    {deal.decision === "approved" ? "Approved" : "Rejected"} by {deal.decisionByName}
                  </p>
                  <p className="text-muted">{dateTime(deal.decisionAt)}</p>
                  <p className="rounded-lg bg-paper px-3 py-2 text-ink-2">{deal.decisionNote}</p>
                  {deal.decision === "approved" && deal.status !== "completed" && writable ? (
                    <div className="pt-2">
                      <CompleteForm action={completeDealAction.bind(null, deal.id)} />
                    </div>
                  ) : null}
                </div>
              ) : writable ? (
                <DecisionForm action={decideAction.bind(null, deal.id)} canApprove={canApprove} approveHint={approveHint} />
              ) : (
                <p className="text-[13px] text-muted">Pending.</p>
              )}
            </div>
          </Card>

          {/* Article 74 */}
          <Card id="report">
            <CardHeader title="Article 74 threshold report" description={risk.article74.applies ? "Report the sale to the FIU — with or without suspicion." : "Not required for this deal."} />
            <div className="space-y-3 px-5 py-4 text-[13px]">
              <p className="text-ink-2">{risk.article74.reason}</p>
              {risk.article74.applies && report ? (
                <>
                  <dl className="grid grid-cols-2 gap-2 rounded-lg bg-paper px-3 py-2.5 text-[12.5px]">
                    <dt className="text-muted">Status</dt>
                    <dd className="font-medium capitalize">{report.status}</dd>
                    <dt className="text-muted">FIU</dt>
                    <dd>{report.fiu ?? "Set your country in Settings"}</dd>
                    <dt className="text-muted">Due</dt>
                    <dd>{report.dueDate ? date(report.dueDate) : "On completion of the sale"}</dd>
                    {report.submissionRef ? (
                      <>
                        <dt className="text-muted">Reference</dt>
                        <dd className="font-mono">{report.submissionRef}</dd>
                      </>
                    ) : null}
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    {writable && report.status !== "submitted" ? (
                      <ActionButton action={prepareReportAction.bind(null, deal.id)} variant="secondary" size="sm">
                        {report.status === "prepared" ? "Refresh report data" : "Prepare report"}
                      </ActionButton>
                    ) : null}
                    <LinkButton href={`/app/deals/${deal.id}/report`} variant="secondary" size="sm">
                      View pack
                    </LinkButton>
                  </div>
                  {writable && report.status !== "submitted" && deal.status === "completed" ? <SubmitReportForm action={submitReportAction.bind(null, deal.id)} /> : null}
                </>
              ) : null}
            </div>
          </Card>

          {/* Edit deal */}
          {writable ? (
            <details className="group rounded-xl border border-line bg-white">
              <summary className="cursor-pointer list-none px-5 py-4 text-[14px] font-semibold">
                Deal details &amp; red flags <span className="float-right text-muted group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-line px-5 py-5">
                <p className="mb-4 text-[12.5px] text-muted">
                  Payment: {PAYMENT_LABELS[deal.paymentMethod]} · Funds from {countryName(deal.fundsOriginCountry)} · Closing {date(deal.expectedClosing)}
                </p>
                <DealForm
                  action={updateDealAction.bind(null, deal.id)}
                  submitLabel="Save & re-score"
                  compact
                  defaults={{
                    assetType: deal.assetType,
                    assetName: deal.assetName,
                    assetDetails: deal.assetDetails as Record<string, string | undefined>,
                    transactionType: deal.transactionType,
                    ourRole: deal.ourRole,
                    useType: deal.useType,
                    priceAmount: deal.priceAmount,
                    currency: deal.currency,
                    paymentMethod: deal.paymentMethod,
                    thirdPartyPayer: deal.thirdPartyPayer,
                    fundsOriginCountry: deal.fundsOriginCountry,
                    expectedClosing: deal.expectedClosing,
                    flags: deal.flags ?? {},
                  }}
                />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScreeningBadge({ status }: { status: string }) {
  switch (status) {
    case "clear":
      return <Badge tone="ok">No match</Badge>;
    case "cleared":
      return <Badge tone="ok">Cleared</Badge>;
    case "potential_match":
      return <Badge tone="bad">Review</Badge>;
    case "confirmed_match":
      return <Badge tone="bad">Confirmed match</Badge>;
    case "pep_match":
      return <Badge tone="warn">PEP confirmed</Badge>;
    case "error":
      return <Badge tone="warn">Error — retry</Badge>;
    default:
      return <Badge>Not screened</Badge>;
  }
}

function OwnershipTree({ parties }: { parties: Party[] }) {
  const roots = parties.filter((p) => p.role === "buyer");
  if (!roots.length) return null;
  const children = (id: string) => parties.filter((p) => p.parentPartyId === id);
  const orphanUbos = parties.filter((p) => p.role === "beneficial_owner" && !p.parentPartyId);
  const node = (p: Party, depth: number): React.ReactNode => (
    <div key={p.id} style={{ marginLeft: depth ? 14 : 0 }} className={depth ? "border-l border-dashed border-line-strong pl-3" : ""}>
      <p className="flex flex-wrap items-center gap-x-2 py-1 text-[13px]">
        {p.kind === "entity" ? <Building2 className="size-3.5 text-muted" /> : <User className="size-3.5 text-muted" />}
        <span className="font-medium">{p.fullName}</span>
        <span className="text-[12px] text-muted">
          {countryName(p.kind === "entity" ? p.jurisdiction : p.residenceCountry)}
          {p.ownershipPct != null ? ` · ${p.ownershipPct}%` : ""}
          {p.entityType && p.kind === "entity" ? ` · ${p.entityType}` : ""}
        </span>
      </p>
      {children(p.id).map((c) => node(c, depth + 1))}
      {depth === 0 && p.kind === "entity" ? orphanUbos.map((u) => node(u, 1)) : null}
    </div>
  );
  return (
    <div className="bg-paper/50 px-5 py-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Ownership chain</p>
      {roots.map((r) => node(r, 0))}
    </div>
  );
}

function auditDetail(details: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of ["name", "filename", "recipient", "result", "resolution", "level", "reference", "note"]) {
    const v = details[key];
    if (typeof v === "string" || typeof v === "number") parts.push(String(v));
  }
  return parts.join(" · ").slice(0, 160);
}
