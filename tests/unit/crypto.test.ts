import { describe, expect, it } from "vitest";
import { decrypt, encrypt, hashPassword, sha256Hex, verifyPassword } from "@/lib/crypto";

describe("crypto", () => {
  it("round-trips documents with AES-256-GCM and detects tampering", () => {
    const plain = Buffer.from("%PDF-1.4 specimen");
    const blob = encrypt(plain, { allowDevKey: true });
    expect(blob.equals(plain)).toBe(false);
    expect(decrypt(blob, { allowDevKey: true }).toString()).toBe("%PDF-1.4 specimen");
    blob[blob.length - 1] ^= 0xff;
    expect(() => decrypt(blob, { allowDevKey: true })).toThrow();
  });

  it("refuses to encrypt customer documents without ENCRYPTION_KEY", () => {
    expect(() => encrypt(Buffer.from("x"), { allowDevKey: false })).toThrow(/ENCRYPTION_KEY/);
  });

  it("hashes and verifies passwords with scrypt", async () => {
    const hash = await hashPassword("Correct-Horse-42!");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Correct-Horse-42!", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
    expect(sha256Hex("abc")).toHaveLength(64);
  });
});
