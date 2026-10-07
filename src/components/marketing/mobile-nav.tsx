"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-lg border border-line bg-white"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-line bg-paper px-4 pb-5 pt-2 shadow-sm">
          <nav className="flex flex-col">
            {items.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-line/70 py-3 text-[15px]">
                {n.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="border-b border-line/70 py-3 text-[15px]">
              Sign in
            </Link>
          </nav>
          <Link href="/signup" onClick={() => setOpen(false)} className="mt-4 flex h-11 items-center justify-center rounded-lg bg-ink text-[15px] font-medium text-white">
            Start free trial
          </Link>
        </div>
      ) : null}
    </div>
  );
}
