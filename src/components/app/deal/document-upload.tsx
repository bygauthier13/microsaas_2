"use client";
import { useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "@/lib/actions-util";
import { Field, FormError, Notice, Select } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function DocumentUpload({
  action,
  categories,
  partiesList,
  suggested,
}: {
  action: (s: ActionResult, f: FormData) => Promise<ActionResult>;
  categories: Record<string, string>;
  partiesList: { id: string; name: string }[];
  suggested?: { category: string; partyId: string | null };
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  const fe = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={formAction} className="space-y-3 border-t border-line bg-paper/60 px-5 py-4" noValidate>
      <FormError message={state.error} />
      {state.ok && state.message ? <Notice tone="ok">{state.message}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Category" htmlFor="d-cat" error={fe.category}>
          <Select id="d-cat" name="category" defaultValue={suggested?.category ?? "passport"}>
            {Object.entries(categories).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Relates to" htmlFor="d-party">
          <Select id="d-party" name="partyId" defaultValue={suggested?.partyId ?? ""}>
            <option value="">The deal (no specific party)</option>
            {partiesList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="File" htmlFor="d-file" error={fe.file} hint="PDF, JPG, PNG, WEBP or HEIC · max 10 MB">
          <input id="d-file" name="file" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic" className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-white" />
        </Field>
      </div>
      <div className="flex justify-end">
        <SubmitButton size="sm" pendingText="Encrypting…">
          Upload
        </SubmitButton>
      </div>
    </form>
  );
}
