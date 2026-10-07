import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dev outbox", robots: { index: false } };

/** Local development only: shows emails captured by the outbox (e.g. password-reset links). */
export default async function DevOutbox() {
  if (!config.devTools || config.email.apiKey) notFound();
  const db = await getDb();
  const rows = await db.select().from(emails).orderBy(desc(emails.createdAt)).limit(30);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 font-sans">
      <h1 className="text-[22px] font-semibold">Dev outbox</h1>
      <p className="text-[13px] text-muted">Disabled in production unless ENABLE_DEV_TOOLS=true. Never enable it on a public deployment.</p>
      <ul className="mt-6 space-y-4">
        {rows.map((m) => (
          <li key={m.id} className="rounded-lg border border-line bg-white p-4" data-testid="dev-email">
            <p className="text-[12px] text-muted">
              {m.createdAt.toISOString()} · to <span data-testid="dev-email-to">{m.to}</span>
            </p>
            <p className="font-medium">{m.subject}</p>
            <pre className="mt-2 whitespace-pre-wrap text-[13px]" data-testid="dev-email-text">{m.text}</pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
