import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./form";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; invite?: string }> }) {
  const { token, invite } = await searchParams;
  return (
    <>
      <h1 className="display text-[40px]">{invite ? "Set your password" : "Choose a new password"}</h1>
      <p className="mt-2 text-[14px] text-muted">{invite ? "Welcome to your firm's compliance workspace." : "All other sessions will be signed out."}</p>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <Notice className="mt-8" tone="warn">
          This link is incomplete. <Link href="/forgot-password" className="underline">Request a new one.</Link>
        </Notice>
      )}
    </>
  );
}
