import type { Metadata } from "next";
import { Legal } from "@/components/marketing/legal";

export const metadata: Metadata = {
  title: "Security",
  description: "How Ensign protects UHNW client data: AES-256-GCM document encryption, hashed session and link tokens, audit logging, expiring client links and EU hosting.",
  alternates: { canonical: "/security" },
};

export default function Security() {
  return (
    <Legal title="Security" updated="7 October 2026">
      <p>Your clients are among the most private people in the world. The product is built on that assumption.</p>
      <h2>Data protection</h2>
      <ul>
        <li>Every uploaded document is encrypted at rest with AES-256-GCM and fingerprinted with SHA-256; file types are verified from their contents, not their names.</li>
        <li>Passwords are hashed with scrypt. Session, invitation and client-link tokens are random 256-bit values stored only as SHA-256 hashes.</li>
        <li>All traffic is served over TLS with HSTS, a strict Content-Security-Policy and anti-framing headers.</li>
      </ul>
      <h2>Client links</h2>
      <ul>
        <li>Single-use, expiring after 14 days, revocable at any time.</li>
        <li>They reveal only your firm name and the deal reference — never the asset, price or other parties.</li>
      </ul>
      <h2>Access and audit</h2>
      <ul>
        <li>Every view, upload, download, screening, decision and export is written to an audit trail with the actor, time and IP address.</li>
        <li>Data is isolated per firm; every query is scoped to your organisation.</li>
        <li>Rate limits protect sign-in, password reset, client submissions and screening.</li>
      </ul>
      <h2>Roadmap</h2>
      <p>EU object storage with customer-managed keys, SSO, IP allow-listing and an independent penetration test before general availability.</p>
      <p>Report a vulnerability: security@ensign.example.</p>
    </Legal>
  );
}
