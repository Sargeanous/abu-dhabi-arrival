import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).default("");

export const HELP_OPTIONS = [
  "Movers & shipping",
  "Furniture & mattress",
  "Kitchen & essentials",
  "Cleaning",
  "Internet & utilities",
  "Handyman / installation",
  "Insurance",
  "Storage",
  "Pet relocation (optional)",
  "Family & school search (optional)",
] as const;

export type HelpOption = (typeof HELP_OPTIONS)[number];

const isHelpOption = (value: string): value is HelpOption =>
  (HELP_OPTIONS as readonly string[]).includes(value);

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email.").max(160),
  whatsapp: optionalText(80),
  origin: optionalText(120),
  destination: z.string().trim().min(2, "Please enter your destination.").max(120),
  moveDate: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Move date must use YYYY-MM-DD.",
    })
    .default(""),
  household: optionalText(40),
  status: optionalText(40),
  pet: z.string().trim().max(40).default("no"),
  help: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  message: optionalText(2000),
});

export const marketplaceQuerySchema = z.object({
  destination: z.string().trim().max(120).default("Abu Dhabi"),
  category: z.string().trim().max(80).optional(),
});

export const integrationStatusSchema = z.enum([
  "mock",
  "manual",
  "csv",
  "api-needed",
  "api-connected",
  "partner-ready",
]);

export const prioritySchema = z.enum(["high", "medium", "low"]);
export const leadMethodSchema = z.enum(["email", "whatsapp", "api", "manual"]);
export const commercialModelSchema = z.enum([
  "commission",
  "referral",
  "markup",
  "subscription",
  "none",
  "unknown",
]);
export const catalogItemTypeSchema = z.enum(["product", "service"]);
export const catalogSourceSchema = z.enum(["seed", "manual", "csv", "api"]);
export const checkoutMethodSchema = z.enum([
  "lead",
  "affiliate-link",
  "checkout",
  "booking",
  "manual",
]);
export const productIconSchema = z.enum(["sofa", "boxes", "wifi", "shopping"]);
export const serviceIconSchema = z.enum([
  "truck",
  "sparkles",
  "wifi",
  "wrench",
  "shield",
  "building",
  "paw",
]);

export const marketplaceProductSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  retailer: z.string(),
  providerKey: z.string(),
  price: z.string(),
  rating: z.number(),
  swatch: z.string(),
  icon: productIconSchema,
  availability: z.string(),
  deliveryWindow: z.string(),
});

export const marketplaceServiceSchema = z.object({
  id: z.string(),
  icon: serviceIconSchema,
  category: z.string(),
  body: z.string(),
  providers: z.string(),
  leadTime: z.string(),
  providerKeys: z.array(z.string()),
});

export const providerConnectorSchema = z.object({
  key: z.string(),
  name: z.string(),
  category: z.string(),
  integrationStatus: integrationStatusSchema,
  nextStep: z.string(),
});

export const providerRecordSchema = z.object({
  key: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  website: z.string().trim().url().or(z.literal("")).default(""),
  coverageCities: z.array(z.string().trim().min(1).max(120)).default(["Abu Dhabi"]),
  contactName: z.string().trim().max(120).default(""),
  contactEmail: z.string().trim().email().or(z.literal("")).default(""),
  contactPhone: z.string().trim().max(80).default(""),
  leadMethod: leadMethodSchema.default("manual"),
  commercialModel: commercialModelSchema.default("unknown"),
  integrationStatus: integrationStatusSchema.default("manual"),
  nextStep: z.string().trim().max(300).default("Confirm operating model and catalog source."),
  priority: prioritySchema.default("medium"),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const providerUpsertSchema = providerRecordSchema
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    key: z.string().trim().min(2).max(80).optional(),
  });

