import crypto from "node:crypto";
import { config } from "@/lib/config";

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ── Password hashing (scrypt, memory-hard, built into Node) ─────────────────
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const actual = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p) }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Constant-time comparison for secrets of possibly different length. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ── Document encryption (AES-256-GCM) ───────────────────────────────────────
let warned = false;

/**
 * Real customer documents are only ever encrypted with ENCRYPTION_KEY. The insecure
 * development key is accepted solely for demo workspaces and local development.
 */
function encryptionKey(allowDevKey: boolean): Buffer {
  if (config.encryptionKey) {
    const key = Buffer.from(config.encryptionKey, "base64");
    if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32)");
    return key;
  }
  if (!allowDevKey || config.isVercelProduction) {
    throw new Error("Document storage is not configured: set ENCRYPTION_KEY (openssl rand -base64 32).");
  }
  if (!warned) {
    console.warn("[ensign] ENCRYPTION_KEY not set — using an insecure development key. Never use this in production.");
    warned = true;
  }
  return crypto.createHash("sha256").update("ensign-insecure-development-key").digest();
}

export function encrypt(plain: Buffer, opts: { allowDevKey: boolean }): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(opts.allowDevKey), iv);
  const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]);
}

export function decrypt(blob: Buffer, opts: { allowDevKey: boolean }): Buffer {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ct = blob.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(opts.allowDevKey), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}
