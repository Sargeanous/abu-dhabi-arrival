import "@tanstack/react-start/server-only";

import {
  draftQuoteRecommendation,
  generateMoveIntelligence,
  generateProviderBriefs,
  mapCatalogCsvColumns,
  normalizeQuotes,
} from "./settleside.ai";
import { rankCatalogItems, toMatchInsight } from "./settleside.matching";
import {
  isCustomerMailConfigured,
  sendCustomerConfirmation,
  sendCustomerReply,
  sendInquiryNotification,
  sendProviderBrief,
  sendReviewReady,
} from "./settleside.notify";
import {
  CATALOG_CSV_FIELDS,
  catalogCsvImportSchema,
  catalogItemRecordSchema,
  catalogItemUpsertSchema,
  inquirySchema,
  marketplaceQuerySchema,
  providerRecordSchema,
  providerUpsertSchema,
  supplierSaveSchema,
  type AdminCatalogSnapshot,
  type BriefDispatch,
  type CatalogItemRecord,
  type CatalogItemUpsert,
  type CsvImportResult,
  type InquiryInput,
  type InquiryMatchInsights,
  type InquiryRecord,
  type InquirySubmissionResult,
  type MarketplaceProduct,
  type MarketplaceQuery,
  type MarketplaceService,
  type MarketplaceSnapshot,
  type MovePlanTask,
  type ProviderConnector,
  type ProviderRecord,
  type ProviderUpsert,
} from "./settleside.schemas";
import {
  readCatalogStore,
  readInquiries,
  writeCatalogStore,
  writeInquiries,
} from "./settleside.storage";

const nowIso = () => new Date().toISOString();

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export { isAdminAuthorized } from "./settleside.auth";

function publicConnectors(providers: ProviderRecord[]): ProviderConnector[] {
  return providers
    .filter((provider) => provider.active)
    .map((provider) => ({
      key: provider.key,
      name: provider.name,
      category: provider.category,
      integrationStatus: provider.integrationStatus,
      nextStep: provider.nextStep,
    }));
}

function providerName(providerKey: string, providers: ProviderRecord[]) {
  return providers.find((provider) => provider.key === providerKey)?.name ?? providerKey;
}

function providerCoversDestination(provider: ProviderRecord, destination: string) {
  if (!destination) return true;
  return provider.coverageCities.some((city) => {
    const normalizedCity = city.toLowerCase();
    return normalizedCity === "any city" || destination.toLowerCase().includes(normalizedCity);
  });
}

function filterCatalogItems(
  items: CatalogItemRecord[],
  providers: ProviderRecord[],
  query: MarketplaceQuery,
) {
  const normalizedCategory = query.category?.toLowerCase();

  return items.filter((item) => {
    if (!item.active) return false;
    const provider = providers.find((entry) => entry.key === item.providerKey);
    if (!provider?.active) return false;
    if (!providerCoversDestination(provider, query.destination)) return false;

    const city = item.city.toLowerCase();
    const cityMatches =
      !query.destination ||
      city === "" ||
      city === "any city" ||
      query.destination.toLowerCase().includes(city);

    if (!cityMatches) return false;

    return !normalizedCategory || item.category.toLowerCase().includes(normalizedCategory);
  });
}

function productIcon(item: CatalogItemRecord): MarketplaceProduct["icon"] {
  const text = `${item.category} ${item.name}`.toLowerCase();
  if (text.includes("internet") || text.includes("wifi") || text.includes("fiber")) return "wifi";
  if (text.includes("kitchen") || text.includes("box") || text.includes("essentials")) {
    return "boxes";
  }
  if (
    text.includes("sofa") ||
    text.includes("mattress") ||
    text.includes("furniture") ||
    text.includes("bed")
  ) {
    return "sofa";
  }
  return "shopping";
}

