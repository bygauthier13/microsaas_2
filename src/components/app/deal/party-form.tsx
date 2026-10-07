"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import type { ActionResult } from "@/lib/actions-util";
import { Button, Field, FormError, Input, Notice, Select } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { CountrySelect } from "@/components/app/country-select";

export function PartyForm({ action, entities }: { action: (s: ActionResult, f: FormData) => Promise<ActionResult>; entities: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  const [kind, setKind] = useState<"person" | "entity">("person");
  const [role, setRole] = useState("buyer");
  const formRef = useRef<HTMLFormElement>(null);
  const fe = state.fieldErrors ?? {};
  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    // Most follow-up entries are beneficial owners: default the next one to a natural person.
    setRole("beneficial_owner");
    setKind("person");
  }, [state]);

  if (!open) {
    return (
      <div className="px-5 py-4">
        {state.ok && state.message ? <Notice tone="ok" className="mb-3">{state.message}</Notice> : null}
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" /> Add a party manually
        </Button>
      </div>
    );
  }
  return (
    <form ref={formRef} action={formAction} className="space-y-4 border-t border-line bg-paper/60 px-5 py-5" noValidate>
      <FormError message={state.error} />
      {state.ok && state.message ? <Notice tone="ok">{state.message}</Notice> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Role" htmlFor="p-role">
          <Select id="p-role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="buyer">Buyer (customer)</option>
            <option value="beneficial_owner">Beneficial owner</option>
            <option value="intermediate">Intermediate entity (holding / trust)</option>
            <option value="payer">Payer</option>
            <option value="representative">Representative (lawyer, family office)</option>
            <option value="seller">Seller</option>
            <option value="director">Director</option>
            <option value="trustee">Trustee</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Type" htmlFor="p-kind">
          <Select id="p-kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "person" | "entity")}>
            <option value="person">Natural person</option>
            <option value="entity">Company, trust or foundation</option>
          </Select>
        </Field>
        <Field label="Full legal name" htmlFor="p-name" error={fe.fullName}>
          <Input id="p-name" name="fullName" required />
        </Field>
        {kind === "person" ? (
          <>
            <Field label="Date of birth" htmlFor="p-dob">
              <Input id="p-dob" name="dateOfBirth" type="date" />
            </Field>
            <Field label="Nationality" htmlFor="p-nat">
              <CountrySelect id="p-nat" name="nationality" />
            </Field>
            <Field label="Country of residence" htmlFor="p-res">
              <CountrySelect id="p-res" name="residenceCountry" />
            </Field>
            <Field label="ID document number" htmlFor="p-idn">
              <Input id="p-idn" name="idDocNumber" />
            </Field>
            <Field label="ID expiry" htmlFor="p-idx">
              <Input id="p-idx" name="idDocExpiry" type="date" />
            </Field>
            <input type="hidden" name="idDocType" value="Passport" />
          </>
        ) : (
          <>
            <Field label="Jurisdiction" htmlFor="p-jur">
              <CountrySelect id="p-jur" name="jurisdiction" />
            </Field>
            <Field label="Entity type" htmlFor="p-et">
              <Select id="p-et" name="entityType" defaultValue="company">
                <option value="company">Company</option>
                <option value="trust">Trust</option>
                <option value="foundation">Foundation</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Registration number" htmlFor="p-reg">
              <Input id="p-reg" name="registrationNumber" />
            </Field>
          </>
        )}
        {(role === "beneficial_owner" || role === "intermediate") && entities.length ? (
          <>
            <Field label={role === "beneficial_owner" ? "Owns / controls" : "Holds"} htmlFor="p-parent">
              <Select id="p-parent" name="parentPartyId" defaultValue={entities[0]?.id}>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ownership %" htmlFor="p-pct" error={fe.ownershipPct}>
              <Input id="p-pct" name="ownershipPct" inputMode="decimal" />
            </Field>
          </>
        ) : null}
      </div>
      {kind === "person" ? (
        <label className="flex items-center gap-2 text-[13.5px]">
          <input type="checkbox" name="pep" className="size-4 accent-[#0b1b2b]" /> Politically exposed person (self-declared or known)
        </label>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
        <SubmitButton size="sm" pendingText="Adding & screening…">
          Add &amp; screen
        </SubmitButton>
      </div>
    </form>
  );
}
