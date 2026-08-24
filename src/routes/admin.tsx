import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Database,
  LogOut,
  RefreshCw,
  Save,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminCatalogSnapshot,
  CatalogItemRecord,
  CatalogItemUpsert,
  CsvImportResult,
  InquiryAdminSummary,
  InquiryRecord,
  ProviderRecord,
  ProviderUpsert,
  SupplierDraft,
} from "@/lib/settleside.schemas";

type ProviderDraft = SupplierDraft["provider"];
type ItemDraft = SupplierDraft["items"][number];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "SettleSide Admin - Catalog Ops" },
      {
        name: "description",
        content: "Internal catalog and provider operations workspace for SettleSide.",
      },
    ],
  }),
  component: AdminPage,
});

type ProviderForm = Omit<ProviderUpsert, "coverageCities"> & {
  coverageCities: string;
};

type CatalogForm = Omit<CatalogItemUpsert, "rating" | "active"> & {
  rating: string;
  active: boolean;
};

const EMPTY_PROVIDER: ProviderForm = {
  name: "",
  category: "",
  website: "",
  coverageCities: "Abu Dhabi",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  leadMethod: "manual",
  commercialModel: "unknown",
  integrationStatus: "manual",
  nextStep: "Confirm operating model and catalog source.",
  priority: "medium",
  active: true,
};

const EMPTY_CATALOG_ITEM: CatalogForm = {
  providerKey: "",
  type: "product",
  category: "",
  name: "",
  description: "",
  price: "Quote required",
  currency: "AED",
  unit: "",
  city: "Abu Dhabi",
  availability: "On request",
  deliveryWindow: "To be confirmed",
  rating: "4.5",
  active: true,
  checkoutMethod: "lead",
  checkoutUrl: "",
  commissionModel: "",
  source: "manual",
};

const SAMPLE_CSV = `providerKey,type,category,name,description,price,currency,unit,city,availability,deliveryWindow,rating,checkoutMethod,commissionModel
settleside-ops,service,Pet relocation,Pet import readiness review,Document and timeline check for dogs or cats,Quote required,AED,per pet,Abu Dhabi,On request,3-5 days,4.6,lead,Referral fee
settleside-ops,product,Appliances,Washer dryer starter pick,Appliance shortlist with delivery coordination,AED 1899,AED,one-time,Abu Dhabi,On request,5-7 days,4.4,lead,Markup`;

const URGENCY_VARIANT: Record<
  InquiryAdminSummary["urgency"],
  "destructive" | "default" | "secondary"
> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

