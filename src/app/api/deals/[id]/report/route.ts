import { getCurrentUser } from "@/lib/auth/session";
import { DomainError, getDealBundle } from "@/lib/deals/service";
import { buildReportPayload } from "@/lib/deals/report";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  try {
    const b = await getDealBundle(current.org.id, id);
    const payload = b.report?.payload ?? buildReportPayload(b);
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${b.deal.reference}-article74.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return new Response("Not found", { status: 404 });
    throw err;
  }
}
