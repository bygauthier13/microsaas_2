"use client";
import { useActionState } from "react";
import { signup, type FormState } from "@/app/actions/auth";
import { Field, FormError, Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function SignupForm({ plan, interval }: { plan?: string; interval?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signup, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      <input type="hidden" name="plan" value={plan ?? ""} />
      <input type="hidden" name="interval" value={interval ?? ""} />
      <FormError message={state.error} />
      <Field label="Your name" htmlFor="name" error={fe.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Firm" htmlFor="company" error={fe.company}>
        <Input id="company" name="company" autoComplete="organization" placeholder="e.g. Riviera Yacht Partners" required />
      </Field>
      <Field label="Work email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password} hint="At least 10 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Creating your workspace…">
        Create workspace
      </SubmitButton>
      <p className="text-center text-[12px] text-muted">By continuing you agree to the Terms and acknowledge the Privacy notice.</p>
    </form>
  );
}
