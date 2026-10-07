"use client";
import { useActionState, useState } from "react";
import { Send } from "lucide-react";
import type { ActionResult } from "@/lib/actions-util";
import { Button, Field, FormError, Input, Notice, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { CopyField } from "@/components/app/copy-field";

export function KycLinkForm({ action, defaultMessage }: { action: (s: ActionResult, f: FormData) => Promise<ActionResult>; defaultMessage: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  if (state.ok && state.link) {
    return (
      <div className="space-y-3 px-5 py-4">
        <Notice tone="ok">{state.message}</Notice>
        <p className="text-[12.5px] text-muted">This link is shown once. It expires in 14 days and works for a single submission.</p>
        <CopyField value={state.link} openLabel="Open" />
      </div>
    );
  }
  if (!open) {
    return (
      <div className="px-5 py-4">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Send className="size-4" /> Request client KYC
        </Button>
      </div>
    );
  }
  return (
    <form action={formAction} className="space-y-3 px-5 py-4" noValidate>
      <FormError message={state.error} />
      <Field label="Recipient" htmlFor="k-name" error={fe.recipientName} hint="Usually the buyer's lawyer, family office or the principal.">
        <Input id="k-name" name="recipientName" placeholder="Maître Hélène Duval" required />
      </Field>
      <Field label="Email" htmlFor="k-email" error={fe.recipientEmail}>
        <Input id="k-email" name="recipientEmail" type="email" />
      </Field>
      <Field label="Message" htmlFor="k-msg">
        <Textarea id="k-msg" name="message" defaultValue={defaultMessage} rows={3} />
      </Field>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="send" defaultChecked className="size-4 accent-[#0b1b2b]" /> Email the link now
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <SubmitButton size="sm" pendingText="Creating…">
          Create secure link
        </SubmitButton>
      </div>
    </form>
  );
}
