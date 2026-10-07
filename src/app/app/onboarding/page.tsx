import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { OnboardingForm } from "./form";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const { user, org } = await requireUser({ allowUnonboarded: true });
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="eyebrow">Step 1 of 2 · about 60 seconds</p>
      <h1 className="display mt-3 text-[44px]">Tell us about your firm</h1>
      <p className="mt-3 text-[15px] text-ink-2">
        This sets the right regulator, Financial Intelligence Unit and risk lists for your files. Next, you&apos;ll open your first deal file.
      </p>
      <OnboardingForm
        defaults={{
          name: org.name,
          country: org.country ?? "",
          businessType: org.businessType,
          registrationNumber: org.registrationNumber ?? "",
          complianceOfficerName: org.complianceOfficerName ?? user.name,
          complianceOfficerEmail: org.complianceOfficerEmail ?? user.email,
          activities: org.activities?.length ? org.activities : ["sales"],
        }}
      />
    </div>
  );
}