function productSwatch(item: CatalogItemRecord) {
  const text = `${item.category} ${item.name}`.toLowerCase();
  if (text.includes("internet") || text.includes("wifi") || text.includes("fiber")) {
    return "bg-[oklch(0.93_0.02_240)]";
  }
  if (text.includes("kitchen") || text.includes("box") || text.includes("essentials")) {
    return "bg-[oklch(0.93_0.03_150)]";
  }
  if (text.includes("sofa") || text.includes("living")) return "bg-terracotta-soft";
  return "bg-sand-deep";
}

function serviceIcon(item: CatalogItemRecord): MarketplaceService["icon"] {
  const text = `${item.category} ${item.name}`.toLowerCase();
  if (text.includes("pet") || text.includes("dog") || text.includes("cat")) return "paw";
  if (text.includes("mover") || text.includes("shipping")) return "truck";
  if (text.includes("clean")) return "sparkles";
  if (text.includes("internet") || text.includes("utilit")) return "wifi";
  if (text.includes("handyman") || text.includes("install")) return "wrench";
  if (text.includes("insurance")) return "shield";
  return "building";
}

function toMarketplaceProduct(
  item: CatalogItemRecord,
  providers: ProviderRecord[],
): MarketplaceProduct {
  return {
    id: item.id,
    category: item.category,
    name: item.name,
    retailer: providerName(item.providerKey, providers),
    providerKey: item.providerKey,
    price: item.price,
    rating: item.rating,
    swatch: productSwatch(item),
    icon: productIcon(item),
    availability: item.availability,
    deliveryWindow: item.deliveryWindow,
  };
}

function toMarketplaceService(
  item: CatalogItemRecord,
  providers: ProviderRecord[],
): MarketplaceService {
  return {
    id: item.id,
    icon: serviceIcon(item),
    category: item.category,
    body: item.description || item.name,
    providers: item.availability,
    leadTime: item.deliveryWindow,
    providerKeys: [item.providerKey].filter((key) =>
      providers.some((provider) => provider.key === key && provider.active),
    ),
  };
}

export async function getMarketplaceSnapshot(query: Partial<MarketplaceQuery> = {}) {
  const parsed = marketplaceQuerySchema.parse(query);
  const store = await readCatalogStore();
  const filteredItems = filterCatalogItems(store.catalogItems, store.providers, parsed);
  const products = filteredItems
    .filter((item) => item.type === "product")
    .map((item) => toMarketplaceProduct(item, store.providers));
  const services = filteredItems
    .filter((item) => item.type === "service")
    .map((item) => toMarketplaceService(item, store.providers));

  const partners = Array.from(
    new Set([
      ...products.map((product) => product.retailer),
      ...services.flatMap((service) =>
        service.providerKeys.map((providerKey) => providerName(providerKey, store.providers)),
      ),
    ]),
  );

  return {
    destination: parsed.destination || "Abu Dhabi",
    lastSyncedAt: nowIso(),
    products,
    services,
    partners,
    connectors: publicConnectors(store.providers),
  } satisfies MarketplaceSnapshot;
}

export async function getAdminCatalogSnapshot(): Promise<AdminCatalogSnapshot> {
  const [store, inquiries] = await Promise.all([readCatalogStore(), readInquiries()]);
  const activeProviders = store.providers.filter((provider) => provider.active);
  const activeCatalogItems = store.catalogItems.filter((item) => item.active);
  const csvOrManual = store.providers.filter((provider) =>
    ["manual", "csv", "mock"].includes(provider.integrationStatus),
  ).length;

  return {
    providers: store.providers,
    catalogItems: store.catalogItems,
    inquiries,
    stats: {
      activeProviders: activeProviders.length,
      activeCatalogItems: activeCatalogItems.length,
      products: activeCatalogItems.filter((item) => item.type === "product").length,
      services: activeCatalogItems.filter((item) => item.type === "service").length,
      apiNeeded: store.providers.filter((provider) => provider.integrationStatus === "api-needed")
        .length,
      csvOrManual,
      inquiries: inquiries.length,
    },
  };
}