export const catalogItemRecordSchema = z.object({
  id: z.string().trim().min(2).max(120),
  providerKey: z.string().trim().min(2).max(80),
  type: catalogItemTypeSchema,
  category: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(800).default(""),
  price: z.string().trim().max(80).default("Quote required"),
  currency: z.string().trim().max(12).default("AED"),
  unit: z.string().trim().max(80).default(""),
  city: z.string().trim().max(120).default("Abu Dhabi"),
  availability: z.string().trim().max(120).default("On request"),
  deliveryWindow: z.string().trim().max(120).default("To be confirmed"),
  rating: z.number().min(0).max(5).default(4.5),
  active: z.boolean().default(true),
  source: catalogSourceSchema.default("manual"),
  checkoutMethod: checkoutMethodSchema.default("lead"),
  checkoutUrl: z.string().trim().url().or(z.literal("")).default(""),
  commissionModel: z.string().trim().max(160).default(""),
  lastSyncedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const catalogItemUpsertSchema = catalogItemRecordSchema
  .omit({ createdAt: true, updatedAt: true, lastSyncedAt: true, source: true })
  .extend({
    id: z.string().trim().min(2).max(120).optional(),
    source: catalogSourceSchema.default("manual"),
  });

export const catalogCsvImportSchema = z.object({
  csv: z.string().trim().min(1),
  defaultProviderKey: z.string().trim().max(80).optional(),
  defaultType: catalogItemTypeSchema.default("product"),
});

export const CATALOG_CSV_FIELDS = [
  "id",
  "providerKey",
  "type",
  "category",
  "name",
  "description",
  "price",
  "currency",
  "unit",
  "city",
  "availability",
  "deliveryWindow",
  "rating",
  "active",
  "checkoutMethod",
  "checkoutUrl",
  "commissionModel",
] as const;

export type CatalogCsvField = (typeof CATALOG_CSV_FIELDS)[number];

// Structured outputs cap union-typed parameters at 16, so "" (not null) means "no mapping".
const headerValue = z.string().catch("");

const csvFieldMapShape = Object.fromEntries(
  CATALOG_CSV_FIELDS.map((field) => [field, headerValue]),
) as Record<CatalogCsvField, typeof headerValue>;

export const catalogCsvMappingSchema = z.object({
  columnMap: z.object(csvFieldMapShape),
  defaults: z.object(csvFieldMapShape),
  notes: z.string().trim().max(600).catch("").default(""),
});

export type CatalogCsvMapping = z.infer<typeof catalogCsvMappingSchema>;

export const catalogCsvMapRequestSchema = z.object({
  csv: z.string().trim().min(1, "Paste CSV text first."),
});

// Supplier intake: free text describing a provider -> one provider + its items.
export const supplierIntakeRequestSchema = z.object({
  text: z.string().trim().min(10, "Describe the supplier first.").max(4000),
});

// AI draft shape (resilient parsing via .catch); coverageCities kept as a
// comma-separated string for easy review-panel editing, split at save time.
export const supplierDraftSchema = z.object({
  provider: z.object({
    name: z.string().trim().max(160).catch(""),
    category: z.string().trim().max(120).catch(""),
    website: z.string().trim().max(300).catch(""),
    coverageCities: z.string().trim().max(300).catch("Abu Dhabi"),
    contactName: z.string().trim().max(120).catch(""),
    contactEmail: z.string().trim().max(160).catch(""),
    contactPhone: z.string().trim().max(80).catch(""),
    leadMethod: leadMethodSchema.catch("manual"),
    commercialModel: commercialModelSchema.catch("unknown"),
    integrationStatus: integrationStatusSchema.catch("manual"),
    priority: prioritySchema.catch("medium"),
    nextStep: z.string().trim().max(300).catch(""),
  }),
  items: z
    .array(
      z.object({
        type: catalogItemTypeSchema.catch("service"),
        category: z.string().trim().max(120).catch(""),
        name: z.string().trim().max(180).catch(""),
        description: z.string().trim().max(800).catch(""),
        price: z.string().trim().max(80).catch("Quote required"),
        unit: z.string().trim().max(80).catch(""),
        availability: z.string().trim().max(120).catch("On request"),
        deliveryWindow: z.string().trim().max(120).catch("To be confirmed"),
        checkoutMethod: checkoutMethodSchema.catch("lead"),
      }),
    )
    .max(20)
    .catch([]),
});

export type SupplierDraft = z.infer<typeof supplierDraftSchema>;

// Finalized (reviewed) save payload: real ProviderUpsert + items minus the
// providerKey, which the server injects from the just-saved provider.
export const supplierSaveSchema = z.object({
  provider: providerUpsertSchema,
  items: z.array(catalogItemUpsertSchema.omit({ providerKey: true })).max(20),
});

export type SupplierSaveInput = z.infer<typeof supplierSaveSchema>;

export type InquiryInput = z.infer<typeof inquirySchema>;
export type MarketplaceQuery = z.infer<typeof marketplaceQuerySchema>;
export type MarketplaceProduct = z.infer<typeof marketplaceProductSchema>;
export type MarketplaceService = z.infer<typeof marketplaceServiceSchema>;
export type ProviderConnector = z.infer<typeof providerConnectorSchema>;
export type ProviderRecord = z.infer<typeof providerRecordSchema>;
export type ProviderUpsert = z.infer<typeof providerUpsertSchema>;
export type CatalogItemRecord = z.infer<typeof catalogItemRecordSchema>;
export type CatalogItemUpsert = z.infer<typeof catalogItemUpsertSchema>;
export type CatalogCsvImport = z.infer<typeof catalogCsvImportSchema>;

export type MovePlanTask = {
  title: string;
  timing: string;
  owner: "SettleSide" | "Customer" | "Provider";
  category: string;
};

export const movePlanTaskSchema = z.object({
  title: z.string().trim().min(3).max(200),
  timing: z.string().trim().min(1).max(80),
  owner: z.enum(["SettleSide", "Customer", "Provider"]),
  category: z.string().trim().min(2).max(80),
});

export const movePlanSchema = z.object({
  summary: z.string().trim().min(3).max(400),
  tasks: z
    .array(movePlanTaskSchema)
    .min(3)
    .transform((tasks) => tasks.slice(0, 12)),
});

export type MovePlan = z.infer<typeof movePlanSchema>;

export const inquiryAdminSummarySchema = z.object({
  headline: z.string().trim().min(3).max(300),
  urgency: z.enum(["low", "medium", "high"]),
  revenueOpportunities: z
    .array(z.string().trim().min(2).max(80))
    .default([])
    .transform((values) => values.slice(0, 8)),
  nextAction: z.string().trim().min(3).max(300),
});

export type InquiryAdminSummary = z.infer<typeof inquiryAdminSummarySchema>;

export type MatchInsight = {
  id: string;
  providerKey: string;
  providerName: string;
  score: number;
  reasons: string[];
};

export type InquiryMatchInsights = {
  products: MatchInsight[];
  services: MatchInsight[];
};

export const moveIntelligenceSchema = z.object({
  plan: movePlanSchema,
  adminSummary: inquiryAdminSummarySchema,
});

export type MoveIntelligence = z.infer<typeof moveIntelligenceSchema>;

export type InquirySubmissionResult = {
  id: string;
  createdAt: string;
  status: "new";
  plan: {
    summary: string;
    tasks: MovePlanTask[];
  };
  planSource?: "ai" | "heuristic";
  matchedProducts: MarketplaceProduct[];
  matchedServices: MarketplaceService[];
};

export type MarketplaceSnapshot = {
  destination: string;
  lastSyncedAt: string;
  products: MarketplaceProduct[];
  services: MarketplaceService[];
  partners: string[];
  connectors: ProviderConnector[];
};

export type InquiryRecord = InquirySubmissionResult & {
  inquiry: InquiryInput;
  source: "website";
  adminSummary?: InquiryAdminSummary;
  matchInsights?: InquiryMatchInsights;
};

export type AdminCatalogSnapshot = {
  providers: ProviderRecord[];
  catalogItems: CatalogItemRecord[];
  inquiries: InquiryRecord[];
  stats: {
    activeProviders: number;
    activeCatalogItems: number;
    products: number;
    services: number;
    apiNeeded: number;
    csvOrManual: number;
    inquiries: number;
  };
};

export type CsvImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
  items: CatalogItemRecord[];
};

export const moveIntakeRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, "Tell us a bit more about your move first — a sentence or two is enough.")
    .max(4000, "Please keep the description under 4,000 characters."),
});

