"use client";
import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "@/lib/actions-util";
import { Button } from "@/components/ui";
import type { ComponentProps } from "react";

export function ActionButton({
  action,
  confirmText,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "action"> & { action: () => Promise<ActionResult | void>; confirmText?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        disabled={pending || props.disabled}
        aria-busy={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (res && res.error) setError(res.error);
          });
        }}
        {...props}
      >
        {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
        {children}
      </Button>
      {error ? <span role="alert" className="max-w-xs text-[12px] text-bad">{error}</span> : null}
    </span>
  );
}
