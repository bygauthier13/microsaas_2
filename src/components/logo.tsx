import Link from "next/link";
import { cn } from "./ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
      <rect width="32" height="32" rx="8" fill="#0b1b2b" />
      <path d="M10 7.5v17" stroke="#d9c49a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 8.5h11.5l-2.6 4 2.6 4H11z" fill="#d9c49a" />
    </svg>
  );
}

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Ensign home">
      <LogoMark />
      <span className={cn("font-serif text-[26px] leading-none tracking-tight", light ? "text-white" : "text-ink")}>Ensign</span>
    </Link>
  );
}
