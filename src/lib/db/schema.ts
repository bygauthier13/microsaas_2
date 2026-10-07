import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  doublePrecision,
  customType,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** bytea that always surfaces as a Node Buffer (PGlite returns Uint8Array). */
const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType() {
    return "bytea";
  },
  fromDriver(value) {
    return Buffer.isBuffer(value) ? value : Buffer.from(value as Uint8Array);
  },
  toDriver(value) {
    return value;
  },
});

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => ts("created_at").defaultNow().notNull();

export type OrgSettings = {
  /** Days after completion within which the Article 74 report should be filed (FIU deadlines vary). */
  reportDeadlineDays?: number;
  /** Extra ISO-2 country codes the firm treats as high risk (firm-wide risk assessment). */
  extraHighRiskCountries?: string[];
  /** Demo workspaces only: a ready-made client portal link so visitors can see the buyer's view. */
  demoClientLink?: string;
};

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  country: text("country"),
  businessType: text("business_type").notNull().default("yacht_broker"),
  activities: jsonb("activities").$type<string[]>().notNull().default([]),
  registrationNumber: text("registration_number"),
  complianceOfficerName: text("compliance_officer_name"),
  complianceOfficerEmail: text("compliance_officer_email"),
  plan: text("plan").notNull().default("trial"),
  billingInterval: text("billing_interval"),
  subscriptionStatus: text("subscription_status").notNull().default("trialing"),
  trialEndsAt: ts("trial_ends_at"),
  currentPeriodEnd: ts("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  demoExpiresAt: ts("demo_expires_at"),
  onboardedAt: ts("onboarded_at"),
  settings: jsonb("settings").$type<OrgSettings>().notNull().default({}),
  dealCounter: integer("deal_counter").notNull().default(0),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("owner"),
    isDemo: boolean("is_demo").notNull().default(false),
    lastLoginAt: ts("last_login_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email), index("users_org_idx").on(t.orgId)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the random session token; the token itself only lives in the cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    /** SHA-256 of the emailed token. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(), // reset | invite
    expiresAt: ts("expires_at").notNull(),
    usedAt: ts("used_at"),
    createdAt: createdAt(),
  },
  (t) => [index("auth_tokens_user_idx").on(t.userId)],
);

export type AssetDetails = {
  builder?: string;
  model?: string;
  year?: string;
  lengthM?: string;
  flag?: string;
  imo?: string;
  hin?: string;
  registration?: string;
  vin?: string;
  msn?: string;
  notes?: string;
};

export type DealFlags = {
  unusualUrgency?: boolean;
  priceAnomaly?: boolean;
  nomineeOrBearer?: boolean;
  cashComponentEur?: number;
};

export type StoredRiskFactor = {
  code: string;
  label: string;
  points: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
  detail?: string;
  ref?: string;
};

export const deals = pgTable(
  "deals",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    reference: text("reference").notNull(),
    assetType: text("asset_type").notNull(), // watercraft | aircraft | motor_vehicle
    assetName: text("asset_name").notNull(),
    assetDetails: jsonb("asset_details").$type<AssetDetails>().notNull().default({}),
    transactionType: text("transaction_type").notNull().default("sale"), // sale | charter | new_build
    ourRole: text("our_role").notNull().default("seller_broker"),
    useType: text("use_type").notNull().default("non_commercial"),
    priceAmount: bigint("price_amount", { mode: "number" }),
    currency: text("currency").notNull().default("EUR"),
    priceEur: bigint("price_eur", { mode: "number" }),
    paymentMethod: text("payment_method").notNull().default("unknown"),
    thirdPartyPayer: boolean("third_party_payer").notNull().default(false),
    fundsOriginCountry: text("funds_origin_country"),
    expectedClosing: text("expected_closing"),
    flags: jsonb("flags").$type<DealFlags>().notNull().default({}),
    status: text("status").notNull().default("draft"),
    riskScore: integer("risk_score"),
    riskLevel: text("risk_level"),
    ddLevel: text("dd_level"),
    riskFactors: jsonb("risk_factors").$type<StoredRiskFactor[]>().notNull().default([]),
    riskComputedAt: ts("risk_computed_at"),
    decision: text("decision"),
    decisionBy: text("decision_by"),
    decisionByName: text("decision_by_name"),
    decisionAt: ts("decision_at"),
    decisionNote: text("decision_note"),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [index("deals_org_idx").on(t.orgId), uniqueIndex("deals_org_ref_idx").on(t.orgId, t.reference)],
);

