"use client";
import { useActionState } from "react";
import { resetPassword, type FormState } from "@/app/actions/auth";
import { Field, FormError, Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormError message={state.error ?? fe.token} />
      <Field label="New password" htmlFor="password" error={fe.password} hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={fe.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Saving…">
        Save password
      </SubmitButton>
    </form>
  );
}
