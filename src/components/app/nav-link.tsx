"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export function NavLink({ href, children, exact }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition-colors",
        active ? "bg-white text-ink shadow-[0_1px_2px_rgba(11,27,43,0.08)] ring-1 ring-line" : "text-ink-2 hover:bg-white/60",
      )}
    >
      {children}
    </Link>
  );
}