function authHeaders(token: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJson<T>(response: Response) {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

function splitCities(value: string) {
  return value
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean);
}

function providerFormFromRecord(provider: ProviderRecord): ProviderForm {
  return {
    key: provider.key,
    name: provider.name,
    category: provider.category,
    website: provider.website,
    coverageCities: provider.coverageCities.join(", "),
    contactName: provider.contactName,
    contactEmail: provider.contactEmail,
    contactPhone: provider.contactPhone,
    leadMethod: provider.leadMethod,
    commercialModel: provider.commercialModel,
    integrationStatus: provider.integrationStatus,
    nextStep: provider.nextStep,
    priority: provider.priority,
    active: provider.active,
  };
}

function catalogFormFromRecord(item: CatalogItemRecord): CatalogForm {
  return {
    id: item.id,
    providerKey: item.providerKey,
    type: item.type,
    category: item.category,
    name: item.name,
    description: item.description,
    price: item.price,
    currency: item.currency,
    unit: item.unit,
    city: item.city,
    availability: item.availability,
    deliveryWindow: item.deliveryWindow,
    rating: String(item.rating),
    active: item.active,
    checkoutMethod: item.checkoutMethod,
    checkoutUrl: item.checkoutUrl,
    commissionModel: item.commissionModel,
    source: item.source,
  };
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("Couldn't copy — select the text and copy manually.");
        }
      }}
    >
      {copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function MoveDesk({
  inquiry,
  busy,
  onRun,
}: {
  inquiry: InquiryRecord;
  busy: string | null;
  onRun: (action: "briefs" | "quotes" | "recommendation", rawQuotes?: string) => void;
}) {
  const [rawQuotes, setRawQuotes] = useState("");
  const comparison = inquiry.quoteComparison;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal">
        <Sparkles className="h-3.5 w-3.5" />
        Move desk
      </div>

      {/* Step 1 - provider briefs */}
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            1. Request quotes from providers
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => onRun("briefs")}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {busy === "briefs" ? "Writing..." : inquiry.briefs ? "Rewrite briefs" : "Draft briefs"}
          </Button>
        </div>
        {inquiry.briefs?.length ? (
          <div className="grid gap-2">
            {inquiry.briefs.map((brief) => (
              <details key={brief.category} className="border border-border bg-sand/40 p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">
                  {brief.category}
                </summary>
                <div className="mt-2 text-xs text-muted-foreground">{brief.subject}</div>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
                  {brief.message}
                </pre>
                <div className="mt-3">
                  <CopyButton text={brief.message} label="Copy message" />
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Generates one ready-to-send message per category, with everything a provider needs to
            quote and nothing that identifies the customer.
          </p>
        )}
      </div>

      {/* Step 2 - normalise quotes */}
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">2. Compare what came back</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null || rawQuotes.trim().length < 20}
            onClick={() => onRun("quotes", rawQuotes)}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {busy === "quotes" ? "Reading..." : "Compare quotes"}
          </Button>
        </div>
        <Textarea
          rows={3}
          value={rawQuotes}
          onChange={(event) => setRawQuotes(event.target.value)}
          placeholder="Paste the replies exactly as they came in — WhatsApp messages, emails, copied PDF text. Several at once is fine."
          className="text-xs"
        />
        {comparison?.quotes.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-sand text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Provider</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Lead time</th>
                  <th className="px-3 py-2 font-medium">Includes / excludes</th>
                  <th className="px-3 py-2 font-medium">Watch out</th>
                </tr>
              </thead>
              <tbody>
                {comparison.quotes.map((quote, index) => (
                  <tr key={`${quote.provider}-${index}`} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{quote.provider}</td>
                    <td className="px-3 py-2 text-foreground">{quote.price}</td>
                    <td className="px-3 py-2 text-muted-foreground">{quote.leadTime || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {quote.includes.length > 0 && <div>+ {quote.includes.join(", ")}</div>}
                      {quote.excludes.length > 0 && (
                        <div className="text-terracotta">- {quote.excludes.join(", ")}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{quote.concerns || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {comparison.comparisonNotes && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {comparison.comparisonNotes}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Step 3 - recommendation */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">3. Reply to the customer</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null || !comparison?.quotes.length}
            onClick={() => onRun("recommendation")}
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {busy === "recommendation" ? "Drafting..." : "Draft reply"}
          </Button>
        </div>
        {inquiry.recommendation ? (
          <div className="border border-teal/30 bg-teal/5 p-3">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                Pick: {inquiry.recommendation.pick}
              </span>{" "}
              — {inquiry.recommendation.reasoning}
            </div>
            <pre className="mt-3 whitespace-pre-wrap border-t border-teal/20 pt-3 font-sans text-xs leading-relaxed text-foreground">
              {inquiry.recommendation.customerMessage}
            </pre>
            <div className="mt-3">
              <CopyButton text={inquiry.recommendation.customerMessage} label="Copy reply" />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Turns the comparison into a message you can send: the options, your recommendation, and
            why — weighed against what this customer said matters most.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

type AdminSession = {
  accessToken: string;
  expiresAt: number;
  email: string;
};

const SESSION_STORAGE_KEY = "settleside-admin-session";

function loadStoredSession(): AdminSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.accessToken || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authState, setAuthState] = useState<"checking" | "login" | "ready">("checking");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [snapshot, setSnapshot] = useState<AdminCatalogSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [providerForm, setProviderForm] = useState<ProviderForm>(EMPTY_PROVIDER);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>(EMPTY_CATALOG_ITEM);
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [csvType, setCsvType] = useState<"product" | "service">("product");
  const [csvProviderKey, setCsvProviderKey] = useState("");
  const [supplierText, setSupplierText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState<SupplierDraft | null>(null);
  const [supplierPublish, setSupplierPublish] = useState(true);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const token = session?.accessToken ?? "";
  const providerOptions = useMemo(() => snapshot?.providers ?? [], [snapshot]);
  const recentInquiries = snapshot?.inquiries.slice(0, 5) ?? [];

  function clearSession() {
    setSession(null);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  async function loadSnapshot(currentToken = token) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/snapshot", {
        headers: authHeaders(currentToken),
      });

      if (response.status === 401) {
        clearSession();
        setAuthState("login");
        return;
      }

      const data = await readJson<AdminCatalogSnapshot>(response);
      setSnapshot(data);
      setAuthState("ready");

      if (!catalogForm.providerKey && data.providers[0]) {
        setCatalogForm((form) => ({ ...form, providerKey: data.providers[0].key }));
        setCsvProviderKey(data.providers[0].key);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin data.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = loadStoredSession();
    if (saved) {
      setSession(saved);
    }
    void loadSnapshot(saved?.accessToken ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await readJson<{ session: AdminSession }>(response);
      setSession(data.session);
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
      setLoginPassword("");
      toast.success("Signed in.");
      await loadSnapshot(data.session.accessToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    clearSession();
    setSnapshot(null);
    setAuthState("login");
  }

  async function draftSupplier() {
    setDrafting(true);

    try {
      const response = await fetch("/api/admin/supplier-draft", {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ text: supplierText }),
      });
      const data = await readJson<{ draft: SupplierDraft }>(response);
      setSupplierDraft(data.draft);
      setSupplierPublish(true);
      toast.success("Draft ready — review it and save.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to draft supplier.");
    } finally {
      setDrafting(false);
    }
  }

  function updateDraftProvider<K extends keyof ProviderDraft>(key: K, value: ProviderDraft[K]) {
    setSupplierDraft((draft) =>
      draft ? { ...draft, provider: { ...draft.provider, [key]: value } } : draft,
    );
  }

  function updateDraftItem(index: number, patch: Partial<ItemDraft>) {
    setSupplierDraft((draft) =>
      draft
        ? {
            ...draft,
            items: draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
          }
        : draft,
    );
  }

  function removeDraftItem(index: number) {
    setSupplierDraft((draft) =>
      draft ? { ...draft, items: draft.items.filter((_, i) => i !== index) } : draft,
    );
  }

  async function saveSupplier() {
    if (!supplierDraft) return;
    setSavingSupplier(true);

    const cities = splitCities(supplierDraft.provider.coverageCities);
    const payload = {
      provider: {
        name: supplierDraft.provider.name,
        category: supplierDraft.provider.category,
        website: supplierDraft.provider.website,
        coverageCities: cities.length > 0 ? cities : ["Abu Dhabi"],
        contactName: supplierDraft.provider.contactName,
        contactEmail: supplierDraft.provider.contactEmail,
        contactPhone: supplierDraft.provider.contactPhone,
        leadMethod: supplierDraft.provider.leadMethod,
        commercialModel: supplierDraft.provider.commercialModel,
        integrationStatus: supplierDraft.provider.integrationStatus,
        priority: supplierDraft.provider.priority,
        nextStep: supplierDraft.provider.nextStep,
        active: supplierPublish,
      },
      items: supplierDraft.items.map((item) => ({
        type: item.type,
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        unit: item.unit,
        availability: item.availability,
        deliveryWindow: item.deliveryWindow,
        checkoutMethod: item.checkoutMethod,
        active: supplierPublish,
      })),
    };

    try {
      const response = await fetch("/api/admin/supplier", {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<{ provider: ProviderRecord; items: CatalogItemRecord[] }>(
        response,
      );
      toast.success(
        `Saved ${data.provider.name} with ${data.items.length} item(s)${
          supplierPublish ? "" : " (hidden until published)"
        }.`,
      );
      setSupplierDraft(null);
      setSupplierText("");
      await loadSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save supplier.");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function saveProvider(event: FormEvent) {
    event.preventDefault();
    const body: ProviderUpsert = {
      ...providerForm,
      coverageCities: splitCities(providerForm.coverageCities),
    };

    try {
      const response = await fetch("/api/admin/providers", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      await readJson<{ provider: ProviderRecord }>(response);
      toast.success("Provider saved.");
      setProviderForm(EMPTY_PROVIDER);
      await loadSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save provider.";
      toast.error(message);
    }
  }

  async function saveCatalogItem(event: FormEvent) {
    event.preventDefault();
    const body: CatalogItemUpsert = {
      ...catalogForm,
      rating: Number(catalogForm.rating),
      source: "manual",
    };

    try {
      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      await readJson<{ item: CatalogItemRecord }>(response);
      toast.success("Catalog item saved.");
      setCatalogForm({
        ...EMPTY_CATALOG_ITEM,
        providerKey: catalogForm.providerKey || providerOptions[0]?.key || "",
      });
      await loadSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save catalog item.";
      toast.error(message);
    }
  }

  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [openDeskId, setOpenDeskId] = useState<string | null>(null);
  const [deskBusy, setDeskBusy] = useState<string | null>(null);

  async function runMoveDesk(
    id: string,
    action: "briefs" | "quotes" | "recommendation",
    rawQuotes?: string,
  ) {
    setDeskBusy(action);

    try {
      const response = await fetch("/api/admin/move-desk", {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, rawQuotes }),
      });
      await readJson<{ inquiry: unknown }>(response);
      toast.success(
        action === "briefs"
          ? "Provider briefs ready."
          : action === "quotes"
            ? "Quotes compared."
            : "Reply drafted.",
      );
      await loadSnapshot();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Move desk action failed.");
    } finally {
      setDeskBusy(null);
    }
  }

  async function generateIntelligence(id: string) {
    setGeneratingId(id);

    try {
      const response = await fetch("/api/admin/inquiry-intelligence", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      await readJson<{ inquiry: unknown }>(response);
      toast.success("AI summary and plan regenerated.");
      await loadSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate AI summary.";
      toast.error(message);
    } finally {
      setGeneratingId(null);
    }
  }

  const [mappingCsv, setMappingCsv] = useState(false);

  async function mapCsvWithAi() {
    setMappingCsv(true);

    try {
      const response = await fetch("/api/admin/catalog-map", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv: csvText }),
      });
      const result = await readJson<{ csv: string; notes: string; rows: number }>(response);
      setCsvText(result.csv);
      toast.success(`Mapped ${result.rows} rows to the SettleSide format. Review, then import.`);
      if (result.notes) {
        toast.info(result.notes);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to map the CSV.";
      toast.error(message);
    } finally {
      setMappingCsv(false);
    }
  }

  async function importCsv(event: FormEvent) {
    event.preventDefault();

    try {
      const response = await fetch("/api/admin/catalog-import", {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csv: csvText,
          defaultProviderKey: csvProviderKey || undefined,
          defaultType: csvType,
        }),
      });
      const result = await readJson<CsvImportResult>(response);
      toast.success(`Imported ${result.imported} rows.`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} rows need attention.`);
      }
      await loadSnapshot();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to import CSV.";
      toast.error(message);
    }
  }

  if (authState !== "ready") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        {authState === "checking" ? (
          <div className="text-sm text-muted-foreground">Checking access...</div>
        ) : (
          <form onSubmit={handleLogin} className="w-full max-w-sm border border-border bg-card p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center bg-teal text-primary-foreground">
                <Database className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-sans text-lg font-semibold tracking-normal">
                  SettleSide Admin
                </h1>
                <p className="text-sm text-muted-foreground">Sign in to continue</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </Field>
              <Button
                type="submit"
                disabled={loggingIn}
                className="bg-teal text-primary-foreground hover:bg-teal/90"
              >
                {loggingIn ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        )}
        <Toaster richColors position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-teal text-primary-foreground">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-sans text-xl font-semibold tracking-normal">
                SettleSide Catalog Ops
              </h1>
              <p className="text-sm text-muted-foreground">
                Providers, catalog items, imports, and lead readiness
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.email}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => loadSnapshot()}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {session && (
              <Button type="button" variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Stat label="Providers" value={snapshot?.stats.activeProviders ?? "-"} />
          <Stat label="Items" value={snapshot?.stats.activeCatalogItems ?? "-"} />
          <Stat label="Products" value={snapshot?.stats.products ?? "-"} />
          <Stat label="Services" value={snapshot?.stats.services ?? "-"} />
          <Stat label="Need APIs" value={snapshot?.stats.apiNeeded ?? "-"} />
          <Stat label="Inquiries" value={snapshot?.stats.inquiries ?? "-"} />
        </section>

        <section className="border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center bg-teal text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-sans text-lg font-semibold tracking-normal">Add a supplier</h2>
              <p className="text-sm text-muted-foreground">
                Describe the provider in plain English — name, what they do, prices, contact. AI
                turns it into a provider and its services for you to review before saving.
              </p>
            </div>
          </div>

          <Textarea
            rows={3}
            value={supplierText}
            onChange={(event) => setSupplierText(event.target.value)}
            placeholder={
              'e.g. "Bin Yaber Movers, Abu Dhabi. Villa and apartment moves from AED 1,200, ' +
              'quote within 24h. Also packing and short-term storage. WhatsApp +971 50 123 4567."'
            }
          />
          <div className="mt-3">
            <Button
              type="button"
              onClick={draftSupplier}
              disabled={drafting || supplierText.trim().length < 10}
              className="bg-teal text-primary-foreground hover:bg-teal/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {drafting ? "Drafting..." : "Draft with AI"}
            </Button>
          </div>

          {supplierDraft && (
            <div className="mt-5 border-t border-border pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Provider name">
                  <Input
                    value={supplierDraft.provider.name}
                    onChange={(event) => updateDraftProvider("name", event.target.value)}
                  />
                </Field>
                <Field label="Category">
                  <Input
                    value={supplierDraft.provider.category}
                    onChange={(event) => updateDraftProvider("category", event.target.value)}
                  />
                </Field>
                <Field label="Coverage cities">
                  <Input
                    value={supplierDraft.provider.coverageCities}
                    onChange={(event) => updateDraftProvider("coverageCities", event.target.value)}
                  />
                </Field>
                <Field label="Website">
                  <Input
                    value={supplierDraft.provider.website}
                    onChange={(event) => updateDraftProvider("website", event.target.value)}
                  />
                </Field>
                <Field label="Contact phone / WhatsApp">
                  <Input
                    value={supplierDraft.provider.contactPhone}
                    onChange={(event) => updateDraftProvider("contactPhone", event.target.value)}
                  />
                </Field>
                <Field label="Contact email">
                  <Input
                    value={supplierDraft.provider.contactEmail}
                    onChange={(event) => updateDraftProvider("contactEmail", event.target.value)}
                  />
                </Field>
                <Field label="Integration">
                  <Select
                    value={supplierDraft.provider.integrationStatus}
                    onValueChange={(value) =>
                      updateDraftProvider(
                        "integrationStatus",
                        value as ProviderDraft["integrationStatus"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="api-needed">API needed</SelectItem>
                      <SelectItem value="api-connected">API connected</SelectItem>
                      <SelectItem value="partner-ready">Partner ready</SelectItem>
                      <SelectItem value="mock">Mock</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select
                    value={supplierDraft.provider.priority}
                    onValueChange={(value) =>
                      updateDraftProvider("priority", value as ProviderDraft["priority"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="mt-5 grid gap-3">
                {supplierDraft.items.map((item, index) => (
                  <div key={index} className="border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Item {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDraftItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name">
                        <Input
                          value={item.name}
                          onChange={(event) => updateDraftItem(index, { name: event.target.value })}
                        />
                      </Field>
                      <Field label="Category">
                        <Input
                          value={item.category}
                          onChange={(event) =>
                            updateDraftItem(index, { category: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Type">
                        <Select
                          value={item.type}
                          onValueChange={(value) =>
                            updateDraftItem(index, { type: value as ItemDraft["type"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Price">
                        <Input
                          value={item.price}
                          onChange={(event) =>
                            updateDraftItem(index, { price: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Availability">
                        <Input
                          value={item.availability}
                          onChange={(event) =>
                            updateDraftItem(index, { availability: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Delivery / lead time">
                        <Input
                          value={item.deliveryWindow}
                          onChange={(event) =>
                            updateDraftItem(index, { deliveryWindow: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                {supplierDraft.items.length === 0 && (
                  <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No items yet. Add detail to the description and re-draft, or save the provider
                    on its own.
                  </div>
                )}
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={supplierPublish}
                  onCheckedChange={(value) => setSupplierPublish(value === true)}
                />
                Publish to the live site now (untick to save hidden until you confirm terms)
              </label>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={saveSupplier}
                  disabled={
                    savingSupplier ||
                    supplierDraft.provider.name.trim().length < 2 ||
                    supplierDraft.provider.category.trim().length < 2
                  }
                  className="bg-teal text-primary-foreground hover:bg-teal/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingSupplier ? "Saving..." : "Save supplier"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSupplierDraft(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveProvider} className="border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-lg font-semibold tracking-normal">Provider</h2>
                <p className="text-sm text-muted-foreground">
                  Add partner details, coverage, and commercial readiness.
                </p>
              </div>
              <Button type="submit" className="bg-teal text-primary-foreground hover:bg-teal/90">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  required
                  value={providerForm.name}
                  onChange={(event) =>
                    setProviderForm((form) => ({ ...form, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Category">
                <Input
                  required
                  value={providerForm.category}
                  onChange={(event) =>
                    setProviderForm((form) => ({ ...form, category: event.target.value }))
                  }
                />
              </Field>
              <Field label="Website">
                <Input
                  value={providerForm.website}
                  onChange={(event) =>
                    setProviderForm((form) => ({ ...form, website: event.target.value }))
                  }
                />
              </Field>
              <Field label="Coverage cities">
                <Input
                  value={providerForm.coverageCities}
                  onChange={(event) =>
                    setProviderForm((form) => ({ ...form, coverageCities: event.target.value }))
                  }
                />
              </Field>
              <Field label="Lead method">
                <Select
                  value={providerForm.leadMethod}
                  onValueChange={(value) =>
                    setProviderForm((form) => ({
                      ...form,
                      leadMethod: value as ProviderUpsert["leadMethod"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Commercial model">
                <Select
                  value={providerForm.commercialModel}
                  onValueChange={(value) =>
                    setProviderForm((form) => ({
                      ...form,
                      commercialModel: value as ProviderUpsert["commercialModel"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="markup">Markup</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Integration">
                <Select
                  value={providerForm.integrationStatus}
                  onValueChange={(value) =>
                    setProviderForm((form) => ({
                      ...form,
                      integrationStatus: value as ProviderUpsert["integrationStatus"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="api-needed">API needed</SelectItem>
                    <SelectItem value="api-connected">API connected</SelectItem>
                    <SelectItem value="partner-ready">Partner ready</SelectItem>
                    <SelectItem value="mock">Mock</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={providerForm.priority}
                  onValueChange={(value) =>
                    setProviderForm((form) => ({
                      ...form,
                      priority: value as ProviderUpsert["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Contact email">
                <Input
                  value={providerForm.contactEmail}
                  onChange={(event) =>
                    setProviderForm((form) => ({ ...form, contactEmail: event.target.value }))
                  }
                />
              </Field>
              <Field label="Contact phone">
                <Input
                  value={providerForm.contactPhone}
                  onChange={(event) =>
                    setProviderForm((form) => ({ ...form, contactPhone: event.target.value }))
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Next step">
                  <Textarea
                    rows={3}
                    value={providerForm.nextStep}
                    onChange={(event) =>
                      setProviderForm((form) => ({ ...form, nextStep: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
                <Checkbox
                  checked={providerForm.active}
                  onCheckedChange={(value) =>
                    setProviderForm((form) => ({ ...form, active: value === true }))
                  }
                />
                Published on the live site (untick to keep as a hidden prospect)
              </label>
            </div>
          </form>

          <form onSubmit={saveCatalogItem} className="border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-lg font-semibold tracking-normal">Catalog item</h2>
                <p className="text-sm text-muted-foreground">
                  Add products or service packages in the normalized SettleSide format.
                </p>
              </div>
              <Button type="submit" className="bg-teal text-primary-foreground hover:bg-teal/90">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provider">
                <Select
                  value={catalogForm.providerKey}
                  onValueChange={(value) =>
                    setCatalogForm((form) => ({ ...form, providerKey: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider.key} value={provider.key}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Type">
                <Select
                  value={catalogForm.type}
                  onValueChange={(value) =>
                    setCatalogForm((form) => ({
                      ...form,
                      type: value as CatalogItemUpsert["type"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Name">
                <Input
                  required
                  value={catalogForm.name}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Category">
                <Input
                  required
                  value={catalogForm.category}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, category: event.target.value }))
                  }
                />
              </Field>
              <Field label="Price">
                <Input
                  value={catalogForm.price}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, price: event.target.value }))
                  }
                />
              </Field>
              <Field label="Availability">
                <Input
                  value={catalogForm.availability}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, availability: event.target.value }))
                  }
                />
              </Field>
              <Field label="Delivery / lead time">
                <Input
                  value={catalogForm.deliveryWindow}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, deliveryWindow: event.target.value }))
                  }
                />
              </Field>
              <Field label="City">
                <Input
                  value={catalogForm.city}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, city: event.target.value }))
                  }
                />
              </Field>
              <Field label="Checkout method">
                <Select
                  value={catalogForm.checkoutMethod}
                  onValueChange={(value) =>
                    setCatalogForm((form) => ({
                      ...form,
                      checkoutMethod: value as CatalogItemUpsert["checkoutMethod"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="affiliate-link">Affiliate link</SelectItem>
                    <SelectItem value="checkout">Checkout</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Rating">
                <Input
                  value={catalogForm.rating}
                  onChange={(event) =>
                    setCatalogForm((form) => ({ ...form, rating: event.target.value }))
                  }
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea
                    rows={3}
                    value={catalogForm.description}
                    onChange={(event) =>
                      setCatalogForm((form) => ({ ...form, description: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
                <Checkbox
                  checked={catalogForm.active}
                  onCheckedChange={(value) =>
                    setCatalogForm((form) => ({ ...form, active: value === true }))
                  }
                />
                Published on the live site (untick to keep hidden)
              </label>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={importCsv} className="border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-sans text-lg font-semibold tracking-normal">CSV import</h2>
                <p className="text-sm text-muted-foreground">
                  Paste provider catalog rows with headers to create or update items. Arbitrary
                  provider columns? Map with AI first, review, then import.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={mappingCsv}
                  onClick={mapCsvWithAi}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {mappingCsv ? "Mapping..." : "Map with AI"}
                </Button>
                <Button type="submit" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <Field label="Fallback provider">
                <Select value={csvProviderKey} onValueChange={setCsvProviderKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider.key} value={provider.key}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fallback type">
                <Select
                  value={csvType}
                  onValueChange={(value) => setCsvType(value as "product" | "service")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Textarea
              rows={10}
              value={csvText}
              onChange={(event) => setCsvText(event.target.value)}
              className="font-mono text-xs"
            />
          </form>

          <section className="border border-border bg-card p-5">
            <div className="mb-5">
              <h2 className="font-sans text-lg font-semibold tracking-normal">Recent inquiries</h2>
              <p className="text-sm text-muted-foreground">
                Latest customer requests captured by the website form.
              </p>
            </div>
            <div className="grid gap-3">
              {recentInquiries.length === 0 && (
                <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No inquiries yet.
                </div>
              )}
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-foreground">{inquiry.inquiry.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {inquiry.planSource && (
                        <Badge variant="outline">plan: {inquiry.planSource}</Badge>
                      )}
                      <Badge variant="outline">{inquiry.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {inquiry.inquiry.origin || "Unknown origin"} to {inquiry.inquiry.destination}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {inquiry.id} - {new Date(inquiry.createdAt).toLocaleString()}
                  </div>
                  {inquiry.adminSummary ? (
                    <div className="mt-3 border border-teal/30 bg-teal/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI summary
                        </div>
                        <Badge variant={URGENCY_VARIANT[inquiry.adminSummary.urgency]}>
                          {inquiry.adminSummary.urgency} urgency
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-foreground">
                        {inquiry.adminSummary.headline}
                      </p>
                      {inquiry.adminSummary.revenueOpportunities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {inquiry.adminSummary.revenueOpportunities.map((opportunity) => (
                            <Badge key={opportunity} variant="secondary">
                              {opportunity}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Next: </span>
                        {inquiry.adminSummary.nextAction}
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={generatingId === inquiry.id}
                      onClick={() => generateIntelligence(inquiry.id)}
                    >
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      {generatingId === inquiry.id ? "Generating..." : "Generate AI summary"}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      setOpenDeskId((current) => (current === inquiry.id ? null : inquiry.id))
                    }
                  >
                    {openDeskId === inquiry.id ? "Close move desk" : "Open move desk"}
                  </Button>

                  {openDeskId === inquiry.id && (
                    <MoveDesk
                      inquiry={inquiry}
                      busy={deskBusy}
                      onRun={(action, rawQuotes) => runMoveDesk(inquiry.id, action, rawQuotes)}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTable
            title="Providers"
            rows={snapshot?.providers ?? []}
            columns={["name", "category", "priority", "active"]}
            onEdit={(row) => setProviderForm(providerFormFromRecord(row as ProviderRecord))}
          />
          <DataTable
            title="Catalog"
            rows={snapshot?.catalogItems ?? []}
            columns={["name", "category", "providerKey", "price", "active"]}
            onEdit={(row) => setCatalogForm(catalogFormFromRecord(row as CatalogItemRecord))}
          />
        </section>
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DataTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  onEdit,
}: {
  title: string;
  rows: T[];
  columns: string[];
  onEdit: (row: T) => void;
}) {
  return (
    <section className="overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-sans text-lg font-semibold tracking-normal">{title}</h2>
        <Badge variant="secondary">{rows.length}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-sand text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? row.key ?? index)} className="border-t border-border">
                {columns.map((column) => (
                  <td key={column} className="max-w-[220px] truncate px-4 py-3">
                    {String(row[column] ?? "")}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
