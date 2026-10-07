import type { Metadata } from "next";
import Link from "next/link";
import { Guide } from "@/components/marketing/guide";

export const metadata: Metadata = {
  title: "AML for yacht brokers: the 2027 guide (EU AMLR, Monaco, France)",
  description:
    "What the EU AML Regulation, Monaco Law 1.362 and France's Loi 2025-532 require from yacht brokers, shipyards and central agents: CDD, beneficial owners, EDD for Monaco & BVI, PEPs, Article 74 reporting and record keeping.",
  alternates: { canonical: "/aml-for-yacht-brokers" },
};

export default function YachtBrokerGuide() {
  return (
    <Guide
      eyebrow="Guide · Yacht brokers & shipyards"
      title="AML for yacht brokers: what changes by July 2027"
      lead="For decades superyacht brokerage sat outside formal anti-money-laundering rules. That ends on 10 July 2027 across the EU — and in Monaco and France it has effectively ended already."
      updated="October 2026"
    >
      <h2>Who is covered</h2>
      <p>
        Regulation (EU) 2024/1624 — the AML Regulation, or AMLR — applies directly in every Member State from <strong>10 July 2027</strong>. Article 3(3)(f) makes
        &ldquo;persons trading, as a regular or principal professional activity, in high-value goods&rdquo; obliged entities. For watercraft, the high-value threshold is{" "}
        <strong>€7.5 million</strong>; for aircraft also €7.5 million; for motor vehicles €250,000. Brokers acting as intermediaries, dealers and shipyards selling to
        private buyers are all in the perimeter.
      </p>
      <ul>
        <li>
          <strong>France</strong> legislated early: Loi n° 2025-532 of 13 June 2025 adds yacht brokers — covering <em>sale and charter</em> — car dealers and private
          aircraft dealers to Article L.561-2 of the Monetary and Financial Code, with a start date set by decree and no later than 10 July 2027.
        </li>
        <li>
          <strong>Monaco</strong> has covered the &ldquo;sale or rental of pleasure boats&rdquo; under Law 1.362 since 2022. Its supervisor, the AMSF, fined a yacht
          brokerage <strong>€50,000 in November 2025</strong> for outdated policies, superficial KYC, insufficient source-of-funds checks on a Bitcoin-funded purchase and
          improper delegation of compliance.
        </li>
      </ul>

      <h2>What you must do on every deal</h2>
      <ol>
        <li>
          <strong>Identify and verify the customer</strong> — the buying entity or individual — and anyone acting on their behalf (AMLR Art. 20 &amp; 22).
        </li>
        <li>
          <strong>Identify the beneficial owners</strong>: the natural persons holding more than 25% or controlling the buyer by other means, through every layer of SPVs,
          trusts and foundations.
        </li>
        <li>
          <strong>Understand the purpose</strong> of the transaction and the <strong>source of funds</strong>; for higher-risk cases, the source of wealth.
        </li>
        <li>
          <strong>Screen</strong> every party for sanctions and politically exposed persons, and keep evidence — including of the results that found nothing.
        </li>
        <li>
          <strong>Apply enhanced due diligence</strong> where required (Art. 34): PEPs (Art. 42), parties connected to high-risk third countries (Art. 29), complex or
          unusual structures, crypto funding.
        </li>
        <li>
          <strong>Report</strong> suspicions to your FIU (Art. 69) — and, from July 2027, <Link href="/amlr-article-74-threshold-reporting">report every qualifying sale under Article 74</Link>{" "}
          whether or not you are suspicious.
        </li>
        <li>
          <strong>Keep records for five years</strong> (Art. 77) and monitor continuing relationships.
        </li>
      </ol>

      <h2>Why Monaco and the BVI change everything</h2>
      <p>
        Since 2025 <strong>Monaco</strong> has been on the EU list of high-risk third countries (and on the FATF grey list since 2024). In January 2026 the EU added the{" "}
        <strong>British Virgin Islands</strong> and Russia. The BVI has been on the FATF grey list since June 2025. A typical superyacht structure — a BVI company, owned
        through a trust, by a Monaco resident — therefore triggers enhanced due diligence by default for EU obliged entities. EDD means more information on the customer
        and beneficial owners, on the source of funds and wealth, senior-management approval and enhanced monitoring.
      </p>
      <blockquote>Monaco&apos;s national risk assessment ranked yachting as the principality&apos;s top financial-crime vulnerability, and found that one in eight yachting clients is a politically exposed person.</blockquote>

      <h2>Sanctions: the non-negotiable part</h2>
      <p>
        Screening is not only about AML. EU Regulation 833/2014 (Art. 3h) prohibits selling luxury goods — yachts and high-end cars included — to persons in Russia or for
        use in Russia, with equivalent measures for Belarus. A buyer, beneficial owner or payer on a sanctions list means you must not proceed, and must consider asset-freeze
        and reporting obligations.
      </p>

      <h2>What a good file looks like</h2>
      <p>
        Supervisors don&apos;t fine brokers for having wealthy clients. They fine them for files they cannot defend. A defensible file contains the ownership chain with
        evidence, the screening log, a risk assessment with reasons, the approval and its grounds, the documents and a timestamped audit trail — retrievable for five
        years.
      </p>
      <p>
        That is exactly what <Link href="/">Ensign</Link> produces: you open a deal, send the buyer&apos;s lawyer one secure link, and the file screens and scores itself.{" "}
        <Link href="/demo">Explore the demo workspace</Link> or <Link href="/amlr-readiness">take the 2-minute readiness check</Link>.
      </p>
    </Guide>
  );
}
