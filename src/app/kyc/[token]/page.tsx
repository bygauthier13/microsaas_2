import type { Metadata } from "next";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { findOpenKycRequest, markKycOpened } from "@/lib/deals/kyc";
import { clientIp } from "@/lib/request";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { DOC_CATEGORIES } from "@/lib/risk/engine";
import { KycForm } from "./kyc-form";

export const metadata: Metadata = { title: "Secure due-diligence request", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function KycPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findOpenKycRequest(token);

  if (!found || found.closed) {
    const msg = !found
      ? "This link is not valid. Please check you copied it in full, or ask your broker for a new one."
      : found.closed === "submitted"
        ? "This file has already been submitted. Thank you — your broker has been notified."
        : found.closed === "expired"
          ? "This link has expired. Please ask your broker for a new one."
          : "This link has been withdrawn by the sender.";
    return (
      <Shell orgName={found?.org.name}>
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <ShieldCheck className="mx-auto size-8 text-brass" />
          <p className="mt-4 text-[15px] text-ink-2">{msg}</p>
        </div>
      </Shell>
    );
  }

  await markKycOpened(found.request.id, found.org.id, found.deal.id, await clientIp());
  return (
    <Shell orgName={found.org.name} reference={found.deal.reference}>
      <div className="mb-8">
        <h1 className="display text-[38px] sm:text-[46px]">Customer due-diligence file</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Dear {found.request.recipientName}, <strong>{found.org.name}</strong> is required by anti-money-laundering law to identify the buyer, its beneficial owners and the
          source of the funds before the transaction can complete. This takes about 15 minutes. You can submit once.
        </p>
        {found.request.message ? <blockquote className="mt-4 rounded-xl border border-line bg-white px-4 py-3 text-[14px] italic text-ink-2">“{found.request.message}”</blockquote> : null}
      </div>
      <KycForm token={token} countries={COUNTRY_OPTIONS} categories={DOC_CATEGORIES} defaultName={found.request.recipientName} defaultEmail={found.request.recipientEmail ?? ""} />
      <p className="mt-10 text-[12px] leading-relaxed text-muted">
        Privacy: {found.org.name} is the data controller for this information and processes it to meet its legal obligations under Regulation (EU) 2024/1624 and national
        law. Ensign processes it on their behalf, encrypts documents at rest and retains the file for five years as required by law. Contact {found.org.name} to exercise
        your data-protection rights.
      </p>
    </Shell>
  );
}

function Shell({ orgName, reference, children }: { orgName?: string; reference?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-[22px] leading-none">{orgName ?? "Secure request"}</p>
            {reference ? <p className="mt-1 font-mono text-[11.5px] text-muted">Transaction {reference}</p> : null}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-[12px] text-muted">
            <LockKeyhole className="size-3.5" /> Encrypted · powered by Ensign
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}