export const moveIntakeDraftSchema = z.object({
  name: z.string().trim().max(120).catch("").default(""),
  email: z.string().trim().max(160).catch("").default(""),
  whatsapp: z.string().trim().max(80).catch("").default(""),
  origin: z.string().trim().max(120).catch("").default(""),
  destination: z.string().trim().max(120).catch("").default(""),
  moveDate: z
    .string()
    .trim()
    .catch("")
    .default("")
    .transform((value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "")),
  household: z.enum(["", "alone", "couple", "family", "unsure"]).catch(""),
  status: z.enum(["", "exploring", "planning", "signed", "imminent", "arrived"]).catch(""),
  pet: z.enum(["no", "dog", "cat", "multiple", "other"]).catch("no"),
  help: z
    .array(z.string())
    .catch([])
    .default([])
    .transform((values) => values.filter(isHelpOption)),
  message: z.string().trim().max(2000).catch("").default(""),
});

export type MoveIntakeRequest = z.infer<typeof moveIntakeRequestSchema>;
export type MoveIntakeDraft = z.infer<typeof moveIntakeDraftSchema>;

export type MoveIntakeParseResult =
  | { ok: true; draft: MoveIntakeDraft; model: string }
  | {
      ok: false;
      reason: "not-configured" | "unavailable" | "parse-failed";
      message: string;
    };
