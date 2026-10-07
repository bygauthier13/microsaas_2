import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { dateTime } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Email outbox" };

export default async function OutboxPage() {
  const { org } = await requireUser();
  const db = await getDb();
  const rows = await db.select().from(emails).where(eq(emails.orgId, org.id)).orderBy(desc(emails.createdAt)).limit(50);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-[40px]">Email outbox</h1>
        <p className="mt-1 text-[14px] text-muted">Every email your workspace generated — client KYC invitations, notifications, alerts.</p>
      </div>
      <Notice tone="sea">{org.isDemo ? "Demo workspaces never send real email; messages are kept here instead." : "No email provider is configured, so messages are kept here and printed to the server console."}</Notice>
      <Card>
        <CardHeader title={`${rows.length} message${rows.length === 1 ? "" : "s"}`} />
        {rows.length === 0 ? (
          <EmptyState title="Nothing sent yet" body="Create a client KYC link with “Email the link now” to see an invitation here." />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((m) => (
              <li key={m.id}>
                <details className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium">{m.subject}</span>
                      <span className="block text-[12px] text-muted">to {m.to}</span>
                    </span>
                    <span className="flex items-center gap-2 text-[12px] text-muted">
                      <Badge tone={m.status === "failed" ? "bad" : "neutral"}>{m.provider}</Badge>
                      {dateTime(m.createdAt)}
                    </span>
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-paper p-4 font-sans text-[13px] leading-relaxed text-ink-2">{m.text}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
