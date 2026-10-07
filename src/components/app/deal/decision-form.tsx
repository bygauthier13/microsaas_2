"use client";
import { useActionState } from "react";
import type { ActionResult } from "@/lib/actions-util";
import { Field, FormError, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function DecisionForm({ action, canApprove, approveHint }: { action: (s: ActionResult, f: FormData) => Promise<ActionResult>; canApprove: boolean; approveHint?: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-3" noValidate>
      <FormError message={state.error} />
      <Field label="Grounds for the decision" htmlFor="decision-note" hint="Kept in the file. Supervisors expect the reasoning, not just the outcome.">
        <Textarea id="decision-note" name="note" rows={3} placeholder="e.g. EDD completed: source of wealth corroborated by accountant's letter; funds via regulated escrow." />
      </Field>
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="approved" size="sm" disabled={!canApprove} title={approveHint}>
          Approve deal
        </SubmitButton>
        <SubmitButton name="decision" value="rejected" variant="secondary" size="sm">
          Reject / refuse business
        </SubmitButton>
      </div>
      {!canApprove && approveHint ? <p className="text-[12px] text-muted">{approveHint}</p> : null}
    </form>
  );
}