export const parties = pgTable(
  "parties",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // buyer | seller | beneficial_owner | representative | payer | director | trustee | other
    kind: text("kind").notNull(), // person | entity
    parentPartyId: text("parent_party_id"),
    ownershipPct: doublePrecision("ownership_pct"),
    controlType: text("control_type"),
    fullName: text("full_name").notNull(),
    dateOfBirth: text("date_of_birth"),
    nationality: text("nationality"),
    residenceCountry: text("residence_country"),
    address: text("address"),
    idDocType: text("id_doc_type"),
    idDocNumber: text("id_doc_number"),
    idDocExpiry: text("id_doc_expiry"),
    registrationNumber: text("registration_number"),
    jurisdiction: text("jurisdiction"),
    entityType: text("entity_type"),
    pepStatus: text("pep_status").notNull().default("none"), // none | declared | confirmed
    pepDetails: text("pep_details"),
    sourceOfFunds: text("source_of_funds"),
    sourceOfWealth: text("source_of_wealth"),
    email: text("email"),
    source: text("source").notNull().default("broker"), // broker | client_portal | demo
    monitored: boolean("monitored").notNull().default(true),
    screeningStatus: text("screening_status").notNull().default("not_screened"),
    lastScreenedAt: ts("last_screened_at"),
    createdAt: createdAt(),
  },
  (t) => [index("parties_deal_idx").on(t.dealId), index("parties_org_idx").on(t.orgId)],
);

export type KycSubmission = Record<string, unknown>;

export const kycRequests = pgTable(
  "kyc_requests",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email"),
    message: text("message"),
    status: text("status").notNull().default("sent"),
    expiresAt: ts("expires_at").notNull(),
    openedAt: ts("opened_at"),
    submittedAt: ts("submitted_at"),
    createdBy: text("created_by"),
    submission: jsonb("submission").$type<KycSubmission>(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("kyc_token_idx").on(t.tokenHash), index("kyc_deal_idx").on(t.dealId)],
);

export const documents = pgTable(
  "documents",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    partyId: text("party_id"),
    category: text("category").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    /** AES-256-GCM: iv(12) | tag(16) | ciphertext */
    content: bytea("content").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    verifiedBy: text("verified_by"),
    verifiedAt: ts("verified_at"),
    createdAt: createdAt(),
  },
  (t) => [index("documents_deal_idx").on(t.dealId)],
);

export type ScreeningMatch = {
  id: string;
  name: string;
  score: number;
  schema: string;
  datasets: string[];
  topics: string[];
  birthDate?: string;
  countries?: string[];
  url?: string;
  explanation?: string;
};

export const screenings = pgTable(
  "screenings",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    runType: text("run_type").notNull().default("initial"), // initial | manual | monitoring
    query: jsonb("query").$type<Record<string, unknown>>().notNull().default({}),
    datasets: jsonb("datasets").$type<string[]>().notNull().default([]),
    matches: jsonb("matches").$type<ScreeningMatch[]>().notNull().default([]),
    status: text("status").notNull(), // clear | potential_match | error
    error: text("error"),
    resolution: text("resolution"), // false_positive | true_match
    resolutionNote: text("resolution_note"),
    resolvedBy: text("resolved_by"),
    resolvedAt: ts("resolved_at"),
    createdAt: createdAt(),
  },
  (t) => [index("screenings_party_idx").on(t.partyId), index("screenings_deal_idx").on(t.dealId)],
);

export const thresholdReports = pgTable(
  "threshold_reports",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("required"), // required | prepared | submitted
    fiu: text("fiu"),
    dueDate: text("due_date"),
    preparedAt: ts("prepared_at"),
    submittedAt: ts("submitted_at"),
    submissionRef: text("submission_ref"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("threshold_reports_deal_idx").on(t.dealId)],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id"),
    actorType: text("actor_type").notNull(), // user | client | system
    actorId: text("actor_id"),
    actorLabel: text("actor_label").notNull(),
    action: text("action").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_org_idx").on(t.orgId), index("audit_deal_idx").on(t.dealId)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: id(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dealId: text("deal_id"),
    partyId: text("party_id"),
    type: text("type").notNull(),
    severity: text("severity").notNull().default("info"),
    title: text("title").notNull(),
    body: text("body"),
    readAt: ts("read_at"),
    createdAt: createdAt(),
  },
  (t) => [index("alerts_org_idx").on(t.orgId)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: id(),
    orgId: text("org_id"),
    userId: text("user_id"),
    name: text("name").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("analytics_name_idx").on(t.name)],
);

export const emails = pgTable("emails", {
  id: id(),
  orgId: text("org_id"),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  text: text("text").notNull(),
  provider: text("provider").notNull(),
  providerId: text("provider_id"),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: createdAt(),
});

export const leads = pgTable("leads", {
  id: id(),
  email: text("email"),
  company: text("company"),
  businessType: text("business_type"),
  score: integer("score").notNull(),
  answers: jsonb("answers").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
});

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Party = typeof parties.$inferSelect;
export type KycRequest = typeof kycRequests.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type Screening = typeof screenings.$inferSelect;
export type ThresholdReport = typeof thresholdReports.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
