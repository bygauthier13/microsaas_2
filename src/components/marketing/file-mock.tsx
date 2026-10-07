import { Check, CircleAlert, FileText, Landmark, ShieldCheck, User } from "lucide-react";

/** Static product visual for the landing page — built from real UI primitives, not a screenshot. */
export function FileMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-br from-brass-soft via-sand to-sea-soft opacity-80 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_30px_80px_-30px_rgba(11,27,43,0.35)]">
        <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-3">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <span className="font-mono">ENS-2026-0014</span>
            <span>·</span>
            <span>Sale · Seller&apos;s broker</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-bad/20 bg-bad-soft px-2 py-0.5 text-[11.5px] font-medium text-bad">
            <span className="size-1.5 rounded-full bg-bad" /> High risk · EDD
          </span>
        </div>
        <div className="px-5 pb-5 pt-4">
          <p className="font-serif text-[26px] leading-tight">M/Y AURELIA</p>
          <p className="text-[13px] text-muted">52m Benetti (2019) · €38,500,000 · non-commercial use</p>

          <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Ownership chain</p>
            <div className="mt-2 space-y-1.5 text-[13px]">
              <Row icon={<Landmark className="size-3.5" />} name="Lumen Maritime Holdings Ltd" meta="British Virgin Islands · buyer" flag="FATF grey · EU high-risk" />
              <div className="ml-3 border-l border-dashed border-line-strong pl-3">
                <Row icon={<Landmark className="size-3.5" />} name="Northgate Family Trust" meta="Jersey · trust" />
                <div className="ml-3 border-l border-dashed border-line-strong pl-3">
                  <Row icon={<User className="size-3.5" />} name="Aleksander Varga — 70%" meta="Resident in Monaco" flag="EU high-risk" />
                  <Row icon={<User className="size-3.5" />} name="Natalia Varga — 30%" meta="Resident in Monaco" />
                </div>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-[13px]">
            <Step done label="Client KYC received via secure link" meta="Maître H. Duval · 14 documents" />
            <Step done label="11 parties screened — sanctions & PEP" meta="No-match evidence stored" />
            <Step warn label="1 potential match to review" meta="Representative · name similarity 94%" />
            <Step label="Senior-management approval" meta="Required: EU high-risk third country" />
            <Step label="Article 74 threshold report" meta="Required: watercraft ≥ €7.5m" />
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-ink px-4 py-3 text-white">
            <span className="flex items-center gap-2 text-[13px]">
              <FileText className="size-4 text-[#d9c49a]" /> Audit-ready AML file
            </span>
            <span className="flex items-center gap-1 text-[12px] text-white/70">
              <ShieldCheck className="size-3.5" /> retained 5 years
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, name, meta, flag }: { icon: React.ReactNode; name: string; meta: string; flag?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-0.5">
      <span className="text-muted">{icon}</span>
      <span className="font-medium">{name}</span>
      <span className="text-[12px] text-muted">{meta}</span>
      {flag ? <span className="rounded-full bg-warn-soft px-1.5 text-[10.5px] font-medium text-warn">{flag}</span> : null}
    </div>
  );
}

function Step({ label, meta, done, warn }: { label: string; meta: string; done?: boolean; warn?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
          done ? "border-ok/30 bg-ok-soft text-ok" : warn ? "border-warn/30 bg-warn-soft text-warn" : "border-line-strong bg-white text-faint"
        }`}
      >
        {done ? <Check className="size-3" /> : warn ? <CircleAlert className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-[12px] text-muted">{meta}</span>
      </span>
    </li>
  );
}
