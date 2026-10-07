import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { canWrite } from "@/lib/billing/access";
import { createDealAction } from "@/app/actions/app";
import { DealForm } from "@/components/app/deal-form";
import { Card, LinkButton, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "New deal file" };

export default async function NewDealPage() {
  const { org } = await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/deals" className="text-[13px] text-muted hover:text-ink">
        ← Deal files
      </Link>
      <h1 className="display mt-3 text-[40px]">Open a deal file</h1>
      <p className="mt-2 text-[14.5px] text-ink-2">Two minutes. You&apos;ll add the parties yourself or send the buyer&apos;s representative a secure link on the next screen.</p>
      {canWrite(org) ? (
        <Card className="mt-8 p-6 sm:p-8">
          <DealForm action={createDealAction} submitLabel="Open deal file" />
        </Card>
      ) : (
        <Notice tone="warn" className="mt-8" title="Your trial has ended">
          Choose a plan to open new deal files. Your existing files remain available.
          <div className="mt-3">
            <LinkButton href="/app/billing" size="sm">
              See plans
            </LinkButton>
          </div>
        </Notice>
      )}
    </div>
  );
}
