"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { createDemoWorkspace } from "@/lib/demo/seed";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { track } from "@/lib/analytics";
import type { ActionResult } from "@/lib/actions-util";

export async function startDemoAction(): Promise<ActionResult> {
  const ip = await clientIp();
  if (!rateLimit(`demo:${ip}`, 10, 60 * 60_000).ok) return { error: "Too many demo workspaces from this network — please try again later." };
  const { user, org } = await createDemoWorkspace();
  await createSession(user.id, { days: 1 });
  await track("demo_started", {}, { orgId: org.id, userId: user.id, isDemo: true });
  redirect("/app");
}

const leadSchema = z.object({
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || z.email().safeParse(v).success, "Enter a valid email"),
  company: z.string().trim().max(160).optional().transform((v) => v || null),
  businessType: z.string().trim().max(40).optional().transform((v) => v || null),
  score: z.number().int().min(0).max(100),
  answers: z.record(z.string(), z.string().max(40)),
});

export async function saveReadinessAction(input: unknown): Promise<ActionResult> {
  const ip = await clientIp();
  if (!rateLimit(`lead:${ip}`, 20, 60 * 60_000).ok) return { error: "Too many submissions. Please try again later." };
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const db = await getDb();
  await db.insert(leads).values(parsed.data);
  await track("readiness_check_completed", { score: parsed.data.score, withEmail: !!parsed.data.email, businessType: parsed.data.businessType });
  return { ok: true };
}
