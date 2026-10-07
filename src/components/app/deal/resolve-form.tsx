"use client";
import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions-util";
import { Field, FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function ResolveForm({ action, screeningId }: { action: (s: ActionResult, f: FormData) => Promise<ActionResult>; screeningId: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  return (
    <form action={formAction} className="mt-3 space-y-2" noValidate>
      <input type="hidden" name="screeningId" value={screeningId} />
      <FormError message={state.error} />
      <Field label="Your conclusion (recorded in the audit file)" htmlFor={`note-${screeningId}`} error={state.fieldErrors?.note}>
        <Textarea id={`note-${screeningId}`} name="note" rows={2} placeholder="e.g. Different person: client born 1991, German national, admitted lawyer in Munich." />
      </Field>
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="resolution" value="false_positive" variant="secondary" size="sm">
          Clear as false positive
        </SubmitButton>
        <SubmitButton name="resolution" value="true_match" variant="danger" size="sm">
          Confirm match
        </SubmitButton>
      </div>
    </form>
  );
}
