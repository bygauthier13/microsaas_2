"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-[44px]">Something went wrong</h1>
        <p className="mt-2 text-[14.5px] text-muted">The error has been logged{error.digest ? ` (ref ${error.digest})` : ""}. Your data is safe.</p>
        <button onClick={reset} className="mt-6 inline-flex h-10 items-center rounded-lg bg-ink px-4 text-[14px] font-medium text-white">
          Try again
        </button>
      </div>
    </div>
  );
}
