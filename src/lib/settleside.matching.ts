import type {
  CatalogItemRecord,
  HelpOption,
  InquiryInput,
  MatchInsight,
  ProviderRecord,
} from "./settleside.schemas";

const HELP_KEYWORDS: Record<HelpOption, string[]> = {
  "Movers & shipping": ["mover", "moving", "shipping", "relocat", "freight"],
  "Furniture & mattress": ["furniture", "sofa", "mattress", "bed", "wardrobe", "dining", "living"],
  "Kitchen & essentials": ["kitchen", "essentials", "cookware", "tableware", "appliance"],
  Cleaning: ["clean"],
  "Internet & utilities": ["internet", "fiber", "wifi", "broadband", "utilit", "telco"],
  "Handyman / installation": ["handyman", "install", "mount", "assembly", "curtain"],
  Insurance: ["insurance", "cover", "policy"],
  Storage: ["storage"],
  "Pet relocation (optional)": ["pet", "dog", "cat"],
  "Family & school search (optional)": ["school", "daycare", "nursery", "family"],
};

const PET_KEYWORDS = ["pet", "dog", "cat"];
const FAMILY_KEYWORDS = ["school", "daycare", "nursery", "family"];

const INTEGRATION_SCORE: Record<ProviderRecord["integrationStatus"], number> = {
  "api-connected": 15,
  "partner-ready": 12,
  csv: 8,
  manual: 5,
  "api-needed": 2,
  mock: 0,
};

const INTEGRATION_REASON: Partial<Record<ProviderRecord["integrationStatus"], string>> = {
  "api-connected": "API-connected provider",
  "partner-ready": "Partner-ready provider",
};

const PRIORITY_SCORE: Record<ProviderRecord["priority"], number> = {
  high: 9,
  medium: 6,
  low: 3,
};

const CHECKOUT_SCORE: Record<CatalogItemRecord["checkoutMethod"], number> = {
  checkout: 4,
  booking: 4,
  "affiliate-link": 3,
  lead: 2,
  manual: 0,
};

export type ScoredMatch = {
  item: CatalogItemRecord;
  provider: ProviderRecord | undefined;
  score: number;
  reasons: string[];
};

function itemText(item: CatalogItemRecord) {
  return `${item.category} ${item.name} ${item.description}`.toLowerCase();
}

function matchesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function scoreCatalogItem(
  inquiry: InquiryInput,
  item: CatalogItemRecord,
  provider: ProviderRecord | undefined,
): { score: number; reasons: string[] } {
  const text = itemText(item);
  const reasons: string[] = [];
  let score = 0;

  const requestedMatches = (inquiry.help as HelpOption[]).filter(
    (option) => HELP_KEYWORDS[option] && matchesAny(text, HELP_KEYWORDS[option]),
  );
  if (requestedMatches.length > 0) {
    score += 40;
    for (const option of requestedMatches) {
      reasons.push(`Requested: ${option}`);
    }
  }

  if (inquiry.pet !== "no" && matchesAny(text, PET_KEYWORDS)) {
    score += 30;
    reasons.push("Pet-relevant match");
  }

  if (inquiry.household === "family" && matchesAny(text, FAMILY_KEYWORDS)) {
    score += 20;
    reasons.push("Family-relevant match");
  }

  if (provider) {
    score += INTEGRATION_SCORE[provider.integrationStatus];
    const integrationReason = INTEGRATION_REASON[provider.integrationStatus];
    if (integrationReason) {
      reasons.push(integrationReason);
    }

    score += PRIORITY_SCORE[provider.priority];
    if (provider.priority === "high") {
      reasons.push("High-priority provider");
    }
  }

  score += item.rating * 2;
  if (item.rating >= 4.5) {
    reasons.push(`Rated ${item.rating}`);
  }

  if (item.city && inquiry.destination.toLowerCase().includes(item.city.toLowerCase())) {
    score += 6;
    reasons.push(`Serves ${item.city}`);
  }

  score += CHECKOUT_SCORE[item.checkoutMethod];
  if (item.checkoutMethod === "checkout" || item.checkoutMethod === "booking") {
    reasons.push("Bookable instantly");
  }

  return { score: Math.round(score * 10) / 10, reasons };
}

export function rankCatalogItems(options: {
  inquiry: InquiryInput;
  items: CatalogItemRecord[];
  providers: ProviderRecord[];
  limit?: number;
}): ScoredMatch[] {
  const { inquiry, items, providers, limit = 4 } = options;
  const providerByKey = new Map(providers.map((provider) => [provider.key, provider]));

  return items
    .map((item) => {
      const provider = providerByKey.get(item.providerKey);
      const { score, reasons } = scoreCatalogItem(inquiry, item, provider);
      return { item, provider, score, reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.item.rating - a.item.rating ||
        a.item.name.localeCompare(b.item.name),
    )
    .slice(0, limit);
}

export function toMatchInsight(match: ScoredMatch): MatchInsight {
  return {
    id: match.item.id,
    providerKey: match.item.providerKey,
    providerName: match.provider?.name ?? match.item.providerKey,
    score: match.score,
    reasons: match.reasons,
  };
}
