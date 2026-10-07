import type { Metadata } from "next";
import Link from "next/link";
import { Guide } from "@/components/marketing/guide";

export const metadata: Metadata = {
  title: "AMLR Article 74: threshold reporting for yachts, aircraft and cars",
  description:
    "From 10 July 2027, traders must report to their FIU every sale of a motor vehicle ≥ €250,000 or a yacht or aircraft ≥ €7.5m for non-commercial use — with or without suspicion. What's in scope and what to report.",
  alternates: { canonical: "/amlr-article-74-threshold-reporting" },
};

export default function Article74Guide() {
  return (
    <Guide
      eyebrow="Guide · Article 74"
      title="Article 74: reporting every high-value sale, suspicious or not"
      lead="The most unusual obligation in the new EU AML Regulation is not about suspicion at all. It asks dealers to tell the Financial Intelligence Unit about every qualifying sale."
      updated="October 2026"
    >
      <h2>The rule</h2>
      <blockquote>
        &ldquo;Persons trading in high-value goods shall report to the FIU all transactions involving the sale of the following high-value goods when those goods are acquired
        for non-commercial purposes: (a) motor vehicles for a price of at least EUR 250 000 …; (b) watercraft for a price of at least EUR 7 500 000 …; (c) aircraft for a
        price of at least EUR 7 500 000 …&rdquo; — Regulation (EU) 2024/1624, Article 74(1)
      </blockquote>
      <p>
        Credit and financial institutions involved in the purchase must report the same transactions (Art. 74(2)), and reports are made within the deadlines your FIU sets
        (Art. 74(3)). The obligation applies from 10 July 2027.
      </p>

      <h2>When it applies</h2>
      <ul>
        <li>
          <strong>A sale</strong> — charters are outside Article 74, though national law may still apply (France covers yacht leasing).
        </li>
        <li>
          <strong>At or above the threshold</strong>, converted to EUR at the transaction date. Watch linked transactions and prices just below.
        </li>
        <li>
          <strong>For non-commercial purposes.</strong> Recital 20 is explicit: private use is not limited to natural persons; it includes sales to companies and
          arrangements &ldquo;set up to administer the wealth of their beneficial owner&rdquo; — i.e. the classic yacht-owning SPV.
        </li>
      </ul>

      <h2>What to report</h2>
      <p>FIUs have not yet published a harmonised schema. In practice the report needs:</p>
      <ul>
        <li>The reporting entity and its compliance officer.</li>
        <li>The goods: category, description, builder or make, year, identifiers (IMO/HIN, MSN/registration, VIN), flag or registry.</li>
        <li>The transaction: date, price and currency, payment method and accounts, whether a third party paid.</li>
        <li>The customer, its beneficial owners, intermediate entities, representatives and payers.</li>
        <li>The due diligence applied and its outcome.</li>
      </ul>
      <p>
        Many FIUs collect reports through goAML portals — France uses TRACFIN&apos;s systems, Italy the UIF, Spain SEPBLAC. Keep the acknowledgement reference with the
        deal file.
      </p>

      <h2>Industry concerns</h2>
      <p>
        At a March 2026 meeting in Rome with the Bank of Italy&apos;s FIU, the Italian yachting industry worried that objective reporting could affect client relations,
        and asked for the sector to be classed as low risk. Whatever the outcome, the report itself is not optional — and buyers will expect brokers to handle it
        discreetly and correctly.
      </p>

      <h2>How Ensign handles it</h2>
      <p>
        Enter the asset, price and intended use when you open a deal. Ensign tells you immediately whether Article 74 applies, collects the data through the client KYC
        link, prepares the report pack (printable and JSON), tracks the due date once the sale completes and stores the FIU reference. <Link href="/demo">See it in the demo</Link>.
      </p>
    </Guide>
  );
}
