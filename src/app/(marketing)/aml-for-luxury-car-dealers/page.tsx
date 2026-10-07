import type { Metadata } from "next";
import Link from "next/link";
import { Guide } from "@/components/marketing/guide";

export const metadata: Metadata = {
  title: "AML for luxury & collector car dealers (EU AMLR, €250k threshold)",
  description:
    "Hypercar and collector-car dealers selling vehicles ≥ €250,000 become full obliged entities under the EU AML Regulation from July 2027 — CDD, sanctions, the €10k cash cap and Article 74 reports.",
  alternates: { canonical: "/aml-for-luxury-car-dealers" },
};

export default function CarGuide() {
  return (
    <Guide
      eyebrow="Guide · Hypercars & collector cars"
      title="AML for luxury and collector car dealers"
      lead="Until now most dealers met AML rules only when a buyer paid in cash. From July 2027, selling a car above €250,000 makes you a fully-fledged obliged entity."
      updated="October 2026"
    >
      <h2>The €250,000 line</h2>
      <p>
        Under the AMLR, motor vehicles priced at <strong>€250,000 or more</strong> are high-value goods. Dealers trading in them as a regular activity — franchise
        hypercar dealers, collector-car specialists, and the intermediaries between them — become obliged entities from 10 July 2027, as do banks financing the purchase.
        In Germany, car dealers have long been obliged entities under the GwG; the AMLR harmonises and deepens what is expected.
      </p>
      <h2>What you need on each sale</h2>
      <ul>
        <li>Customer identification and verification — including the company or collection vehicle that buys.</li>
        <li>Beneficial owners of buying entities; source of funds; purpose of the purchase.</li>
        <li>Sanctions and PEP screening. EU rules also ban selling luxury cars to persons in Russia or Belarus, or for use there.</li>
        <li>No cash above <strong>€10,000</strong> (AMLR Art. 80); treat crypto as high risk and trace it.</li>
        <li>An <Link href="/amlr-article-74-threshold-reporting">Article 74 report</Link> for every qualifying sale for private use.</li>
        <li>Five-year record keeping and ongoing monitoring of repeat clients.</li>
      </ul>
      <h2>Collector-car reality</h2>
      <p>
        Many collector-car sales run through consignments, auctions and brokers, with buyers abroad and payment from third parties. Those are exactly the patterns the risk
        model flags: third-party payers, cross-border funds, urgency and prices out of line with the market.
      </p>
      <p>
        Ensign handles this per car: open a file, send the client a secure link, and get a scored, evidenced file — plus the Article 74 report. <Link href="/demo">See a
        crypto-funded hypercar deal in the demo</Link>.
      </p>
    </Guide>
  );
}
