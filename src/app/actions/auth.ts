"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { authTokens, organizations, sessions, users } from "@/lib/db/schema";
import { hashPassword, randomToken, sha256Hex, verifyPassword } from "@/lib/crypto";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, welcomeEmail } from "@/lib/email/templates";
import { config } from "@/lib/config";
import { track } from "@/lib/analytics";
import { TRIAL_DAYS } from "@/lib/billing/plans";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; message?: string };

const email = z.email("Enter a valid work email").max(200).transform((v) => v.toLowerCase().trim());
const password = z.string().min(10, "Use at least 10 characters").max(200);

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword("timing-equaliser-not-a-real-password"));

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/app") && !next.startsWith("//") ? next : "/app";
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  company: z.string().trim().min(2, "Enter your firm's name").max(160),
  email,
  password,
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000).ok) return { error: "Too many sign-ups from this network. Try again later." };
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { name, company, email: mail, password: pw } = parsed.data;
  const db = await getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, mail)).limit(1);
  if (existing.length) return { fieldErrors: { email: "An account with this email already exists. Sign in instead." } };

  const [org] = await db
    .insert(organizations)
    .values({ name: company, plan: "trial", subscriptionStatus: "trialing", trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000) })
    .returning();
  const [user] = await db.insert(users).values({ orgId: org.id, email: mail, name, passwordHash: await hashPassword(pw), role: "owner" }).returning();
  await createSession(user.id);
  await track("signup", { plan_intent: form.get("plan") ?? null }, { orgId: org.id, userId: user.id });
  await sendEmail({ ...welcomeEmail(name), to: mail, orgId: org.id });
  const plan = form.get("plan");
  const interval = form.get("interval");
  const qs = typeof plan === "string" && /^(starter|brokerage)$/.test(plan) ? `?plan=${plan}&interval=${interval === "year" ? "year" : "month"}` : "";
  redirect(`/app/onboarding${qs}`);
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  const parsedEmail = email.safeParse(form.get("email"));
  const pw = String(form.get("password") ?? "");
  if (!parsedEmail.success || !pw) return { error: "Enter your email and password." };
  if (!rateLimit(`login:${ip}`, 20, 15 * 60_000).ok || !rateLimit(`login:${parsedEmail.data}`, 8, 15 * 60_000).ok) {
    return { error: "Too many attempts. Wait 15 minutes or reset your password." };
  }
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsedEmail.data)).limit(1);
  // Always run a hash comparison to keep timing uniform for unknown emails.
  const ok = await verifyPassword(pw, user?.passwordHash ?? (await dummyHash()));
  if (!user || !ok || user.isDemo) return { error: "Email or password is incorrect." };
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/login?signed_out=1");
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  const generic: FormState = { ok: true, message: "If an account exists for that email, a reset link is on its way. It expires in one hour." };
  if (!rateLimit(`reset:${ip}`, 5, 15 * 60_000).ok) return { error: "Too many requests. Try again in a few minutes." };
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { fieldErrors: { email: "Enter a valid email" } };
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data)).limit(1);
  if (!user || user.isDemo) return generic;
  const token = randomToken(32);
  await db.insert(authTokens).values({ id: sha256Hex(token), userId: user.id, purpose: "reset", expiresAt: new Date(Date.now() + 60 * 60_000) });
  const tpl = passwordResetEmail(user.name, `${config.appUrl}/reset-password?token=${token}`);
  await sendEmail({ ...tpl, to: user.email, orgId: user.orgId });
  return generic;
}

const resetSchema = z.object({ token: z.string().min(20).max(100), password });

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`reset-submit:${ip}`, 10, 15 * 60_000).ok) return { error: "Too many attempts. Try again later." };
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (form.get("password") !== form.get("confirm")) return { fieldErrors: { confirm: "Passwords do not match" } };
  const db = await getDb();
  const [tok] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.id, sha256Hex(parsed.data.token)), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .limit(1);
  if (!tok) return { error: "This link is invalid or has expired. Request a new one." };
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, tok.id));
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(users.id, tok.userId));
  // Invalidate every existing session for this user.
  await db.delete(sessions).where(eq(sessions.userId, tok.userId));
  await createSession(tok.userId);
  redirect("/app");
}

export async function redirectIfSignedIn() {
  const current = await getCurrentUser();
  if (current && !current.user.isDemo) redirect("/app");
}
