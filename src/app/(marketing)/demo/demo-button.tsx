"use client";
import { useState, useTransition } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { startDemoAction } from "@/app/actions/public";
import { Button, FormError } from "@/components/ui";

export function DemoButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <FormError message={error} />
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await startDemoAction();
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Preparing your workspace…" : "Enter the demo workspace"}
        {!pending ? <ArrowRight className="size-4" /> : null}
      </Button>
      <p className="text-[12.5px] text-muted">Takes about five seconds to build. Fictional data only.</p>
    </div>
  );
}
