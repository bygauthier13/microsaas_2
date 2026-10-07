/**
 * Fixed-window in-memory rate limiter. Good enough for a single instance / MVP.
 * On multi-instance serverless deployments swap for a shared store (e.g. Upstash Redis).
 */
type Bucket = { count: number; resetAt: number };
const g = globalThis as typeof globalThis & { __ensignRate?: Map<string, Bucket> };
const buckets = (g.__ensignRate ??= new Map());

// Test environments run many sign-ups/logins from one IP; production keeps the multiplier at 1.
const MULTIPLIER = Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  limit = limit * MULTIPLIER;
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}
