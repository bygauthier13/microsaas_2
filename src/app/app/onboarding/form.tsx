"use client";
import { useActionState } from "react";
import { completeOnboarding } from "@/app/actions/app";
import type { ActionResult } from "@/lib/actions-util";
import { Field, FormError, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { CountrySelect } from "@/components/app/country-select";
import { BUSINESS_TYPES } from "@/lib/format";

const ACTIVITIES = [
  { v: "sales", label: "Sales brokerage" },
  { v: "charter", label: "Charter brokerage" },
  { v: "new_build", label: "New builds" },
  { v: "refit", label: "Refit" },
  { v: "management", label: "Yacht / aircraft management" },
];

export function OnboardingForm({
  defaults,
}: {
  defaults: { name: string; country: string; businessType: string; registrationNumber: string; complianceOfficerName: string; complianceOfficerEmail: string; activities: string[] };
}) {
  const [state, action] = useActionState<ActionResult, FormData>(completeOnboarding, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-10 space-y-6 rounded-2xl border border-line bg-white p-6 sm:p-8" noValidate>
      <FormError message={state.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Firm name" htmlFor="name" error={fe.name} className="sm:col-span-2">
          <Input id="name" name="name" defaultValue={defaults.name} required />
        </Field>
        <Field label="Country of establishment" htmlFor="country" error={fe.country} hint="Determines your supervisor and FIU.">
          <CountrySelect id="country" name="country" defaultValue={defaults.country} required placeholder="Select country" />
        </Field>
        <Field label="Business type" htmlFor="businessType" error={fe.businessType}>
          <Select id="businessType" name="businessType" defaultValue={defaults.businessType}>
            {Object.entries(BUSINESS_TYPES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Company registration number" htmlFor="registrationNumber" hint="Optional — printed on Article 74 reports.">
          <Input id="registrationNumber" name="registrationNumber" defaultValue={defaults.registrationNumber} />
        </Field>
        <div />
        <Field label="AML compliance officer" htmlFor="complianceOfficerName" error={fe.complianceOfficerName}>
          <Input id="complianceOfficerName" name="complianceOfficerName" defaultValue={defaults.complianceOfficerName} required />
        </Field>
        <Field label="Compliance officer email" htmlFor="complianceOfficerEmail" error={fe.complianceOfficerEmail} hint="Receives KYC submissions and monitoring alerts.">
          <Input id="complianceOfficerEmail" name="complianceOfficerEmail" type="email" defaultValue={defaults.complianceOfficerEmail} required />
        </Field>
      </div>
      <fieldset>
        <legend className="text-[13px] font-medium text-ink-2">Activities</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <label key={a.v} className="flex cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-white px-3 py-1.5 text-[13px] has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
              <input type="checkbox" name="activities" value={a.v} defaultChecked={defaults.activities.includes(a.v)} className="sr-only" />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center justify-between gap-4 border-t border-line pt-6">
        <p className="text-[12.5px] text-muted">You can change all of this later in Settings.</p>
        <SubmitButton size="lg" pendingText="Saving…">
          Continue
        </SubmitButton>
      </div>
    </form>
  );
}
