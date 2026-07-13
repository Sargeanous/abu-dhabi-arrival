import "@tanstack/react-start/server-only";

import Anthropic from "@anthropic-ai/sdk";
import { ZodError } from "zod";

import {
  CATALOG_CSV_FIELDS,
  catalogCsvMappingSchema,
  HELP_OPTIONS,
  moveIntakeDraftSchema,
  moveIntelligenceSchema,
  supplierDraftSchema,
  type CatalogCsvMapping,
  type InquiryInput,
  type MarketplaceSnapshot,
  type MoveIntakeParseResult,
  type MoveIntelligence,
  type SupplierDraft,
} from "./settleside.schemas";

const DEFAULT_MODEL = "claude-opus-4-8";

export function aiModel() {
  return process.env.SETTLESIDE_AI_MODEL || DEFAULT_MODEL;
}

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const INTAKE_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "email",
    "whatsapp",
    "origin",
    "destination",
    "moveDate",
    "household",
    "status",
    "pet",
    "help",
    "message",
  ],
  properties: {
    name: { type: "string", description: "Customer's full name if stated, else empty string." },
    email: { type: "string", description: "Email address if stated, else empty string." },
    whatsapp: {
      type: "string",
      description: "Phone or WhatsApp number if stated, else empty string.",
    },
    origin: {
      type: "string",
      description: "City (and country) they are moving from, else empty string.",
    },
    destination: {
      type: "string",
      description: "City (and country) they are moving to, else empty string.",
    },
    moveDate: {
      type: "string",
      description:
        "Target move date as YYYY-MM-DD. Resolve relative dates against today's date; if only a month is given, use the first day of that month. Empty string if no date is mentioned.",
    },
    household: { type: "string", enum: ["", "alone", "couple", "family", "unsure"] },
    status: {
      type: "string",
      enum: ["", "exploring", "planning", "signed", "imminent", "arrived"],
    },
    pet: { type: "string", enum: ["no", "dog", "cat", "multiple", "other"] },
    help: {
      type: "array",
      items: { type: "string", enum: [...HELP_OPTIONS] },
      description: "Every help option the described needs clearly map to.",
    },
    message: {
      type: "string",
      description:
        "One or two plain-language sentences of remaining context worth passing to the operations team, else empty string.",
    },
  },
};

function intakeSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `You are the move intake parser for SettleSide, a relocation concierge. Extract structured move details from the customer's free-text description of their move.

Today's date is ${today}.

Rules:
- Only extract what the customer actually said. Never invent names, contact details, dates, or places. Use an empty string ("" ), "no" for pet, or an empty help array when something is not mentioned.
- household: "alone", "couple", or "family" based on who is moving with them; "unsure" only if they say they don't know yet.
- status: "exploring" (just researching), "planning" (actively planning), "signed" (home already secured), "imminent" (moving within roughly 30 days of today), "arrived" (already at the destination).
- help: select every option their described needs clearly map to. Examples: sofas, beds, or furnishing a home maps to "Furniture & mattress"; cookware or day-one supplies maps to "Kitchen & essentials"; wifi, broadband, or utilities maps to "Internet & utilities"; TV mounting or assembly maps to "Handyman / installation"; shipping belongings or mover quotes maps to "Movers & shipping"; visas, schools, or daycare maps to "Family & school search (optional)"; any pet maps to "Pet relocation (optional)".
- message: condense any remaining relevant context (budget, priorities, special items, constraints) into one or two sentences for the operations team. Empty string if nothing remains.`;
}

type StructuredCallResult =
  | { ok: true; text: string; model: string }
  | {
      ok: false;
      reason: "not-configured" | "unavailable" | "parse-failed";
      message: string;
    };

async function structuredCall(options: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}): Promise<StructuredCallResult> {
  if (!isAiConfigured()) {
    return {
      ok: false,
      reason: "not-configured",
      message:
        "The AI assistant is not configured on this server. Set ANTHROPIC_API_KEY to enable it.",
    };
  }

  try {
    const response = await getClient().messages.create({
      model: aiModel(),
      max_tokens: options.maxTokens,
      system: options.system,
      messages: [{ role: "user", content: options.user }],
      output_config: {
        format: {
          type: "json_schema",
          schema: options.schema,
        },
      },
    });

    if (response.stop_reason === "refusal") {
      return {
        ok: false,
        reason: "parse-failed",
        message: "The AI assistant declined to process this request.",
      };
    }

    if (response.stop_reason === "max_tokens") {
      return {
        ok: false,
        reason: "parse-failed",
        message: "The AI response was cut short. Please try shorter input.",
      };
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return { ok: true, text, model: response.model };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return {
        ok: false,
        reason: "unavailable",
        message: "The AI assistant's credentials were rejected. Check ANTHROPIC_API_KEY.",
      };
    }

    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        reason: "unavailable",
        message: "The AI assistant is receiving too many requests. Please try again in a moment.",
      };
    }

    if (error instanceof Anthropic.APIError) {
      console.error("SettleSide AI error:", error.status, error.message);
      return {
        ok: false,
        reason: "unavailable",
        message: "The AI assistant is temporarily unavailable.",
      };
    }

    throw error;
  }
}

