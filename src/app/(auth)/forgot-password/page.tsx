import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./form";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="display text-[40px]">Reset your password</h1>
      <p className="mt-2 text-[14px] text-muted">We&apos;ll email you a link that is valid for one hour.</p>
      <ForgotForm />
      <p className="mt-8 text-center text-[14px] text-muted">
        <Link href="/login" className="underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
