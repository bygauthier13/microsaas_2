"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

export function CopyField({ value, openLabel }: { value: string; openLabel?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input readOnly value={value} aria-label="Link" onFocus={(e) => e.currentTarget.select()} className="h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-3 font-mono text-[12px] text-ink-2" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              /* clipboard unavailable — the input is selectable */
            }
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-[13px] font-medium hover:bg-sand"
        >
          {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
        </button>
        {openLabel ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13px] font-medium text-white hover:bg-sea">
            <ExternalLink className="size-3.5" /> {openLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
