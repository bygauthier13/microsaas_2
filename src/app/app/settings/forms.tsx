"use client";
import { useActionState, useEffect, useRef } from "react";
import { inviteMemberAction, updateSettingsAction } from "@/app/actions/app";
import type { ActionResult } from "@/lib/actions-util";
import { Field, FormError, Input, Notice, Select } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { CountrySelect } from "@/components/app/country-select";
import { BUSINESS_TYPES } from "@/lib/format";

export function SettingsForm({
  defaults,
  disabled,
}: {
  disabled: boolean;
  defaults: {
    name: string;
    country: string;
    businessType: string;
    registrationNumber: string;
    complianceOfficerName: string;
    complianceOfficerEmail: string;
    reportDeadlineDays: number;
    extraHighRiskCountries: string;
    activities: string[];
  };
}) {
  const [state, action] = useActionState<ActionResult, FormData>(updateSettingsAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={state.error} />
      {state.ok && state.message ? <Notice tone="ok">{state.message}</Notice> : null}
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        <Field label="Firm name" htmlFor="s-name" error={fe.name} className="sm:col-span-2">
          <Input id="s-name" name="name" defaultValue={defaults.name} />
        </Field>
        <Field label="Country of establishment" htmlFor="s-country" error={fe.country}>
          <CountrySelect id="s-country" name="country" defaultValue={defaults.country} />
        </Field>
        <Field label="Business type" htmlFor="s-bt" error={fe.businessType}>
          <Select id="s-bt" name="businessType" defaultValue={defaults.businessType}>
            {Object.entries(BUSINESS_TYPES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Registration number" htmlFor="s-reg">
          <Input id="s-reg" name="registrationNumber" defaultValue={defaults.registrationNumber} />
        </Field>
        <Field label="Article 74 deadline (days after completion)" htmlFor="s-dl" error={fe.reportDeadlineDays} hint="Set by your FIU — verify locally.">
          <Input id="s-dl" name="reportDeadlineDays" inputMode="numeric" defaultValue={defaults.reportDeadlineDays} />
        </Field>
        <Field label="Compliance officer" htmlFor="s-co" error={fe.complianceOfficerName}>
          <Input id="s-co" name="complianceOfficerName" defaultValue={defaults.complianceOfficerName} />
        </Field>
        <Field label="Compliance officer email" htmlFor="s-coe" error={fe.complianceOfficerEmail}>
          <Input id="s-coe" name="complianceOfficerEmail" type="email" defaultValue={defaults.complianceOfficerEmail} />
        </Field>
        <Field label="Additional high-risk countries (ISO codes)" htmlFor="s-hr" hint="From your business-wide risk assessment, e.g. AE, TR, CN" className="sm:col-span-2">
          <Input id="s-hr" name="extraHighRiskCountries" defaultValue={defaults.extraHighRiskCountries} placeholder="AE, TR" />
        </Field>
        {defaults.activities.map((a) => (
          <input key={a} type="hidden" name="activities" value={a} />
        ))}
      </fieldset>
      {!disabled ? (
        <div className="flex justify-end">
          <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
        </div>
      ) : (
        <p className="text-[12.5px] text-muted">Only owners and admins can change these settings.</p>
      )}
    </form>
  );
}

export function InviteForm() {
  const [state, action] = useActionState<ActionResult, FormData>(inviteMemberAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={action} className="space-y-3" noValidate>
      <FormError message={state.error} />
      {state.ok && state.message ? <Notice tone="ok">{state.message}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="i-name" error={fe.name}>
          <Input id="i-name" name="name" />
        </Field>
        <Field label="Email" htmlFor="i-email" error={fe.email}>
          <Input id="i-email" name="email" type="email" />
        </Field>
      </div>
      <div className="flex items-end justify-between gap-3">
        <Field label="Role" htmlFor="i-role">
          <div className="w-40">
            <Select id="i-role" name="role" defaultValue="member">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
        </Field>
        <SubmitButton size="md" variant="secondary" pendingText="Inviting…">
          Invite teammate
        </SubmitButton>
      </div>
    </form>
  );
}
