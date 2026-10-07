"use server";

import { DomainError } from "@/lib/deals/service";
import { kycSubmissionSchema, submitKyc, type KycFile } from "@/lib/deals/kyc";
import { DOC_CATEGORIES } from "@/lib/risk/engine";
import { MAX_UPLOAD_BYTES } from "@/lib/deals/documents";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { invalid, type ActionResult } from "@/lib/actions-util";

const MAX_FILES = 20;
const MAX_TOTAL = 25 * 1024 * 1024;

export async function submitKycAction(token: string, form: FormData): Promise<ActionResult> {
  const ip = await clientIp();
  if (!rateLimit(`kyc-submit:${ip}`, 10, 60 * 60_000).ok) return { error: "Too many attempts from this network. Please try again later." };
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("payload") ?? "{}"));
  } catch {
    return { error: "The form could not be read. Please reload the page." };
  }
  const parsed = kycSubmissionSchema.safeParse(raw);
  if (!parsed.success) return { ...invalid(parsed.error), error: "Some answers need your attention — see the highlighted fields." };

  const files: KycFile[] = [];
  let total = 0;
  for (let i = 0; i < MAX_FILES + 1; i++) {
    const f = form.get(`file_${i}`);
    if (!(f instanceof File) || f.size === 0) continue;
    if (files.length >= MAX_FILES) return { error: `Please upload at most ${MAX_FILES} files.` };
    if (f.size > MAX_UPLOAD_BYTES) return { error: `${f.name} is larger than 10 MB.` };
    total += f.size;
    if (total > MAX_TOTAL) return { error: "Total upload exceeds 25 MB. Send the largest documents separately to your broker." };
    const category = String(form.get(`fileCategory_${i}`) ?? "other");
    const partyKey = String(form.get(`fileParty_${i}`) ?? "deal");
    files.push({
      name: f.name,
      bytes: Buffer.from(await f.arrayBuffer()),
      category: DOC_CATEGORIES[category] ? category : "other",
      partyKey: /^(buyer|payer|deal|owner:\d{1,2}|intermediate:\d)$/.test(partyKey) ? partyKey : "deal",
    });
  }

  try {
    await submitKyc(token, parsed.data, files, ip);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("[kyc] submission failed", err);
    return { error: "We could not save your submission. Please try again in a moment." };
  }
}
