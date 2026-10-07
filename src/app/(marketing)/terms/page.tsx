import type { Metadata } from "next";
import { Legal } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "Terms of service", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <Legal title="Terms of service" updated="7 October 2026">
      <p><em>Template — have counsel review before launch.</em></p>
      <h2>The service</h2>
      <p>
        Ensign provides software that helps obliged entities organise customer due diligence, screening, risk assessment, approvals and reporting. Ensign does not provide
        legal advice and does not act as your compliance officer. Your firm remains responsible for its decisions and for meeting its legal obligations.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Plans are billed per firm, monthly or yearly, in advance. You can cancel at any time; access continues until the end of the paid period. After cancellation your
        files remain available to view and export so you can meet your record-keeping obligations.
      </p>
      <h2>Acceptable use</h2>
      <p>Use Ensign only for lawful due-diligence purposes and only for data you are entitled to process. Do not upload data you have no lawful basis to hold.</p>
      <h2>Screening data</h2>
      <p>Screening relies on third-party data sources. Results indicate possible matches and require human review; absence of a match is not a guarantee.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, our aggregate liability is limited to the fees paid in the twelve months preceding the claim.</p>
    </Legal>
  );
}
