"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "@/app/actions/auth";
import { Field, FormError, Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError message={state.error} />
      <Field label="Work email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label={
          <span className="flex justify-between">
            Password
            <Link href="/forgot-password" className="font-normal text-muted underline underline-offset-4">
              Forgot?
            </Link>
          </span>
        }
        htmlFor="password"
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
