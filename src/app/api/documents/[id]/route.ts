import { getCurrentUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/deals/service";
import { readDocument } from "@/lib/deals/documents";
import { clientIp } from "@/lib/request";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const { doc, bytes } = await readDocument({ ...current, ip: await clientIp() }, id);
    const inline = doc.mimeType === "application/pdf" || doc.mimeType.startsWith("image/");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": doc.mimeType,
        "content-length": String(bytes.length),
        "content-disposition": `${inline ? "inline" : "attachment"}; filename="${doc.filename.replace(/"/g, "")}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return new Response("Not found", { status: 404 });
    throw err;
  }
}
