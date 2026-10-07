import type { Metadata } from "next";
import Link from "next/link";
import { Guide } from "@/components/marketing/guide";

export const metadata: Metadata = {
  title: "AML for private aircraft dealers and brokers (EU AMLR 2027)",
  description:
    "Business-jet dealers and brokers become obliged entities under the EU AML Regulation from 10 July 2027 for aircraft ≥ €7.5m: customer due diligence, beneficial owners, PEPs, sanctions and Article 74 reporting.",
  alternates: { canonical: "/aml-for-aircraft-dealers" },
};

export default function AircraftGuide() {
  return (
    <Guide
      eyebrow="Guide · Private aviation"
      title="AML for private aircraft dealers and brokers"
      lead="A €40m business jet is owned by an Isle of Man or Cayman SPV, flown under a foreign registry and paid for through escrow. From July 2027 the EU expects the dealer to know exactly who is behind it."
      updated="October 2026"
    >
      <h2>In scope from 10 July 2027</h2>
      <p>
        The AMLR (Regulation (EU) 2024/1624) treats aircraft priced at <strong>€7.5 million or more</strong> as high-value goods. Persons trading in them as a regular or
        principal activity — dealers and brokers acting as intermediaries — become obliged entities (Art. 3(3)(f)). France has already added private-aircraft dealers to
        its AML perimeter (Loi 2025-532).
      </p>
      <h2>What changes in practice</h2>
      <ul>
        <li>Identify and verify the buying entity and every beneficial owner behind owner trusts and leasing structures.</li>
        <li>Screen principals, owners, payers and operators against sanctions and PEP lists — keep the evidence.</li>
        <li>Document the source of funds; use enhanced due diligence for PEPs, high-risk jurisdictions and unusual payment routes.</li>
        <li>Report every sale for non-commercial use ≥ €7.5m to your FIU under <Link href="/amlr-article-74-threshold-reporting">Article 74</Link>.</li>
        <li>Keep the file for five years and re-screen continuing relationships.</li>
      </ul>
      <h2>Commercial vs. private use</h2>
      <p>
        Article 74 applies to aircraft acquired for non-commercial purposes. Aircraft placed on an air operator certificate for charter may fall outside it — but record the
        evidence of commercial use in the file. Private use of a company-owned aircraft remains non-commercial.
      </p>
      <p>
        Ensign gives aircraft dealers the same deal file it gives yacht brokers: a discreet client link for the buyer&apos;s counsel, screening of the whole chain, a risk
        score with legal references and the report pack. <Link href="/demo">Try the demo</Link> — it includes a PEP-owned Gulfstream.
      </p>
    </Guide>
  );
}
