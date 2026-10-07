import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { alerts, deals, organizations, parties, screenings, type Organization, type Party, type ScreeningMatch } from "@/lib/db/schema";
import { audit, type Actor } from "@/lib/audit";
import { isSanctionsTopic, screen } from "@/lib/screening";
import { sendEmail } from "@/lib/email";
import { monitoringAlertEmail } from "@/lib/email/templates";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";
import { actorOf, DomainError, getDeal, recomputeRisk, type Ctx } from "./service";

export type PartyInput = {
  role: string;
  kind: "person" | "entity";
  fullName: string;
  parentPartyId?: string | null;
  ownershipPct?: number | null;
  controlType?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  residenceCountry?: string | null;
  address?: string | null;
  idDocType?: string | null;
  idDocNumber?: string | null;
  idDocExpiry?: string | null;
  registrationNumber?: string | null;
  jurisdiction?: string | null;
  entityType?: string | null;
  pepStatus?: string;
  pepDetails?: string | null;
  sourceOfFunds?: string | null;
  sourceOfWealth?: string | null;
  email?: string | null;
};

export async function addParty(
  org: Organization,
  dealId: string,
  input: PartyInput,
  actor: Actor,
  opts: { source?: string; screenNow?: boolean; recompute?: boolean; ip?: string | null } = {},
): Promise<Party> {
  const db = await getDb();
  await getDeal(org.id, dealId);
  if (input.parentPartyId) {
    const [parent] = await db.select({ id: parties.id }).from(parties).where(and(eq(parties.id, input.parentPartyId), eq(parties.dealId, dealId))).limit(1);
    if (!parent) throw new DomainError("Parent entity not found on this deal");
  }
  const [party] = await db
    .insert(parties)
    .values({ ...input, pepStatus: input.pepStatus ?? "none", orgId: org.id, dealId, source: opts.source ?? "broker" })
    .returning();
  await audit(org.id, actor, "party.added", { name: party.fullName, role: party.role }, { dealId, ip: opts.ip });
  if (opts.screenNow !== false) await screenParty(org, party, "initial", actor);
  if (opts.recompute !== false) await recomputeRisk(org, dealId);
  return party;
}

export async function removeParty(ctx: Ctx, partyId: string) {
  const db = await getDb();
  const [party] = await db.select().from(parties).where(and(eq(parties.id, partyId), eq(parties.orgId, ctx.org.id))).limit(1);
  if (!party) throw new DomainError("Party not found");
  // Children (UBOs of a removed entity) lose their parent link rather than disappearing silently.
  await db.update(parties).set({ parentPartyId: null }).where(eq(parties.parentPartyId, party.id));
  await db.delete(parties).where(eq(parties.id, party.id));
  await audit(ctx.org.id, actorOf(ctx), "party.removed", { name: party.fullName, role: party.role }, { dealId: party.dealId, ip: ctx.ip });
  await recomputeRisk(ctx.org, party.dealId);
}

export async function setMonitoring(ctx: Ctx, partyId: string, monitored: boolean) {
  const db = await getDb();
  const [party] = await db
    .update(parties)
    .set({ monitored })
    .where(and(eq(parties.id, partyId), eq(parties.orgId, ctx.org.id)))
    .returning();
  if (!party) throw new DomainError("Party not found");
  await audit(ctx.org.id, actorOf(ctx), "party.monitoring", { name: party.fullName, monitored }, { dealId: party.dealId, ip: ctx.ip });
}

/**
 * Screens one party and records the evidence — including "no match" results, which are
 * what a supervisor asks for. During monitoring, matches that were already cleared as
 * false positives are not re-raised; genuinely new matches create an alert and an email.
 */
export async function screenParty(org: Organization, party: Party, runType: "initial" | "manual" | "monitoring", actor: Actor) {
  const db = await getDb();
  const outcome = await screen(
    {
      name: party.fullName,
      kind: party.kind === "entity" ? "entity" : "person",
      birthDate: party.dateOfBirth,
      nationality: party.nationality,
      country: party.kind === "entity" ? party.jurisdiction : party.residenceCountry,
    },
    { isDemoOrg: org.isDemo },
  );

  const previous = await db.select().from(screenings).where(eq(screenings.partyId, party.id)).orderBy(desc(screenings.createdAt));
  const clearedIds = new Set(previous.filter((s) => s.resolution === "false_positive").flatMap((s) => s.matches.map((m) => m.id)));
  const knownIds = new Set(previous.flatMap((s) => s.matches.map((m) => m.id)));
  const fresh: ScreeningMatch[] = outcome.matches.filter((m) => !clearedIds.has(m.id));

  const status = outcome.status === "error" ? "error" : fresh.length ? "potential_match" : "clear";
  await db.insert(screenings).values({
    orgId: org.id,
    dealId: party.dealId,
    partyId: party.id,
    provider: outcome.provider,
    runType,
    query: { name: party.fullName, kind: party.kind, birthDate: party.dateOfBirth, nationality: party.nationality },
    datasets: outcome.datasets,
    matches: outcome.matches,
    status,
    error: outcome.error ?? null,
    // Matches previously cleared are carried forward as resolved.
    resolution: outcome.matches.length && !fresh.length ? "false_positive" : null,
    resolutionNote: outcome.matches.length && !fresh.length ? "Previously cleared — same match ids" : null,
  });

  let partyStatus = party.screeningStatus;
  if (status === "potential_match") partyStatus = "potential_match";
  else if (status === "clear") {
    partyStatus = ["confirmed_match", "pep_match"].includes(party.screeningStatus)
      ? party.screeningStatus
      : outcome.matches.length
        ? "cleared"
        : "clear";
  }
  await db.update(parties).set({ screeningStatus: partyStatus, lastScreenedAt: new Date() }).where(eq(parties.id, party.id));
  await audit(org.id, actor, "screening.run", { name: party.fullName, provider: outcome.provider, result: status, matches: outcome.matches.length, runType }, { dealId: party.dealId });

  const newMatches = fresh.filter((m) => !knownIds.has(m.id));
  if (runType === "monitoring" && newMatches.length) {
    const [deal] = await db.select().from(deals).where(eq(deals.id, party.dealId)).limit(1);
    await db.insert(alerts).values({
      orgId: org.id,
      dealId: party.dealId,
      partyId: party.id,
      type: "monitoring_match",
      severity: "critical",
      title: `New potential match: ${party.fullName}`,
      body: `${newMatches[0].name} (${newMatches[0].datasets.join(", ")}) · deal ${deal?.reference ?? ""}`,
    });
    const to = org.complianceOfficerEmail;
    if (to) {
      const tpl = monitoringAlertEmail({ orgName: org.name, partyName: party.fullName, reference: deal?.reference ?? "", link: `${config.appUrl}/app/deals/${party.dealId}` });
      await sendEmail({ ...tpl, to, orgId: org.id }, { forceOutbox: org.isDemo });
    }
  }
  return { status, matches: outcome.matches, error: outcome.error };
}

