import type { Metadata } from "next";
import { Legal } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "Privacy notice", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <Legal title="Privacy notice" updated="7 October 2026">
      <p><em>Template — have counsel review before launch.</em></p>
      <h2>Two roles</h2>
      <p>
        For your account data (name, email, firm, billing), Ensign is the <strong>controller</strong>. For the customer due-diligence data your firm collects in Ensign —
        buyers, beneficial owners, documents, screening results — your firm is the controller and Ensign is your <strong>processor</strong>, acting only on your
        instructions under a data-processing agreement (Art. 28 GDPR).
      </p>
      <h2>Legal basis</h2>
      <p>
        Your firm processes CDD data to comply with legal obligations under Regulation (EU) 2024/1624 and national AML law (Art. 6(1)(c) GDPR, and Art. 76 AMLR for
        processing personal data for AML purposes). Account data is processed to perform our contract with you.
      </p>
      <h2>Retention</h2>
      <p>CDD records are retained for five years after the end of the relationship or transaction, as AMLR Art. 77 requires, then deleted unless your firm instructs otherwise.</p>
      <h2>Sub-processors</h2>
      <ul>
        <li>Hosting and database (EU region).</li>
        <li>OpenSanctions (screening queries: names, dates of birth, countries).</li>
        <li>Stripe (billing for subscribers), Resend (transactional email), PostHog EU (product analytics, no CDD data).</li>
      </ul>
      <h2>Security</h2>
      <p>Documents are encrypted at rest with AES-256-GCM; access is logged. See the Security page.</p>
      <h2>Your rights</h2>
      <p>Contact privacy@ensign.example. If your data was submitted by a broker, contact that broker as controller.</p>
    </Legal>
  );
}
