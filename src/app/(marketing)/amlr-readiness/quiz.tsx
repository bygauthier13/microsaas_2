"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, HelpCircle } from "lucide-react";
import { saveReadinessAction } from "@/app/actions/public";
import { Button, Field, FormError, Input, LinkButton, Notice, Select, cn } from "@/components/ui";

const QUESTIONS = [
  { id: "risk_assessment", q: "Do you have a documented, business-wide AML risk assessment?", fix: "Required for every obliged entity. Monaco's AMSF fined firms in 2025 specifically for not having one." },
  { id: "ubo", q: "Do you identify and verify every beneficial owner (>25% or control) behind buyer SPVs and trusts?", fix: "Collect the full chain — SPV, trust, settlor, beneficiaries — from the buyer's representative and keep the evidence." },
  { id: "screening", q: "Do you screen buyers, beneficial owners and payers against sanctions and PEP lists — and keep evidence of every no-match?", fix: "Undocumented screening counts for nothing in an inspection. Store each result with a timestamp." },
  { id: "funds", q: "Do you obtain and document source of funds and source of wealth on every qualifying deal?", fix: "A bank or lawyer's letter for the funds, and a corroborated narrative for the wealth — especially for crypto." },
  { id: "edd", q: "Do you apply enhanced due diligence when a party is in Monaco, the BVI or another listed high-risk country?", fix: "Monaco and the BVI are on the EU high-risk list and the FATF grey list — EDD is mandatory when they are involved." },
  { id: "pep_approval", q: "Does senior management approve PEP and high-risk deals, with recorded grounds?", fix: "AMLR Art. 42 requires senior-management approval, source of wealth and enhanced monitoring for PEPs." },
  { id: "art74", q: "Do you have a process to report qualifying sales to your FIU under Article 74?", fix: "From July 2027 every sale ≥ €7.5m (yachts, aircraft) or ≥ €250k (cars) for private use must be reported — even without suspicion." },
  { id: "cash", q: "Do you refuse cash above €10,000 and treat crypto funding as high risk?", fix: "The AMLR caps cash payments at €10,000 EU-wide; crypto needs on-chain source-of-funds tracing." },
  { id: "monitoring", q: "Do you re-screen past buyers and owners when sanctions lists change?", fix: "Ongoing monitoring of business relationships is required; daily automated re-screening is the practical answer." },
  { id: "retrieval", q: "Could you produce a complete AML file for any deal of the last five years within 24 hours?", fix: "Records must be kept for five years and produced on request (AMLR Art. 77–78)." },
];

type Answer = "yes" | "no" | "unsure";

