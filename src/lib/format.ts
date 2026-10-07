export function money(amount: number | null | undefined, currency = "EUR") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-GB")}`;
  }
}

export function compactMoney(amount: number | null | undefined, currency = "EUR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

export function date(d: Date | string | null | undefined) {
  if (!d) return "—";
  const v = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(v.getTime())) return "—";
  return v.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function dateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const v = typeof d === "string" ? new Date(d) : d;
  return `${v.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} ${v.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
}

export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const AMLR_DATE = new Date("2027-07-10T00:00:00Z");
export function daysUntilAmlr(now = new Date()) {
  return Math.max(0, Math.ceil((AMLR_DATE.getTime() - now.getTime()) / 86_400_000));
}

export const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer (customer)",
  seller: "Seller",
  beneficial_owner: "Beneficial owner",
  intermediate: "Intermediate entity",
  representative: "Representative",
  payer: "Payer",
  director: "Director",
  trustee: "Trustee",
  other: "Other",
};

export const OUR_ROLE_LABELS: Record<string, string> = {
  seller_broker: "Seller's broker",
  buyer_broker: "Buyer's broker",
  central_agent: "Central agent",
  charter_broker: "Charter broker",
  dealer: "Dealer (principal)",
  shipyard: "Shipyard / manufacturer",
};

export const PAYMENT_LABELS: Record<string, string> = {
  unknown: "Not yet known",
  wire: "Bank transfer",
  escrow: "Escrow / stakeholder account",
  crypto: "Crypto-assets",
  cash: "Cash",
  mixed: "Mixed",
};

export const TX_LABELS: Record<string, string> = { sale: "Sale", charter: "Charter / lease", new_build: "New build" };

export const BUSINESS_TYPES: Record<string, string> = {
  yacht_broker: "Yacht brokerage",
  shipyard: "Shipyard / builder",
  aircraft_dealer: "Aircraft dealer or broker",
  car_dealer: "Luxury / collector car dealer",
  auction_house: "Auction house",
  other: "Other high-value goods",
};
