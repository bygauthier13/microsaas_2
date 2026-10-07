import { z } from "zod";
import { DomainError } from "@/lib/deals/service";

export type ActionResult = { error?: string; fieldErrors?: Record<string, string | undefined>; ok?: boolean; message?: string; link?: string };

export function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function humanize(key: string) {
  const last = key.split(".").filter((k) => !/^\d+$/.test(k)).pop() ?? key;
  return last.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Validation failure → per-field errors plus a summary, so a problem on a field that has
 * no visible error slot can never fail silently.
 */
export function invalid(err: z.ZodError): ActionResult {
  const fieldErrors = zodErrors(err);
  const summary = err.issues
    .slice(0, 3)
    .map((i) => `${humanize(i.path.join(".") || "form")}: ${i.message}`)
    .join(" · ");
  return { error: `Please check the form — ${summary}`, fieldErrors };
}

/** Converts expected domain errors into form errors; unexpected errors are logged and masked. */
export async function guard(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    // Next.js uses thrown errors for redirect()/notFound(); let them propagate.
    if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: unknown }).digest === "string" && (err as { digest: string }).digest.startsWith("NEXT_")) throw err;
    console.error("[action] unexpected error", err);
    return { error: "Something went wrong. Please try again." };
  }
}

export const optText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const optCountry = z
  .string()
  .trim()
  .toUpperCase()
  .optional()
  .transform((v) => (v && /^[A-Z]{2}$/.test(v) ? v : null));

export const optDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null));

/** HTML checkboxes are absent from FormData when unticked — treat absence as false. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === "1", z.boolean());

export function formObject(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