export function ReadinessQuiz() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [businessType, setBusinessType] = useState("yacht_broker");
  const [showResult, setShowResult] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const answered = Object.keys(answers).length;
  const score = Math.round((QUESTIONS.filter((q) => answers[q.id] === "yes").length / QUESTIONS.length) * 100);
  const gaps = QUESTIONS.filter((q) => answers[q.id] !== "yes");
  const tier = score >= 80 ? { label: "Well prepared", tone: "ok" as const } : score >= 50 ? { label: "Partially ready", tone: "warn" as const } : { label: "Exposed", tone: "bad" as const };

  const save = (withEmail: boolean) =>
    start(async () => {
      const res = await saveReadinessAction({ email: withEmail ? email : undefined, company: withEmail ? company : undefined, businessType, score, answers: { ...answers } });
      if (res.error) setError(res.error);
      else if (withEmail) setSaved(true);
    });

  if (showResult) {
    return (
      <div className="mt-10 space-y-6">
        <div className="rounded-2xl border border-line bg-white p-8">
          <p className="text-[13px] text-muted">Your readiness score</p>
          <p className="mt-2 font-serif text-[72px] leading-none num">{score}%</p>
          <p className={cn("mt-2 text-[16px] font-semibold", tier.tone === "ok" ? "text-ok" : tier.tone === "warn" ? "text-warn" : "text-bad")}>{tier.label}</p>
          <p className="mt-3 text-[14.5px] text-ink-2">
            {gaps.length === 0
              ? "Impressive. Make sure your evidence is as good as your process — inspectors read files, not policies."
              : `${gaps.length} gap${gaps.length > 1 ? "s" : ""} to close before 10 July 2027.`}
          </p>
        </div>
        {gaps.length ? (
          <div className="rounded-2xl border border-line bg-white">
            <p className="border-b border-line px-6 py-4 text-[15px] font-semibold">What to fix</p>
            <ul className="divide-y divide-line">
              {gaps.map((g) => (
                <li key={g.id} className="px-6 py-4">
                  <p className="flex items-start gap-2 text-[14px] font-medium">
                    {answers[g.id] === "no" ? <CircleX className="mt-0.5 size-4 shrink-0 text-bad" /> : <HelpCircle className="mt-0.5 size-4 shrink-0 text-warn" />}
                    {g.q}
                  </p>
                  <p className="ml-6 mt-1 text-[13.5px] text-ink-2">{g.fix}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="rounded-2xl bg-ink p-8 text-white">
          <p className="font-serif text-[30px] leading-tight">Ensign closes {Math.max(1, gaps.length - 1)} of these gaps on your next deal.</p>
          <p className="mt-2 text-[14px] text-white/70">Client KYC link, screening with stored evidence, EDD triggers, senior approval, Article 74 report and 5-year retention.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/signup" variant="brass" size="lg">
              Start 14-day trial
            </LinkButton>
            <LinkButton href="/demo" variant="secondary" size="lg">
              See the demo
            </LinkButton>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6">
          {saved ? (
            <Notice tone="ok">Thanks — we&apos;ll send your gap list and the AMLR checklist for {company || "your firm"}.</Notice>
          ) : (
            <>
              <p className="text-[15px] font-semibold">Email me this gap list and the AMLR checklist</p>
              <FormError message={error} />
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field label="Work email" htmlFor="lead-email">
                  <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Firm" htmlFor="lead-company">
                  <Input id="lead-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </Field>
                <Button disabled={pending || !email} onClick={() => save(true)}>
                  Send it
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-muted">One email with the checklist. No newsletter unless you ask.</p>
            </>
          )}
        </div>
        <p className="text-center text-[13px]">
          <button type="button" className="text-muted underline underline-offset-4" onClick={() => setShowResult(false)}>
            Change my answers
          </button>
          {" · "}
          <Link href="/aml-for-yacht-brokers" className="text-muted underline underline-offset-4">
            Read the AML guide for yacht brokers
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-4">
      <Field label="Your business" htmlFor="bt">
        <Select id="bt" value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="max-w-sm">
          <option value="yacht_broker">Yacht brokerage</option>
          <option value="shipyard">Shipyard</option>
          <option value="aircraft_dealer">Aircraft dealer / broker</option>
          <option value="car_dealer">Luxury / collector car dealer</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <ol className="space-y-3">
        {QUESTIONS.map((q, i) => (
          <li key={q.id} className="rounded-xl border border-line bg-white p-5">
            <p className="text-[14.5px] font-medium">
              <span className="mr-2 font-mono text-[12px] text-brass">{String(i + 1).padStart(2, "0")}</span>
              {q.q}
            </p>
            <div role="radiogroup" aria-label={q.q} className="mt-3 flex flex-wrap gap-2">
              {(["yes", "no", "unsure"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.id] === a}
                  onClick={() => setAnswers({ ...answers, [q.id]: a })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-medium capitalize",
                    answers[q.id] === a ? (a === "yes" ? "border-ok bg-ok text-white" : a === "no" ? "border-bad bg-bad text-white" : "border-warn bg-warn text-white") : "border-line-strong bg-white text-ink-2 hover:border-ink/40",
                  )}
                >
                  {a === "yes" ? <CircleCheck className="size-3.5" /> : null}
                  {a === "unsure" ? "Not sure" : a}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-[13px] text-muted">
          {answered} of {QUESTIONS.length} answered
        </p>
        <Button
          size="lg"
          disabled={answered < QUESTIONS.length}
          onClick={() => {
            setShowResult(true);
            save(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          See my result
        </Button>
      </div>
    </div>
  );
}
