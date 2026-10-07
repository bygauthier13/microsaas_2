import type { Metadata } from "next";
import { daysUntilAmlr } from "@/lib/format";
import { ReadinessQuiz } from "./quiz";

export const metadata: Metadata = {
  title: "AMLR readiness check for yacht, aircraft & car dealers",
  description: "Ten questions, two minutes: how ready is your brokerage for the EU AML Regulation (10 July 2027), Article 74 threshold reporting and Monaco's AMSF inspections?",
  alternates: { canonical: "/amlr-readiness" },
};

export default function ReadinessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="eyebrow">Free · 2 minutes · no sign-up</p>
      <h1 className="display mt-4 text-[46px] sm:text-[56px]">Are you ready for 10 July 2027?</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
        {daysUntilAmlr()} days before the EU AML Regulation applies to yacht, aircraft and luxury car traders. Answer ten questions — the same ones a supervisor asks — and
        get your gaps, with what to do about each.
      </p>
      <ReadinessQuiz />
    </div>
  );
}
