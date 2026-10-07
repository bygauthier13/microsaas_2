import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { documents, parties } from "@/lib/db/schema";
import { decrypt, encrypt, sha256Hex } from "@/lib/crypto";
import { config } from "@/lib/config";
import { audit, type Actor } from "@/lib/audit";
import { DOC_CATEGORIES } from "@/lib/risk/engine";
import { actorOf, DomainError, getDeal, recomputeRisk, type Ctx } from "./service";
import type { Organization } from "@/lib/db/schema";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const SIGNATURES: { mime: string; test: (b: Buffer) => boolean }[] = [
  { mime: "application/pdf", test: (b) => b.subarray(0, 5).toString("latin1") === "%PDF-" },
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  { mime: "image/heic", test: (b) => b.subarray(4, 12).toString("latin1").startsWith("ftyphei") || b.subarray(4, 12).toString("latin1").startsWith("ftypmif1") },
];

export const ACCEPTED_UPLOADS = ".pdf,.jpg,.jpeg,.png,.webp,.heic";

/** Detects the real file type from magic bytes — the browser-supplied type is not trusted. */
export function sniffMime(buf: Buffer): string | null {
  return SIGNATURES.find((s) => s.test(buf))?.mime ?? null;
}

export function safeFilename(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim();
  return (cleaned || "document").slice(0, 120);
}

/** Validates an upload before anything is written (size, real file type). */
export function validateUpload(file: { name: string; bytes: Buffer }): string {
  if (file.bytes.length === 0) throw new DomainError(`${file.name} is empty`);
  if (file.bytes.length > MAX_UPLOAD_BYTES) throw new DomainError(`${file.name} is larger than 10 MB`);
  const mime = sniffMime(file.bytes);
  if (!mime) throw new DomainError(`${file.name}: only PDF, JPEG, PNG, WEBP or HEIC files are accepted`);
  return mime;
}

function encryptForOrg(org: Organization, bytes: Buffer): Buffer {
  try {
    return encrypt(bytes, { allowDevKey: org.isDemo || config.devTools });
  } catch (err) {
    console.error("[documents] encryption unavailable", err);
    throw new DomainError("Secure document storage is not configured on this server yet. Please contact support.");
  }
}

/** Fails fast (before any write) when documents could not be stored. */
export function assertStorageReady(org: Organization) {
  encryptForOrg(org, Buffer.from("probe"));
}

export async function storeDocument(
  org: Organization,
  dealId: string,
  file: { name: string; bytes: Buffer },
  meta: { category: string; partyId?: string | null },
  actor: Actor,
  uploadedBy: string,
  opts: { recompute?: boolean; ip?: string | null } = {},
) {
  if (!DOC_CATEGORIES[meta.category]) throw new DomainError("Unknown document category");
  const mime = validateUpload(file);
  const db = await getDb();
  await getDeal(org.id, dealId);
  if (meta.partyId) {
    const [p] = await db.select({ id: parties.id }).from(parties).where(and(eq(parties.id, meta.partyId), eq(parties.dealId, dealId))).limit(1);
    if (!p) throw new DomainError("Linked party not found on this deal");
  }
  const [doc] = await db
    .insert(documents)
    .values({
      orgId: org.id,
      dealId,
      partyId: meta.partyId ?? null,
      category: meta.category,
      filename: safeFilename(file.name),
      mimeType: mime,
      sizeBytes: file.bytes.length,
      sha256: sha256Hex(file.bytes),
      content: encryptForOrg(org, file.bytes),
      uploadedBy,
    })
    .returning({ id: documents.id, filename: documents.filename });
  await audit(org.id, actor, "document.uploaded", { filename: doc.filename, category: meta.category }, { dealId, ip: opts.ip });
  if (opts.recompute !== false) await recomputeRisk(org, dealId, { silent: true });
  return doc;
}

export async function verifyDocument(ctx: Ctx, documentId: string) {
  const db = await getDb();
  const [doc] = await db
    .update(documents)
    .set({ verifiedBy: ctx.user.name, verifiedAt: new Date() })
    .where(and(eq(documents.id, documentId), eq(documents.orgId, ctx.org.id)))
    .returning({ id: documents.id, dealId: documents.dealId, filename: documents.filename });
  if (!doc) throw new DomainError("Document not found");
  await audit(ctx.org.id, actorOf(ctx), "document.verified", { filename: doc.filename }, { dealId: doc.dealId, ip: ctx.ip });
}

export async function readDocument(ctx: Ctx, documentId: string) {
  const db = await getDb();
  const [doc] = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.orgId, ctx.org.id))).limit(1);
  if (!doc) throw new DomainError("Document not found");
  const bytes = decrypt(doc.content, { allowDevKey: ctx.org.isDemo || config.devTools });
  await audit(ctx.org.id, actorOf(ctx), "document.downloaded", { filename: doc.filename }, { dealId: doc.dealId, ip: ctx.ip });
  return { doc, bytes };
}