export async function upsertProvider(input: ProviderUpsert) {
  const parsed = providerUpsertSchema.parse(input);
  const store = await readCatalogStore();
  const timestamp = nowIso();
  const key = parsed.key || slugify(parsed.name);
  const existingIndex = store.providers.findIndex((provider) => provider.key === key);
  const existing = existingIndex >= 0 ? store.providers[existingIndex] : undefined;
  const provider = providerRecordSchema.parse({
    ...existing,
    ...parsed,
    key,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });

  if (existingIndex >= 0) {
    store.providers[existingIndex] = provider;
  } else {
    store.providers.unshift(provider);
  }

  await writeCatalogStore(store);
  return provider;
}

export async function upsertCatalogItem(input: CatalogItemUpsert) {
  const parsed = catalogItemUpsertSchema.parse(input);
  const store = await readCatalogStore();
  const provider = store.providers.find((entry) => entry.key === parsed.providerKey);

  if (!provider) {
    throw new Error(`Provider "${parsed.providerKey}" does not exist.`);
  }

  const timestamp = nowIso();
  const id = parsed.id || slugify(`${parsed.providerKey}-${parsed.category}-${parsed.name}`);
  const existingIndex = store.catalogItems.findIndex((item) => item.id === id);
  const existing = existingIndex >= 0 ? store.catalogItems[existingIndex] : undefined;
  const item = catalogItemRecordSchema.parse({
    ...existing,
    ...parsed,
    id,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    lastSyncedAt: timestamp,
  });

  if (existingIndex >= 0) {
    store.catalogItems[existingIndex] = item;
  } else {
    store.catalogItems.unshift(item);
  }

  await writeCatalogStore(store);
  return item;
}

export async function saveSupplier(input: unknown) {
  const parsed = supplierSaveSchema.parse(input);
  const provider = await upsertProvider(parsed.provider);
  const items: CatalogItemRecord[] = [];

  for (const item of parsed.items) {
    items.push(await upsertCatalogItem({ ...item, providerKey: provider.key }));
  }

  return { provider, items };
}

function parseBoolean(value: string | undefined, fallback = true) {
  if (value == null || value.trim() === "") return fallback;
  return ["true", "yes", "1", "active"].includes(value.trim().toLowerCase());
}

