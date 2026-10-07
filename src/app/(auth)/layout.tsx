import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <Logo light />
        <div>
          <p className="font-serif text-[44px] leading-[1.05]">“Behave as though every high-value transaction this year is an AML test.”</p>
          <p className="mt-4 text-[14px] text-white/60">SuperyachtNews, on the EU AML Regulation — January 2026</p>
        </div>
        <ul className="grid grid-cols-3 gap-6 text-[13px] text-white/70">
          <li>
            <span className="block font-serif text-[28px] text-white">€7.5m</span>Yacht & aircraft threshold
          </li>
          <li>
            <span className="block font-serif text-[28px] text-white">€250k</span>Motor-vehicle threshold
          </li>
          <li>
            <span className="block font-serif text-[28px] text-white">5 yrs</span>Record retention
          </li>
        </ul>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-[12px] text-muted">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/terms" className="hover:text-ink">Terms</Link> · <Link href="/security" className="hover:text-ink">Security</Link>
        </p>
      </main>
    </div>
  );
}
