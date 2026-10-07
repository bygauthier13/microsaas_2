import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brass";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-sea",
  secondary: "bg-white text-ink border border-line-strong hover:border-ink/40 hover:bg-sand/60",
  ghost: "text-ink-2 hover:bg-sand",
  danger: "bg-bad text-white hover:bg-bad/90",
  brass: "bg-brass text-white hover:bg-brass/90",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

const field =
  "w-full rounded-lg border border-line-strong bg-white px-3 text-[14px] text-ink placeholder:text-faint shadow-[inset_0_1px_0_rgba(0,0,0,0.02)] focus:border-sea focus:outline-none focus:ring-2 focus:ring-sea/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(field, "h-10 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "py-2 min-h-[88px]", className)} {...props} />;
}

export function Field({ label, hint, error, children, className, htmlFor }: { label: ReactNode; hint?: ReactNode; error?: string; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? <p className="text-[12px] text-bad">{error}</p> : hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

const CARD_TONES = {
  default: "border-line bg-white",
  accent: "border-ink bg-white",
  danger: "border-bad/30 bg-white",
  ink: "border-ink bg-ink text-white",
} as const;

export function Card({ className, children, tone = "default", ...props }: ComponentProps<"div"> & { tone?: keyof typeof CARD_TONES }) {
  return (
    <div className={cn("rounded-xl border", CARD_TONES[tone], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type Tone = "neutral" | "ok" | "warn" | "bad" | "sea" | "brass";
const tones: Record<Tone, string> = {
  neutral: "bg-sand text-ink-2 border-line",
  ok: "bg-ok-soft text-ok border-ok/20",
  warn: "bg-warn-soft text-warn border-warn/20",
  bad: "bg-bad-soft text-bad border-bad/20",
  sea: "bg-sea-soft text-sea border-sea/15",
  brass: "bg-brass-soft text-brass border-brass/20",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[12px] font-medium leading-5", tones[tone], className)}>{children}</span>;
}

export const RISK_TONE: Record<string, Tone> = { low: "ok", medium: "warn", high: "bad", prohibited: "bad" };
export function RiskBadge({ level, dd }: { level?: string | null; dd?: string | null }) {
  if (!level) return <Badge>Not assessed</Badge>;
  const label = level === "prohibited" ? "Prohibited" : `${level[0].toUpperCase()}${level.slice(1)} risk`;
  return (
    <Badge tone={RISK_TONE[level] ?? "neutral"}>
      <span className={cn("size-1.5 rounded-full", level === "low" ? "bg-ok" : level === "medium" ? "bg-warn" : "bg-bad")} />
      {label}
      {dd && dd !== "refuse" ? <span className="opacity-70">· {dd === "enhanced" ? "EDD" : "Standard DD"}</span> : null}
    </Badge>
  );
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  collecting: { label: "Awaiting client", tone: "sea" },
  review: { label: "In review", tone: "warn" },
  approved: { label: "Approved", tone: "ok" },
  rejected: { label: "Rejected", tone: "bad" },
  completed: { label: "Completed", tone: "ok" },
  aborted: { label: "Aborted", tone: "neutral" },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? <div className="mb-4 grid size-12 place-items-center rounded-full bg-sand text-brass">{icon}</div> : null}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "sea", title, children, className }: { tone?: Tone; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-[13px] leading-relaxed", tones[tone], className)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2 text-[13px] text-bad">
      {message}
    </p>
  );
}
