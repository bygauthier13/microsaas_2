"use client";
import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions-util";
import { Field, FormError, Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

const today = () => new Date().toISOString().slice(0, 10);

export function CompleteForm({ action }: { action: (s: ActionResult, f: FormData) => Promise<ActionResult> }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2" noValidate>
      <FormError message={state.error} />
      <Field label="Completion date" htmlFor="completedOn" error={state.fieldErrors?.completedOn}>
        <div className="w-44">
          <Input id="completedOn" name="completedOn" type="date" defaultValue={today()} />
        </div>
      </Field>
      <SubmitButton size="sm" variant="secondary">
        Mark sale completed
      </SubmitButton>
    </form>
  );
}

export function SubmitReportForm({ action }: { action: (s: ActionResult, f: FormData) => Promise<ActionResult> }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <FormError message={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="FIU acknowledgement reference" htmlFor="reference" error={fe.reference}>
          <Input id="reference" name="reference" placeholder="e.g. TRACFIN-2027-001234" />
        </Field>
        <Field label="Submitted on" htmlFor="submittedOn" error={fe.submittedOn}>
          <Input id="submittedOn" name="submittedOn" type="date" defaultValue={today()} />
        </Field>
      </div>
      <SubmitButton size="sm">Record submission</SubmitButton>
    </form>
  );
}
