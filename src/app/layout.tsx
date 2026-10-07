import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/instrument-serif";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Ensign — AML compliance for superyacht, jet and hypercar deals",
    template: "%s · Ensign",
  },
  description:
    "From 10 July 2027 the EU AML Regulation makes yacht brokers, shipyards, aircraft and luxury car dealers obliged entities. Ensign builds the inspection-ready AML file for every deal: client KYC link, sanctions & PEP screening, risk scoring, approvals and Article 74 reports.",
  applicationName: "Ensign",
  keywords: [
    "AML yacht broker",
    "AMLR 2027",
    "Article 74 AMLR",
    "superyacht KYC",
    "yacht broker compliance",
    "high-value goods AML",
    "aircraft dealer AML",
    "luxury car dealer AML",
    "Monaco AML yacht",
  ],
  openGraph: {
    type: "website",
    siteName: "Ensign",
    title: "Ensign — the AML file for every superyacht deal",
    description: "Client KYC link, sanctions & PEP screening, risk scoring, approvals and Article 74 threshold reports for yacht, aircraft and hypercar transactions.",
    url: appUrl,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: "Ensign — the AML file for every superyacht deal" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0b1b2b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
