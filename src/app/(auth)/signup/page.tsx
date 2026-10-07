import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./form";
import { redirectIfSignedIn } from "@/app/actions/auth";
import { TRIAL_DAYS } from "@/lib/billing/plans";

export const metadata: Metadata = { title: "Start your free trial", description: "Create your Ensign compliance workspace — 14 days free, no card required." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plan?: string; interval?: string }> }) {
  await redirectIfSignedIn();
  const sp = await searchParams;
  return (
    <>
      <h1 className="display text-[40px]">Open your first AML file today</h1>
      <p className="mt-2 text-[14px] text-muted">{TRIAL_DAYS} days of the Brokerage plan. No card required.</p>
      <SignupForm plan={sp.plan} interval={sp.interval} />
      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
