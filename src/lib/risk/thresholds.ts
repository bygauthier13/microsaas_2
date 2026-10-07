/** AMLR Annex IV / Article 74 thresholds for high-value goods (EUR). */
export const ASSET_TYPES = {
  watercraft: { label: "Yacht / watercraft", short: "Yacht", threshold: 7_500_000 },
  aircraft: { label: "Private aircraft", short: "Aircraft", threshold: 7_500_000 },
  motor_vehicle: { label: "Motor vehicle", short: "Car", threshold: 250_000 },
} as const;

export type AssetType = keyof typeof ASSET_TYPES;

/** Indicative FX to EUR (not live). The deal form shows the EUR value it used. */
export const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.86,
  GBP: 1.16,
  CHF: 1.07,
  AED: 0.234,
  SGD: 0.665,
  HKD: 0.11,
};
export const CURRENCIES = Object.keys(FX_TO_EUR);

export function toEur(amount: number | null | undefined, currency: string): number | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const rate = FX_TO_EUR[currency];
  if (!rate) return null;
  return Math.round(amount * rate);
}

export type Article74Assessment = {
  applies: boolean;
  threshold: number;
  reason: string;
  nearThreshold: boolean;
};

/**
 * AMLR Art. 74(1): persons trading in high-value goods report to the FIU ALL sales of
 * motor vehicles ≥ €250k and watercraft/aircraft ≥ €7.5m acquired for non-commercial
 * purposes — with or without suspicion. Recital 20: includes sales to legal entities
 * set up to administer the wealth of their beneficial owner.
 */
export function assessArticle74(input: {
  assetType: string;
  transactionType: string;
  useType: string;
  priceEur: number | null;
}): Article74Assessment {
  const asset = ASSET_TYPES[input.assetType as AssetType];
  const threshold = asset?.threshold ?? Infinity;
  const price = input.priceEur ?? 0;
  const nearThreshold = price > 0 && price >= threshold * 0.9 && price < threshold;
  if (!asset) return { applies: false, threshold, reason: "Unknown asset type", nearThreshold };
  if (input.transactionType === "charter") {
    return {
      applies: false,
      threshold,
      reason: "Article 74 covers sales. Charters/leases may still be in scope of national law (e.g. France, Loi 2025-532).",
      nearThreshold: false,
    };
  }
  if (input.useType === "commercial") {
    return {
      applies: false,
      threshold,
      reason: "Acquired solely for commercial purposes — outside Article 74 (keep evidence of the commercial use).",
      nearThreshold,
    };
  }
  if (price >= threshold) {
    return {
      applies: true,
      threshold,
      reason: `${asset.short} sale ≥ €${threshold.toLocaleString("en-GB")} for non-commercial use — report to the FIU regardless of suspicion.`,
      nearThreshold: false,
    };
  }
  return {
    applies: false,
    threshold,
    reason: `Below the €${threshold.toLocaleString("en-GB")} threshold${nearThreshold ? " (within 10% — confirm the EUR value at transaction date and watch linked transactions)" : ""}.`,
    nearThreshold,
  };
}
