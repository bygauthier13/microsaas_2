import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./form";
import { redirectIfSignedIn } from "@/app/actions/auth";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; signed_out?: string }> }) {
  await redirectIfSignedIn();
  const sp = await searchParams;
  return (
    <>
      <h1 className="display text-[40px]">Welcome back</h1>
      <p className="mt-2 text-[14px] text-muted">Sign in to your compliance workspace.</p>
      {sp.signed_out ? <Notice className="mt-6">You have been signed out.</Notice> : null}
      <LoginForm next={sp.next} />
      <p className="mt-8 text-center text-[14px] text-muted">
        New to Ensign?{" "}
        <Link href="/signup" className="font-medium text-ink underline underline-offset-4">
          Start a free trial
        </Link>
      </p>
      <p className="mt-2 text-center text-[13px] text-muted">
        Just looking?{" "}
        <Link href="/demo" className="underline underline-offset-4">
          Open the demo workspace
        </Link>
      </p>
    </>
  );
}
