/** A value counts as configured only if it is non-empty and not a placeholder. */
export function isConfigured(value: string | undefined | null): value is string {
  if (!value) return false;
  const v = value.trim();
  return v.length > 0 && !/^replace[_-]?me/i.test(v) && v !== "changeme";
}

const env = process.env;

export const config = {
  appUrl: (env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  isProduction: env.NODE_ENV === "production",
  isVercelProduction: env.VERCEL_ENV === "production",

  database: {
    url: isConfigured(env.DATABASE_URL) ? env.DATABASE_URL : undefined,
    pgliteDir: env.PGLITE_DIR || "./.data/pglite",
    autoMigrate: env.AUTO_MIGRATE === "true",
  },

  encryptionKey: isConfigured(env.ENCRYPTION_KEY) ? env.ENCRYPTION_KEY : undefined,
  cronSecret: isConfigured(env.CRON_SECRET) ? env.CRON_SECRET : undefined,
  adminEmails: (env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  devTools: env.NODE_ENV !== "production" || env.ENABLE_DEV_TOOLS === "true",

  stripe: {
    secretKey: isConfigured(env.STRIPE_SECRET_KEY) ? env.STRIPE_SECRET_KEY : undefined,
    webhookSecret: isConfigured(env.STRIPE_WEBHOOK_SECRET) ? env.STRIPE_WEBHOOK_SECRET : undefined,
    prices: {
      starter_month: isConfigured(env.STRIPE_PRICE_STARTER_MONTHLY) ? env.STRIPE_PRICE_STARTER_MONTHLY : undefined,
      starter_year: isConfigured(env.STRIPE_PRICE_STARTER_YEARLY) ? env.STRIPE_PRICE_STARTER_YEARLY : undefined,
      brokerage_month: isConfigured(env.STRIPE_PRICE_BROKERAGE_MONTHLY) ? env.STRIPE_PRICE_BROKERAGE_MONTHLY : undefined,
      brokerage_year: isConfigured(env.STRIPE_PRICE_BROKERAGE_YEARLY) ? env.STRIPE_PRICE_BROKERAGE_YEARLY : undefined,
    } as Record<string, string | undefined>,
  },

  email: {
    apiKey: isConfigured(env.EMAIL_API_KEY) ? env.EMAIL_API_KEY : undefined,
    from: env.EMAIL_FROM || "Ensign <compliance@ensign.local>",
  },

  openSanctions: {
    apiKey: isConfigured(env.OPENSANCTIONS_API_KEY) ? env.OPENSANCTIONS_API_KEY : undefined,
    dataset: env.OPENSANCTIONS_DATASET || "default",
  },

  posthog: {
    apiKey: isConfigured(env.POSTHOG_API_KEY) ? env.POSTHOG_API_KEY : undefined,
    host: env.POSTHOG_HOST || "https://eu.i.posthog.com",
  },
};

export type IntegrationStatus = { name: string; mode: "live" | "mock"; detail: string };

/** Human-readable integration status, shown to admins in Settings. */
export function integrationStatus(): IntegrationStatus[] {
  return [
    {
      name: "Database",
      mode: config.database.url ? "live" : "mock",
      detail: config.database.url ? "Postgres (DATABASE_URL)" : `Embedded PGlite at ${config.database.pgliteDir}`,
    },
    {
      name: "Billing",
      mode: config.stripe.secretKey ? "live" : "mock",
      detail: config.stripe.secretKey
        ? config.stripe.secretKey.startsWith("sk_test")
          ? "Stripe (test mode)"
          : "Stripe (live)"
        : "Simulated checkout — no charges",
    },
    {
      name: "Email",
      mode: config.email.apiKey ? "live" : "mock",
      detail: config.email.apiKey ? "Resend" : "Outbox table + server console",
    },
    {
      name: "Screening",
      mode: config.openSanctions.apiKey ? "live" : "mock",
      detail: config.openSanctions.apiKey
        ? `OpenSanctions (${config.openSanctions.dataset})`
        : "Fictional demo watchlist — NOT real sanctions data",
    },
    {
      name: "Document encryption",
      mode: config.encryptionKey ? "live" : "mock",
      detail: config.encryptionKey ? "AES-256-GCM with ENCRYPTION_KEY" : "Development key — set ENCRYPTION_KEY before production",
    },
  ];
}
