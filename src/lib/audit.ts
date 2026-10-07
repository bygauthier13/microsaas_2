import { getDb } from "@/lib/db";
import { auditEvents } from "@/lib/db/schema";

export type Actor = { type: "user" | "client" | "system"; id?: string | null; label: string };

export async function audit(
  orgId: string,
  actor: Actor,
  action: string,
  details: Record<string, unknown> = {},
  opts: { dealId?: string | null; ip?: string | null } = {},
) {
  const db = await getDb();
  await db.insert(auditEvents).values({
    orgId,
    dealId: opts.dealId ?? null,
    actorType: actor.type,
    actorId: actor.id ?? null,
    actorLabel: actor.label,
    action,
    details,
    ip: opts.ip ?? null,
  });
}

export const AUDIT_LABELS: Record<string, string> = {
  "deal.created": "Deal file opened",
  "deal.updated": "Deal details updated",
  "party.added": "Party added",
  "party.removed": "Party removed",
  "party.monitoring": "Monitoring changed",
  "screening.run": "Screening run",
  "screening.resolved": "Screening match resolved",
  "kyc.requested": "Client KYC link created",
  "kyc.opened": "Client opened KYC link",
  "kyc.submitted": "Client submitted KYC",
  "kyc.revoked": "Client KYC link revoked",
  "document.uploaded": "Document uploaded",
  "document.verified": "Document verified",
  "document.downloaded": "Document downloaded",
  "risk.computed": "Risk assessed",
  "deal.approved": "Deal approved",
  "deal.rejected": "Deal rejected",
  "deal.completed": "Deal marked completed",
  "report.prepared": "Article 74 report prepared",
  "report.submitted": "Article 74 report submitted",
  "file.exported": "AML file exported",
};