const INTELLIGENCE_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["plan", "adminSummary"],
  properties: {
    plan: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "tasks"],
      properties: {
        summary: {
          type: "string",
          description: "One sentence describing the plan for this specific move.",
        },
        tasks: {
          type: "array",
          description: "6 to 10 tasks in chronological order.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "timing", "owner", "category"],
            properties: {
              title: { type: "string", description: "Short, actionable task title." },
              timing: {
                type: "string",
                description:
                  'A concrete date "YYYY-MM-DD" when the move date allows it, otherwise a short label like "Within 48 hours" or "Move-in week".',
              },
              owner: { type: "string", enum: ["SettleSide", "Customer", "Provider"] },
              category: {
                type: "string",
                description:
                  'Marketplace category vocabulary where it fits, e.g. "Move planning", "Movers & shipping", "Furniture & mattress", "Internet & utilities", "Cleaning", "Handyman & install", "Insurance", "Storage", "Pet relocation".',
              },
            },
          },
        },
      },
    },
    adminSummary: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "urgency", "revenueOpportunities", "nextAction"],
      properties: {
        headline: {
          type: "string",
          description:
            "One compact sentence for the operations team: who is moving, route, date, household, pets, and where they are in the process.",
        },
        urgency: { type: "string", enum: ["low", "medium", "high"] },
        revenueOpportunities: {
          type: "array",
          items: { type: "string" },
          description:
            "Marketplace categories this customer is likely to pay for, most valuable first.",
        },
        nextAction: {
          type: "string",
          description: "The single most useful next step for the operations team.",
        },
      },
    },
  },
};

function intelligenceSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `You are the move-planning engine for SettleSide, a relocation concierge. Given a customer's move inquiry and the marketplace options available at their destination, produce a personalized move plan and an internal summary for the operations team.

Today's date is ${today}.

Rules for plan:
- Produce 6 to 10 tasks in chronological order.
- timing: use a concrete "YYYY-MM-DD" date when a move date is known (working backwards or forwards from it), otherwise a short label such as "Within 48 hours", "After address confirmation", or "Move-in week".
- owner: "SettleSide" for concierge and coordination work, "Provider" for work executed by partners (movers, telcos, cleaners, handymen, insurers), "Customer" for things only the customer can do (documents, decisions, approvals).
- Tailor the plan to the inquiry. Pets need document and airline/import checks as early as possible. Families may need school or daycare timing. If status is "imminent" or "arrived", compress the timeline and drop pre-move tasks that no longer apply.
- Ground tasks in the marketplace services provided (respect their lead times). Do not invent specific provider names.
- plan.summary: one sentence describing the plan for this specific move, mentioning destination and origin if known.

Rules for adminSummary (internal only, never shown to the customer):
- headline: one compact sentence covering who, route, date, household, pets, and process status.
- urgency: "high" when the move is within roughly 30 days of today or status is "imminent"/"arrived"; "medium" when the move is within roughly 90 days or the customer is actively planning with a date; "low" when they are exploring or the date is distant/unknown.
- revenueOpportunities: marketplace categories this customer will likely pay for, most valuable first.
- nextAction: one concrete step the operations team should take first (e.g. which quotes to collect, what to confirm with the customer).`;
}

export async function generateMoveIntelligence(
  inquiry: InquiryInput,
  marketplace: MarketplaceSnapshot,
): Promise<MoveIntelligence | null> {
  const planInput = {
    inquiry: {
      origin: inquiry.origin,
      destination: inquiry.destination,
      moveDate: inquiry.moveDate,
      household: inquiry.household,
      status: inquiry.status,
      pet: inquiry.pet,
      helpRequested: inquiry.help,
      customerNotes: inquiry.message,
    },
    marketplace: {
      serviceOptions: marketplace.services.map((service) => ({
        category: service.category,
        providers: service.providers,
        leadTime: service.leadTime,
      })),
      productCategories: Array.from(
        new Set(marketplace.products.map((product) => product.category)),
      ),
    },
  };

  const call = await structuredCall({
    system: intelligenceSystemPrompt(),
    user: JSON.stringify(planInput, null, 2),
    schema: INTELLIGENCE_OUTPUT_SCHEMA,
    maxTokens: 3072,
  });

  if (!call.ok) {
    if (call.reason !== "not-configured") {
      console.error("SettleSide AI plan generation failed:", call.reason, call.message);
    }
    return null;
  }

  try {
    return moveIntelligenceSchema.parse(JSON.parse(call.text));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      console.error("SettleSide AI plan produced an unexpected shape:", error);
      return null;
    }

    throw error;
  }
}

