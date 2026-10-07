"use client";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "@/app/actions/auth";
import { Field, FormError, Input, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <Notice className="mt-8" tone="ok">{state.message}</Notice>;
  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      <FormError message={state.error} />
      <Field label="Work email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
