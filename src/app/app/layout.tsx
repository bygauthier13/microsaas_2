import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CreditCard, FolderLock, LayoutDashboard, LogOut, Mail, Radar, Settings } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { accessState } from "@/lib/billing/access";
import { config } from "@/lib/config";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/app/nav-link";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: { default: "Workspace", template: "%s · Ensign" }, robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireUser({ allowUnonboarded: true });
  if (!org.onboardedAt) {
    return (
      <div className="min-h-dvh bg-paper">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
            <Logo href="/app/onboarding" />
            <form action={logout}>
              <button className="text-[13px] text-muted hover:text-ink">Sign out</button>
            </form>
          </div>
        </header>
        {children}
      </div>
    );
  }

  const access = accessState(org);
  const isAdmin = config.adminEmails.includes(user.email);
  const showOutbox = org.isDemo || config.devTools || !config.email.apiKey;

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-sand/60 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:px-5 lg:py-6">
          <Logo href="/app" />
          <form action={logout} className="lg:hidden">
            <button aria-label="Sign out" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-white">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0" aria-label="Workspace">
          <NavLink href="/app" exact>
            <LayoutDashboard className="size-4" /> Dashboard
          </NavLink>
          <NavLink href="/app/deals">
            <FolderLock className="size-4" /> Deal files
          </NavLink>
          <NavLink href="/app/monitoring">
            <Radar className="size-4" /> Monitoring
          </NavLink>
          <NavLink href="/app/settings">
            <Settings className="size-4" /> Settings
          </NavLink>
          <NavLink href="/app/billing">
            <CreditCard className="size-4" /> Billing
          </NavLink>
          {showOutbox ? (
            <NavLink href="/app/outbox">
              <Mail className="size-4" /> Email outbox
            </NavLink>
          ) : null}
          {isAdmin ? (
            <NavLink href="/app/admin">
              <Activity className="size-4" /> Founder metrics
            </NavLink>
          ) : null}
        </nav>
        <div className="hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-[13px] font-medium">{org.name}</p>
          <p className="truncate text-[12px] text-muted">
            {user.name} · {user.role}
          </p>
          <form action={logout} className="mt-3">
            <button className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        {access.kind === "demo" ? (
          <div className="no-print flex flex-col items-start justify-between gap-2 border-b border-brass/25 bg-brass-soft px-4 py-2.5 text-[13px] text-ink-2 sm:flex-row sm:items-center lg:px-8">
            <span>
              <strong className="font-semibold">Demo workspace.</strong> Everything here is fictional — no real screening, email or payment. It is deleted after 24 hours.
            </span>
            <LinkButton href="/signup" size="sm" variant="primary">
              Create your real workspace
            </LinkButton>
          </div>
        ) : access.kind === "trial" ? (
          <div className="no-print flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 text-[13px] text-muted lg:px-8">
            <span>
              Trial · <strong className="text-ink">{access.daysLeft} day{access.daysLeft === 1 ? "" : "s"}</strong> left on the Brokerage plan.
            </span>
            <Link href="/app/billing" className="font-medium text-sea underline underline-offset-4">
              Choose a plan
            </Link>
          </div>
        ) : access.kind === "expired" ? (
          <div className="no-print flex items-center justify-between gap-3 border-b border-bad/20 bg-bad-soft px-4 py-2.5 text-[13px] text-bad lg:px-8">
            <span>Your trial has ended. Existing files remain available to view and export; new files, screening and monitoring are paused.</span>
            <Link href="/app/billing" className="font-semibold underline underline-offset-4">
              Reactivate
            </Link>
          </div>
        ) : access.kind === "past_due" ? (
          <div className="no-print border-b border-warn/20 bg-warn-soft px-4 py-2.5 text-[13px] text-warn lg:px-8">
            Your last payment failed. Update your card in <Link href="/app/billing" className="underline">Billing</Link> to keep monitoring running.
          </div>
        ) : null}
        {config.isProduction && process.env.ENABLE_DEV_TOOLS === "true" && !org.isDemo ? (
          <div className="no-print border-b border-bad/20 bg-bad-soft px-4 py-2 text-[12px] text-bad lg:px-8">ENABLE_DEV_TOOLS is on in a production build. Disable it before going live.</div>
        ) : null}
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
