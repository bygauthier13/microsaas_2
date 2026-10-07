import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations, sessions, users, type Organization, type User } from "@/lib/db/schema";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { clientIp, userAgent } from "@/lib/request";
import { config } from "@/lib/config";

export const SESSION_COOKIE = "ensign_session";
const SESSION_DAYS = 30;

export type CurrentUser = { user: User; org: Organization };

export async function createSession(userId: string, opts: { days?: number } = {}) {
  const db = await getDb();
  const token = randomToken(32);
  const days = opts.days ?? SESSION_DAYS;
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  await db.insert(sessions).values({
    id: sha256Hex(token),
    userId,
    expiresAt,
    ip: await clientIp(),
    userAgent: await userAgent(),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.appUrl.startsWith("https://"),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, sha256Hex(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolves the signed-in user for this request (memoised per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const db = await getDb();
  const rows = await db
    .select({ user: users, org: organizations })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(organizations, eq(users.orgId, organizations.id))
    .where(and(eq(sessions.id, sha256Hex(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
});

/** For pages/actions inside /app. Redirects to /login when signed out. */
export async function requireUser(opts: { allowUnonboarded?: boolean } = {}): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!opts.allowUnonboarded && !current.org.onboardedAt) redirect("/app/onboarding");
  return current;
}

export function isSeniorManagement(user: User) {
  return user.role === "owner" || user.role === "admin";
}