export async function screenDeal(ctx: Ctx, dealId: string) {
  const db = await getDb();
  await getDeal(ctx.org.id, dealId);
  const rows = await db.select().from(parties).where(and(eq(parties.dealId, dealId), eq(parties.orgId, ctx.org.id)));
  if (!rows.length) throw new DomainError("Add at least one party before screening.");
  for (const p of rows) await screenParty(ctx.org, p, "manual", actorOf(ctx));
  await recomputeRisk(ctx.org, dealId);
  await track("screening_run", { parties: rows.length }, { orgId: ctx.org.id, userId: ctx.user.id, isDemo: ctx.org.isDemo });
}

export async function resolveScreening(ctx: Ctx, screeningId: string, resolution: "false_positive" | "true_match", note: string) {
  const db = await getDb();
  if (note.trim().length < 10) throw new DomainError("Explain your conclusion (at least 10 characters) — it becomes part of the audit file.");
  const [row] = await db.select().from(screenings).where(and(eq(screenings.id, screeningId), eq(screenings.orgId, ctx.org.id))).limit(1);
  if (!row) throw new DomainError("Screening result not found");
  await db
    .update(screenings)
    .set({ resolution, resolutionNote: note.trim(), resolvedBy: `${ctx.user.name}`, resolvedAt: new Date() })
    .where(eq(screenings.id, row.id));
  let partyStatus = "cleared";
  if (resolution === "true_match") {
    const topics = row.matches.flatMap((m) => m.topics);
    partyStatus = isSanctionsTopic(topics) ? "confirmed_match" : "pep_match";
  }
  const update: Partial<Party> = { screeningStatus: partyStatus };
  if (partyStatus === "pep_match") update.pepStatus = "confirmed";
  await db.update(parties).set(update).where(eq(parties.id, row.partyId));
  await audit(ctx.org.id, actorOf(ctx), "screening.resolved", { resolution, note: note.trim(), party: row.query.name }, { dealId: row.dealId, ip: ctx.ip });
  await recomputeRisk(ctx.org, row.dealId);
}

/** Daily ongoing monitoring across all paying/trialing (non-demo) organisations. */
export async function runMonitoring(now = new Date()) {
  const db = await getDb();
  const rows = await db
    .select({ party: parties, org: organizations })
    .from(parties)
    .innerJoin(organizations, eq(parties.orgId, organizations.id))
    .where(and(eq(parties.monitored, true), eq(organizations.isDemo, false)));
  let screened = 0;
  let alertsRaised = 0;
  const touched = new Map<string, Organization>();
  for (const { party, org } of rows) {
    const active = org.subscriptionStatus === "active" || org.subscriptionStatus === "past_due" || (org.subscriptionStatus === "trialing" && org.trialEndsAt && org.trialEndsAt > now);
    if (!active) continue;
    if (party.lastScreenedAt && now.getTime() - party.lastScreenedAt.getTime() < 20 * 3_600_000) continue;
    const before = party.screeningStatus;
    const res = await screenParty(org, party, "monitoring", { type: "system", label: "Ongoing monitoring" });
    screened++;
    if (res.status === "potential_match" && before !== "potential_match") alertsRaised++;
    touched.set(`${org.id}:${party.dealId}`, org);
  }
  for (const [key, org] of touched) await recomputeRisk(org, key.split(":")[1], { silent: true });
  return { screened, alertsRaised };
}

/** On-demand re-screen of every monitored party in one organisation. */
export async function runOrgMonitoring(ctx: Ctx) {
  const db = await getDb();
  const rows = await db.select().from(parties).where(and(eq(parties.orgId, ctx.org.id), eq(parties.monitored, true)));
  const dealIds = new Set<string>();
  let matches = 0;
  for (const p of rows) {
    const res = await screenParty(ctx.org, p, "monitoring", { type: "system", label: `Monitoring run by ${ctx.user.name}` });
    if (res.status === "potential_match") matches++;
    dealIds.add(p.dealId);
  }
  for (const id of dealIds) await recomputeRisk(ctx.org, id, { silent: true });
  return { screened: rows.length, matches };
}