// Plain strings with "" as "no mapping" - nullable unions would exceed the
// structured-outputs limit of 16 union-typed parameters per schema.
const csvFieldMapProperties = Object.fromEntries(
  CATALOG_CSV_FIELDS.map((field) => [field, { type: "string" }]),
);

const CSV_MAPPING_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["columnMap", "defaults", "notes"],
  properties: {
    columnMap: {
      type: "object",
      additionalProperties: false,
      required: [...CATALOG_CSV_FIELDS],
      description:
        "For each catalog field, the EXACT source column header that supplies it, or an empty string when no column matches.",
      properties: csvFieldMapProperties,
    },
    defaults: {
      type: "object",
      additionalProperties: false,
      required: [...CATALOG_CSV_FIELDS],
      description:
        "For each catalog field with no source column, a constant value that clearly applies to every row in this file, or an empty string. Never guess.",
      properties: csvFieldMapProperties,
    },
    notes: {
      type: "string",
      description:
        "One or two sentences for the operations team: ambiguities, unmapped source columns worth knowing about, or assumptions made.",
    },
  },
};

function csvMappingSystemPrompt() {
  return `You are the catalog CSV mapper for SettleSide, a relocation marketplace. Providers send catalog files with arbitrary column names. Map their columns onto SettleSide's canonical catalog fields.

Canonical fields and their meaning:
- id: stable item identifier or SKU (optional).
- providerKey: SettleSide provider key (rarely present in provider files; usually null).
- type: "product" (physical goods) or "service" (bookable work).
- category: product/service grouping, e.g. "Sofa", "Mattress", "Cleaning".
- name: the item's display name.
- description: free-text description.
- price: display price, e.g. "AED 2,199" or "From AED 450".
- currency: ISO-like currency code, e.g. "AED".
- unit: billing unit, e.g. "one-time", "monthly", "per booking".
- city: coverage city.
- availability: stock or availability text, e.g. "In stock", "8 providers".
- deliveryWindow: delivery or lead time, e.g. "2-4 days".
- rating: numeric rating 0-5.
- active: whether the row is active/listed (true/false-like values).
- checkoutMethod: one of "lead", "affiliate-link", "checkout", "booking", "manual".
- checkoutUrl: product or booking URL.
- commissionModel: commercial terms text.

Rules:
- columnMap values must be EXACT header strings from the provided headers, or an empty string ("") when no column matches. Never invent headers.
- Map a column only when you are confident. A column that fits nothing stays unmapped (mention it in notes if it looks important).
- defaults: only set a constant when the sample rows make it unambiguous for the whole file (e.g. every price says "AED" so currency = "AED"; all rows are clearly physical goods so type = "product"). Otherwise an empty string.
- Do not set defaults for name or category; those must come from columns.
- notes: brief, for the operations team.`;
}

export async function mapCatalogCsvColumns(
  headers: string[],
  sampleRows: Array<Record<string, string>>,
): Promise<CatalogCsvMapping | null> {
  const call = await structuredCall({
    system: csvMappingSystemPrompt(),
    user: JSON.stringify({ headers, sampleRows }, null, 2),
    schema: CSV_MAPPING_OUTPUT_SCHEMA,
    maxTokens: 1536,
  });

  if (!call.ok) {
    if (call.reason !== "not-configured") {
      console.error("SettleSide AI CSV mapping failed:", call.reason, call.message);
    }
    return null;
  }

  try {
    return catalogCsvMappingSchema.parse(JSON.parse(call.text));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      console.error("SettleSide AI CSV mapping produced an unexpected shape:", error);
      return null;
    }

    throw error;
  }
}

