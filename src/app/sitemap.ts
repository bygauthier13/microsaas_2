import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  const pages: [string, number][] = [
    ["/", 1],
    ["/pricing", 0.9],
    ["/demo", 0.8],
    ["/amlr-readiness", 0.8],
    ["/aml-for-yacht-brokers", 0.9],
    ["/amlr-article-74-threshold-reporting", 0.9],
    ["/aml-for-aircraft-dealers", 0.7],
    ["/aml-for-luxury-car-dealers", 0.7],
    ["/security", 0.5],
    ["/privacy", 0.3],
    ["/terms", 0.3],
  ];
  return pages.map(([path, priority]) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "weekly", priority }));
}
