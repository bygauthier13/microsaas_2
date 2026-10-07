import { getDb } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { config } from "@/lib/config";

export type EmailMessage = { to: string; subject: string; html: string; text: string; orgId?: string | null };

/**
 * Sends transactional email through Resend when EMAIL_API_KEY is configured.
 * Otherwise (local dev, demo workspaces) the message is stored in the outbox table
 * and printed to the console so every flow stays testable.
 */
export async function sendEmail(msg: EmailMessage, opts: { forceOutbox?: boolean } = {}) {
  const db = await getDb();
  const useResend = !!config.email.apiKey && !opts.forceOutbox;
  if (!useResend) {
    console.info(`[email:outbox] to=${msg.to} subject="${msg.subject}"\n${msg.text}\n`);
    await db.insert(emails).values({ ...msg, orgId: msg.orgId ?? null, provider: "outbox", status: "logged" });
    return { ok: true as const, provider: "outbox" as const };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${config.email.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from: config.email.from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) throw new Error(body.message || `Resend responded ${res.status}`);
    await db.insert(emails).values({
      ...msg,
      orgId: msg.orgId ?? null,
      html: "[sent via Resend]",
      provider: "resend",
      providerId: body.id ?? null,
      status: "sent",
    });
    return { ok: true as const, provider: "resend" as const };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed", error);
    await db.insert(emails).values({ ...msg, orgId: msg.orgId ?? null, provider: "resend", status: "failed", error });
    return { ok: false as const, provider: "resend" as const, error };
  }
}