function parseRating(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(5, parsed)) : 4.5;
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsv(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ""),
  );

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvRaw(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  return {
    headers: splitCsvLine(lines[0]),
    rows: lines.slice(1).map(splitCsvLine),
  };
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export async function mapCatalogCsv(csv: string) {
  const parsed = parseCsvRaw(csv);

  if (!parsed) {
    return { ok: false as const, error: "empty-csv" as const };
  }

  const sampleRows = parsed.rows.slice(0, 12).map((row) => {
    return Object.fromEntries(parsed.headers.map((header, index) => [header, row[index] ?? ""]));
  });

  const mapping = await mapCatalogCsvColumns(parsed.headers, sampleRows);

  if (!mapping) {
    return { ok: false as const, error: "ai-unavailable" as const };
  }

  const fields = CATALOG_CSV_FIELDS.filter((field) => {
    const sourceHeader = mapping.columnMap[field];
    const hasColumn = sourceHeader !== "" && parsed.headers.includes(sourceHeader);
    return hasColumn || mapping.defaults[field] !== "";
  });

  const headerIndex = new Map(parsed.headers.map((header, index) => [header, index]));
  const outputLines = [fields.join(",")];

  for (const row of parsed.rows) {
    const values = fields.map((field) => {
      const sourceHeader = mapping.columnMap[field];
      const index = sourceHeader !== "" ? headerIndex.get(sourceHeader) : undefined;
      const value = index !== undefined ? (row[index] ?? "") : mapping.defaults[field];
      return escapeCsvValue(value);
    });
    outputLines.push(values.join(","));
  }

  let notes = mapping.notes;
  for (const required of ["name", "category"] as const) {
    if (!fields.includes(required)) {
      notes =
        `${notes} Warning: no source column mapped to "${required}" - the import will reject these rows.`.trim();
    }
  }

  return {
    ok: true as const,
    csv: outputLines.join("\n"),
    notes,
    mapping,
    rows: parsed.rows.length,
    mappedFields: fields,
  };
}

export async function importCatalogCsv(input: unknown): Promise<CsvImportResult> {
  const parsed = catalogCsvImportSchema.parse(input);
  const rows = parseCsv(parsed.csv);
  const store = await readCatalogStore();
  const timestamp = nowIso();
  const items: CatalogItemRecord[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const providerKey = row.providerkey || parsed.defaultProviderKey || "";
    const provider = store.providers.find((entry) => entry.key === providerKey);

    if (!provider) {
      errors.push(`Row ${index + 2}: providerKey "${providerKey}" was not found.`);
      return;
    }

    const name = row.name || row.itemname || "";
    const category = row.category || "";

    if (!name || !category) {
      errors.push(`Row ${index + 2}: name and category are required.`);
      return;
    }

    const record = catalogItemRecordSchema.parse({
      id: row.id || slugify(`${providerKey}-${category}-${name}`),
      providerKey,
      type: row.type || parsed.defaultType,
      category,
      name,
      description: row.description || "",
      price: row.price || "Quote required",
      currency: row.currency || "AED",
      unit: row.unit || "",
      city: row.city || "Abu Dhabi",
      availability: row.availability || "On request",
      deliveryWindow: row.deliverywindow || row.leadtime || "To be confirmed",
      rating: parseRating(row.rating),
      active: parseBoolean(row.active, true),
      source: "csv",
      checkoutMethod: row.checkoutmethod || "lead",
      checkoutUrl: row.checkouturl || "",
      commissionModel: row.commissionmodel || "",
      lastSyncedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const existingIndex = store.catalogItems.findIndex((item) => item.id === record.id);
    if (existingIndex >= 0) {
      store.catalogItems[existingIndex] = {
        ...store.catalogItems[existingIndex],
        ...record,
        createdAt: store.catalogItems[existingIndex].createdAt,
        updatedAt: timestamp,
      };
    } else {
      store.catalogItems.unshift(record);
    }

    items.push(record);
  });

  await writeCatalogStore(store);

  return {
    imported: items.length,
    skipped: errors.length,
    errors,
    items,
  };
}

function dueLabel(moveDate: string, offsetDays: number, fallback: string) {
  if (!moveDate) return fallback;
  const date = new Date(`${moveDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return fallback;

  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function buildPlan(inquiry: InquiryInput): InquirySubmissionResult["plan"] {
  const hasPet = inquiry.pet !== "no";
  const help = new Set(inquiry.help);
  const tasks: MovePlanTask[] = [
    {
      title: "Confirm move scope, dates, and apartment readiness",
      timing: dueLabel(inquiry.moveDate, -30, "First planning call"),
      owner: "SettleSide",
      category: "Move planning",
    },
    {
      title: "Collect mover quotes and delivery constraints",
      timing: dueLabel(inquiry.moveDate, -21, "Within 48 hours"),
      owner: "Provider",
      category: "Movers & shipping",
    },
    {
      title: "Shortlist home essentials with delivery windows",
      timing: dueLabel(inquiry.moveDate, -14, "After address confirmation"),
      owner: "SettleSide",
      category: "Furniture & mattress",
    },
    {
      title: "Book internet, cleaning, and handyman slots",
      timing: dueLabel(inquiry.moveDate, -7, "Move-in week"),
      owner: "Provider",
      category: "Internet & utilities",
    },
  ];

  if (hasPet || help.has("Pet relocation (optional)")) {
    tasks.unshift({
      title: "Check pet documents, vaccinations, and airline/import requirements",
      timing: dueLabel(inquiry.moveDate, -45, "As early as possible"),
      owner: "SettleSide",
      category: "Pet relocation",
    });
  }

  return {
    summary: `Move plan for ${inquiry.destination}${inquiry.origin ? ` from ${inquiry.origin}` : ""}.`,
    tasks,
  };
}

async function rankInquiryMatches(inquiry: InquiryInput) {
  const store = await readCatalogStore();
  const destination = inquiry.destination || "Abu Dhabi";
  const filtered = filterCatalogItems(store.catalogItems, store.providers, { destination });

  const productMatches = rankCatalogItems({
    inquiry,
    items: filtered.filter((item) => item.type === "product"),
    providers: store.providers,
  });
  const serviceMatches = rankCatalogItems({
    inquiry,
    items: filtered.filter((item) => item.type === "service"),
    providers: store.providers,
  });

  return {
    matchedProducts: productMatches.map((match) =>
      toMarketplaceProduct(match.item, store.providers),
    ),
    matchedServices: serviceMatches.map((match) =>
      toMarketplaceService(match.item, store.providers),
    ),
    matchInsights: {
      products: productMatches.map(toMatchInsight),
      services: serviceMatches.map(toMatchInsight),
    } satisfies InquiryMatchInsights,
  };
}

export async function createInquiry(input: InquiryInput) {
  const inquiry = inquirySchema.parse(input);
  const createdAt = nowIso();
  const marketplace = await getMarketplaceSnapshot({
    destination: inquiry.destination || "Abu Dhabi",
  });
  const intelligence = await generateMoveIntelligence(inquiry, marketplace);
  const matches = await rankInquiryMatches(inquiry);
  const record: InquiryRecord = {
    id: `ss-${createdAt.slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt,
    status: "new",
    source: "website",
    inquiry,
    plan: intelligence?.plan ?? buildPlan(inquiry),
    planSource: intelligence ? "ai" : "heuristic",
    adminSummary: intelligence?.adminSummary,
    matchedProducts: matches.matchedProducts,
    matchedServices: matches.matchedServices,
    matchInsights: matches.matchInsights,
  };

  const records = await readInquiries();
  records.unshift(record);
  await writeInquiries(records);

  // Notifications are best-effort: an inquiry must never fail because mail did.
  try {
    await Promise.all([sendInquiryNotification(record), sendCustomerConfirmation(record)]);
  } catch (error) {
    console.error("SettleSide inquiry notification error:", error);
  }

  // Write the provider briefs and send them out in the background: the customer
  // gets their plan immediately rather than waiting on another AI round trip.
  void autoPrepareInquiry(record.id).catch((error) =>
    console.error("SettleSide auto-prepare error:", error),
  );

  return {
    id: record.id,
    createdAt: record.createdAt,
    status: record.status,
    plan: record.plan,
    planSource: record.planSource,
    matchedProducts: record.matchedProducts,
    matchedServices: record.matchedServices,
  } satisfies InquirySubmissionResult;
}

export async function listInquiries() {
  return readInquiries();
}

/* ---------- Automated pipeline ---------- */

function categoriesToQuote(record: InquiryRecord) {
  return Array.from(
    new Set(
      record.inquiry.help.length > 0
        ? record.inquiry.help.map((option) => option.replace(/\s*\(optional\)$/, ""))
        : record.matchedServices.map((service) => service.category),
    ),
  );
}

async function saveInquiry(record: InquiryRecord) {
  const records = await readInquiries();
  const index = records.findIndex((entry) => entry.id === record.id);
  if (index < 0) return;
  records[index] = record;
  await writeInquiries(records);
}

/**
 * Emails each brief to the live providers that serve its category. Only
 * published providers with an email address are contacted, so prospects that
 * have not agreed terms are never cold-mailed.
 */
export async function dispatchBriefs(record: InquiryRecord) {
  if (!record.briefs?.length || !isCustomerMailConfigured()) return record;

  const store = await readCatalogStore();
  const dispatches: BriefDispatch[] = [...(record.dispatches ?? [])];
  const alreadySent = new Set(dispatches.map((d) => `${d.category}|${d.providerKey}`));

  for (const brief of record.briefs) {
    const needle = brief.category.toLowerCase();
    const providers = store.providers.filter((provider) => {
      if (!provider.active || !provider.contactEmail) return false;
      const servesCategory = store.catalogItems.some(
        (item) =>
          item.active &&
          item.providerKey === provider.key &&
          item.category.toLowerCase().includes(needle.split(" ")[0]),
      );
      return servesCategory || provider.category.toLowerCase().includes(needle.split(" ")[0]);
    });

    for (const provider of providers.slice(0, 4)) {
      const key = `${brief.category}|${provider.key}`;
      if (alreadySent.has(key)) continue;

      const sent = await sendProviderBrief({
        to: provider.contactEmail,
        providerName: provider.name,
        subject: brief.subject,
        message: brief.message,
        inquiryId: record.id,
      });

      if (sent) {
        alreadySent.add(key);
        dispatches.push({
          category: brief.category,
          providerKey: provider.key,
          providerName: provider.name,
          to: provider.contactEmail,
          sentAt: nowIso(),
        });
      }
    }
  }

  return {
    ...record,
    dispatches,
    stage: dispatches.length > 0 ? ("dispatched" as const) : record.stage,
  };
}

/** Generates briefs and dispatches them, without blocking inquiry creation. */
export async function autoPrepareInquiry(id: string) {
  const records = await readInquiries();
  const record = records.find((entry) => entry.id === id);
  if (!record) return;

  const categories = categoriesToQuote(record);
  if (categories.length === 0) return;

  const briefs = await generateProviderBriefs(record.inquiry, categories);
  if (!briefs) return;

  const withBriefs: InquiryRecord = { ...record, briefs, stage: "briefed" };
  const dispatched = await dispatchBriefs(withBriefs);
  await saveInquiry(dispatched);
}

/**
 * A provider replied. Append the raw text, re-read every quote received so far,
 * redraft the recommendation, and tell the operator it is ready to review.
 */
export async function ingestInboundQuote(input: {
  inquiryId: string;
  from: string;
  subject: string;
  text: string;
}) {
  const records = await readInquiries();
  const index = records.findIndex((entry) => entry.id === input.inquiryId);
  if (index < 0) return { ok: false as const, error: "not-found" as const };

  const record = records[index];
  const inboundQuotes = [
    ...(record.inboundQuotes ?? []),
    { from: input.from, subject: input.subject, body: input.text, receivedAt: nowIso() },
  ];

  const combined = inboundQuotes
    .map((quote) => `From: ${quote.from}\nSubject: ${quote.subject}\n${quote.body}`)
    .join("\n\n---\n\n");

  const quoteComparison = await normalizeQuotes(record.inquiry, combined);
  const recommendation = quoteComparison
    ? await draftQuoteRecommendation(record.inquiry, quoteComparison)
    : undefined;

  const updated: InquiryRecord = {
    ...record,
    inboundQuotes,
    quoteComparison: quoteComparison ?? record.quoteComparison,
    recommendation: recommendation ?? undefined,
    stage: recommendation ? "ready" : "quoting",
  };

  records[index] = updated;
  await writeInquiries(records);

  if (recommendation) {
    try {
      if (process.env.SETTLESIDE_AUTO_SEND_REPLY === "true") {
        await sendCustomerReplyEmail(updated.id);
      } else {
        await sendReviewReady(updated);
      }
    } catch (error) {
      console.error("SettleSide review notification error:", error);
    }
  }

  return { ok: true as const, inquiry: updated };
}

export async function sendCustomerReplyEmail(id: string) {
  const records = await readInquiries();
  const index = records.findIndex((entry) => entry.id === id);
  if (index < 0) return { ok: false as const, error: "not-found" as const };

  const record = records[index];
  if (!record.recommendation) return { ok: false as const, error: "no-recommendation" as const };

  const sent = await sendCustomerReply(record);
  if (!sent) return { ok: false as const, error: "mail-not-configured" as const };

  const updated: InquiryRecord = { ...record, stage: "sent", replySentAt: nowIso() };
  records[index] = updated;
  await writeInquiries(records);
  return { ok: true as const, inquiry: updated };
}

export async function runMoveDeskAction(input: {
  id: string;
  action: "briefs" | "quotes" | "recommendation" | "dispatch" | "send-reply";
  rawQuotes?: string;
}) {
  const records = await readInquiries();
  const index = records.findIndex((record) => record.id === input.id);

  if (index < 0) {
    return { ok: false as const, error: "not-found" as const };
  }

  const record = records[index];
  let updated = record;

  if (input.action === "send-reply") {
    return sendCustomerReplyEmail(input.id);
  }

  if (input.action === "dispatch") {
    if (!record.briefs?.length) return { ok: false as const, error: "no-briefs" as const };
    const dispatched = await dispatchBriefs(record);
    if ((dispatched.dispatches?.length ?? 0) === (record.dispatches?.length ?? 0)) {
      return { ok: false as const, error: "no-recipients" as const };
    }
    records[index] = dispatched;
    await writeInquiries(records);
    return { ok: true as const, inquiry: dispatched };
  }

  if (input.action === "briefs") {
    // Quote the categories the customer asked for; fall back to whatever the
    // matcher surfaced so a request with no help boxes ticked still works.
    const categories = categoriesToQuote(record);

    if (categories.length === 0) {
      return { ok: false as const, error: "no-categories" as const };
    }

    const briefs = await generateProviderBriefs(record.inquiry, categories);
    if (!briefs) return { ok: false as const, error: "ai-unavailable" as const };
    updated = { ...record, briefs, stage: "briefed" };
  }

  if (input.action === "quotes") {
    const rawQuotes = (input.rawQuotes ?? "").trim();
    if (rawQuotes.length < 20) {
      return { ok: false as const, error: "no-quotes" as const };
    }

    const quoteComparison = await normalizeQuotes(record.inquiry, rawQuotes);
    if (!quoteComparison) return { ok: false as const, error: "ai-unavailable" as const };
    // Comparing a fresh set invalidates a recommendation built on the old one,
    // so redraft immediately rather than leaving a stale reply in place.
    const recommendation = await draftQuoteRecommendation(record.inquiry, quoteComparison);
    updated = {
      ...record,
      quoteComparison,
      recommendation: recommendation ?? undefined,
      stage: recommendation ? "ready" : "quoting",
    };
  }

  if (input.action === "recommendation") {
    if (!record.quoteComparison || record.quoteComparison.quotes.length === 0) {
      return { ok: false as const, error: "no-quotes" as const };
    }

    const recommendation = await draftQuoteRecommendation(record.inquiry, record.quoteComparison);
    if (!recommendation) return { ok: false as const, error: "ai-unavailable" as const };
    updated = { ...record, recommendation, stage: "ready" };
  }

  records[index] = updated;
  await writeInquiries(records);
  return { ok: true as const, inquiry: updated };
}

export async function regenerateInquiryIntelligence(id: string) {
  const records = await readInquiries();
  const index = records.findIndex((record) => record.id === id);

  if (index < 0) {
    return { ok: false as const, error: "not-found" as const };
  }

  const record = records[index];
  const marketplace = await getMarketplaceSnapshot({
    destination: record.inquiry.destination || "Abu Dhabi",
  });
  const intelligence = await generateMoveIntelligence(record.inquiry, marketplace);

  if (!intelligence) {
    return { ok: false as const, error: "ai-unavailable" as const };
  }

  const matches = await rankInquiryMatches(record.inquiry);
  records[index] = {
    ...record,
    plan: intelligence.plan,
    planSource: "ai",
    adminSummary: intelligence.adminSummary,
    matchedProducts: matches.matchedProducts,
    matchedServices: matches.matchedServices,
    matchInsights: matches.matchInsights,
  };
  await writeInquiries(records);

  return { ok: true as const, inquiry: records[index] };
}
