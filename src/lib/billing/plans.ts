export type PlanId = "starter" | "brokerage" | "fleet";
export type Interval = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number | null; // EUR
  yearly: number | null; // EUR (2 months free)
  seats: number | null;
  activeDeals: number | null;
  monitoredParties: number | null;
  features: string[];
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For an independent broker or boutique dealer.",
    monthly: 190,
    yearly: 1900,
    seats: 1,
    activeDeals: 10,
    monitoredParties: 50,
    features: [
      "10 active deal files",
      "Discreet client KYC links",
      "Sanctions & PEP screening of every party",
      "High-value-goods risk scoring",
      "Audit-ready AML file export",
      "Daily monitoring of 50 parties",
    ],
  },
  {
    id: "brokerage",
    name: "Brokerage",
    tagline: "For brokerages, yard sales teams and dealers.",
    monthly: 490,
    yearly: 4900,
    seats: 5,
    activeDeals: null,
    monitoredParties: 500,
    highlighted: true,
    features: [
      "Unlimited deal files",
      "5 team seats with approval roles",
      "Article 74 threshold report packs",
      "Senior-management approval trail",
      "Daily monitoring of 500 parties",
      "Priority support from a compliance specialist",
    ],
  },
  {
    id: "fleet",
    name: "Fleet",
    tagline: "For multi-office groups and shipyards.",
    monthly: null,
    yearly: null,
    seats: null,
    activeDeals: null,
    monitoredParties: null,
    features: ["Everything in Brokerage", "Unlimited seats & offices", "SSO and API access", "Custom risk model & lists", "Dedicated onboarding"],
  },
];

export const TRIAL_DAYS = 14;

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planLimits(planId: string) {
  // Trials get Brokerage limits so buyers experience the full product.
  const plan = getPlan(planId === "trial" ? "brokerage" : planId) ?? PLANS[1];
  return { seats: plan.seats, activeDeals: plan.activeDeals, monitoredParties: plan.monitoredParties };
}