const SUPPLIER_OUTPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["provider", "items"],
  properties: {
    provider: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "category",
        "website",
        "coverageCities",
        "contactName",
        "contactEmail",
        "contactPhone",
        "leadMethod",
        "commercialModel",
        "integrationStatus",
        "priority",
        "nextStep",
      ],
      properties: {
        name: { type: "string", description: "Provider or company name." },
        category: {
          type: "string",
          description:
            'Short provider category, e.g. "Movers and shipping", "Internet and utilities", "Furniture and home essentials", "Cleaning".',
        },
        website: { type: "string", description: "Website URL if stated, else empty string." },
        coverageCities: {
          type: "string",
          description:
            'Comma-separated cities served, e.g. "Abu Dhabi, Dubai". Default "Abu Dhabi".',
        },
        contactName: {
          type: "string",
          description: "Contact person if stated, else empty string.",
        },
        contactEmail: { type: "string", description: "Email if stated, else empty string." },
        contactPhone: {
          type: "string",
          description: "Phone or WhatsApp number if stated, else empty string.",
        },
        leadMethod: { type: "string", enum: ["email", "whatsapp", "api", "manual"] },
        commercialModel: {
          type: "string",
          enum: ["commission", "referral", "markup", "subscription", "none", "unknown"],
        },
        integrationStatus: {
          type: "string",
          enum: ["mock", "manual", "csv", "api-needed", "api-connected", "partner-ready"],
        },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        nextStep: {
          type: "string",
          description: "One short onboarding next step, else empty string.",
        },
      },
    },
    items: {
      type: "array",
      description: "Each distinct product or service the provider offers (at least one).",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "type",
          "category",
          "name",
          "description",
          "price",
          "unit",
          "availability",
          "deliveryWindow",
          "checkoutMethod",
        ],
        properties: {
          type: { type: "string", enum: ["product", "service"] },
          category: {
            type: "string",
            description:
              'Short grouping, e.g. "Movers & shipping", "Internet", "Sofa", "Cleaning".',
          },
          name: { type: "string", description: "Item or offer name." },
          description: { type: "string" },
          price: {
            type: "string",
            description:
              'Display price exactly as stated, e.g. "AED 1,200", "From AED 450". Use "Quote required" when no price is given - never invent one.',
          },
          unit: {
            type: "string",
            description:
              'Billing unit if clear, e.g. "one-time", "monthly", "per move". Else empty.',
          },
          availability: { type: "string", description: "Availability text, else empty string." },
          deliveryWindow: {
            type: "string",
            description: "Lead time if stated, else empty string.",
          },
          checkoutMethod: {
            type: "string",
            enum: ["lead", "affiliate-link", "checkout", "booking", "manual"],
          },
        },
      },
    },
  },
};

function supplierIntakeSystemPrompt() {
  return `You are the supplier onboarding assistant for SettleSide, a relocation marketplace in the UAE (default city Abu Dhabi). Turn the operator's free-text description of a provider into one structured provider record plus its catalog items (the products or services it offers).

Rules:
- Extract only what the description states. Never invent prices, phone numbers, or websites. Use "Quote required" for price when none is given, and empty strings for unknown text fields.
- Split the offering into separate items when the provider clearly does distinct things (e.g. a mover that also offers storage becomes two items).
- type: "product" for physical goods, "service" for bookable work.
- coverageCities: comma-separated; default "Abu Dhabi" if not stated.
- Sensible enum defaults: leadMethod "manual" (or "whatsapp"/"email" when a channel is given), commercialModel "unknown", integrationStatus "manual", priority "medium", checkoutMethod "lead" for services and quotes (use "affiliate-link" or "checkout" only when an online purchase link is described).
- Keep category names short and human.`;
}

export async function parseSupplierIntake(text: string): Promise<SupplierDraft | null> {
  const call = await structuredCall({
    system: supplierIntakeSystemPrompt(),
    user: text,
    schema: SUPPLIER_OUTPUT_SCHEMA,
    maxTokens: 2048,
  });

  if (!call.ok) {
    if (call.reason !== "not-configured") {
      console.error("SettleSide AI supplier intake failed:", call.reason, call.message);
    }
    return null;
  }

  try {
    return supplierDraftSchema.parse(JSON.parse(call.text));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      console.error("SettleSide AI supplier intake produced an unexpected shape:", error);
      return null;
    }

    throw error;
  }
}

export async function parseMoveIntake(description: string): Promise<MoveIntakeParseResult> {
  const call = await structuredCall({
    system: intakeSystemPrompt(),
    user: description,
    schema: INTAKE_OUTPUT_SCHEMA,
    maxTokens: 1024,
  });

  if (!call.ok) {
    return call;
  }

  try {
    const draft = moveIntakeDraftSchema.parse(JSON.parse(call.text));
    return { ok: true, draft, model: call.model };
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      console.error("SettleSide AI intake produced an unexpected shape:", error);
      return {
        ok: false,
        reason: "parse-failed",
        message:
          "We couldn't turn that description into a form draft. Please fill the form manually.",
      };
    }

    throw error;
  }
}
