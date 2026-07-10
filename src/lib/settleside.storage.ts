import "@tanstack/react-start/server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  catalogItemRecordSchema,
  providerRecordSchema,
  type CatalogItemRecord,
  type InquiryRecord,
  type ProviderRecord,
} from "./settleside.schemas";
import { SEED_CATALOG_ITEMS, SEED_PROVIDERS } from "./settleside.seeds";

export type CatalogStore = {
  providers: ProviderRecord[];
  catalogItems: CatalogItemRecord[];
};

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function storageMode() {
  if (isSupabaseConfigured()) return "supabase";
  return process.env.SETTLESIDE_DATA_DIR ? "configured-json" : "local-json";
}

/* ---------- JSON file backend (zero-config default) ---------- */

const DATA_DIR = process.env.SETTLESIDE_DATA_DIR ?? path.join(process.cwd(), ".settleside");
const CATALOG_FILE = path.join(DATA_DIR, "catalog-store.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");

function hasCode(error: unknown, code: string) {
  return (
    error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === code
  );
}

async function readJsonFile<T>(filePath: string, fallback: T) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (hasCode(error, "ENOENT")) return fallback;
    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function jsonReadCatalogStore(): Promise<CatalogStore> {
  const fallback = {
    providers: SEED_PROVIDERS,
    catalogItems: SEED_CATALOG_ITEMS,
  };
  const store = await readJsonFile<CatalogStore>(CATALOG_FILE, fallback);

  return {
    providers: store.providers.map((provider) => providerRecordSchema.parse(provider)),
    catalogItems: store.catalogItems.map((item) => catalogItemRecordSchema.parse(item)),
  };
}

/* ---------- Supabase backend ---------- */

let supabase: SupabaseClient | null = null;

export function getSupabaseAdminClient() {
  return getSupabase();
}

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return supabase;
}

type StoredRow = { id: string; position: number; data: unknown; updated_at: string };

function toRows(entries: Array<{ id: string; data: unknown }>): StoredRow[] {
  const timestamp = new Date().toISOString();
  return entries.map((entry, index) => ({
    id: entry.id,
    position: index,
    data: entry.data,
    updated_at: timestamp,
  }));
}

async function sbSelectData(table: string) {
  const { data, error } = await getSupabase()
    .from(table)
    .select("data")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Supabase read from "${table}" failed: ${error.message}`);
  }

  return (data ?? []).map((row) => row.data as unknown);
}

async function sbUpsertAll(table: string, rows: StoredRow[]) {
  if (rows.length === 0) return;

  const { error } = await getSupabase().from(table).upsert(rows);

  if (error) {
    throw new Error(`Supabase write to "${table}" failed: ${error.message}`);
  }
}

async function sbReadCatalogStore(): Promise<CatalogStore> {
  const [providers, catalogItems] = await Promise.all([
    sbSelectData("providers"),
    sbSelectData("catalog_items"),
  ]);

  if (providers.length === 0 && catalogItems.length === 0) {
    const seeded = { providers: SEED_PROVIDERS, catalogItems: SEED_CATALOG_ITEMS };
    await sbWriteCatalogStore(seeded);
    return seeded;
  }

  return {
    providers: providers.map((provider) => providerRecordSchema.parse(provider)),
    catalogItems: catalogItems.map((item) => catalogItemRecordSchema.parse(item)),
  };
}

async function sbWriteCatalogStore(store: CatalogStore) {
  // The app only upserts and soft-deactivates (active: false); rows are never
  // removed from the list, so no delete-missing pass is needed here.
  await Promise.all([
    sbUpsertAll(
      "providers",
      toRows(store.providers.map((provider) => ({ id: provider.key, data: provider }))),
    ),
    sbUpsertAll(
      "catalog_items",
      toRows(store.catalogItems.map((item) => ({ id: item.id, data: item }))),
    ),
  ]);
}

async function sbReadInquiries(): Promise<InquiryRecord[]> {
  const rows = await sbSelectData("inquiries");
  return rows as InquiryRecord[];
}

async function sbWriteInquiries(records: InquiryRecord[]) {
  await sbUpsertAll(
    "inquiries",
    toRows(records.map((record) => ({ id: record.id, data: record }))),
  );
}

/* ---------- Public storage API ---------- */

export async function readCatalogStore(): Promise<CatalogStore> {
  if (isSupabaseConfigured()) return sbReadCatalogStore();
  return jsonReadCatalogStore();
}

export async function writeCatalogStore(store: CatalogStore) {
  if (isSupabaseConfigured()) return sbWriteCatalogStore(store);
  return writeJsonFile(CATALOG_FILE, store);
}

export async function readInquiries(): Promise<InquiryRecord[]> {
  if (isSupabaseConfigured()) return sbReadInquiries();
  return readJsonFile<InquiryRecord[]>(INQUIRIES_FILE, []);
}

export async function writeInquiries(records: InquiryRecord[]) {
  if (isSupabaseConfigured()) return sbWriteInquiries(records);
  return writeJsonFile(INQUIRIES_FILE, records);
}
