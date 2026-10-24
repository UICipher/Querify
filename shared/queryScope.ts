export type UnsupportedDemoScope = {
  code: "UNSUPPORTED_DEMO_SCOPE";
  domain: string;
  message: string;
};

type DomainRule = {
  domain: string;
  pattern: RegExp;
};

const unsupportedDomains: DomainRule[] = [
  {
    domain: "healthcare",
    pattern:
      /\b(?:hospitals?|clinics?|patients?|pharmacies?|healthcare|medical\s+records?)\b/i,
  },
  {
    domain: "education",
    pattern:
      /\b(?:schools?|universities|university|colleges?|students?|classrooms?)\b/i,
  },
  {
    domain: "product and order",
    pattern:
      /\b(?:products?|skus?|orders?|inventory|catalog\s+items?|shipments?)\b/i,
  },
  {
    domain: "customer and client",
    pattern: /\b(?:customers?|clients?|users?|subscribers?|accounts?)\b/i,
  },
  {
    domain: "employee and payroll",
    pattern:
      /\b(?:employees?|staff|payroll|salaries|salary|workforce|job\s+postings?)\b/i,
  },
  {
    domain: "transportation and travel",
    pattern:
      /\b(?:flights?|airlines?|passengers?|trips?|routes?|shipments?)\b/i,
  },
  {
    domain: "sports",
    pattern: /\b(?:sports?|players?|leagues?|teams?|matches?|games?)\b/i,
  },
  {
    domain: "movie and media",
    pattern:
      /\b(?:movies?|films?|books?|authors?|box\s+office|podcasts?|songs?)\b/i,
  },
  {
    domain: "stock and cryptocurrency",
    pattern:
      /\b(?:stocks?|stock\s+prices?|cryptocurrencies|crypto|bitcoin|tokens?)\b/i,
  },
  {
    domain: "geography and location",
    pattern:
      /\b(?:cities|city|countries|country|states|regions|districts|zip\s+codes?)\b/i,
  },
];

export type SupportedDemoDomain =
  | "companies"
  | "restaurants"
  | "hotels"
  | "homes"
  | "cars"
  | "phones";

const supportedDomainRules: Array<{ domain: SupportedDemoDomain; pattern: RegExp }> = [
  { domain: "restaurants", pattern: /\b(?:restaurants?|caf[eé]s?|cafeterias?|diners?|dining|food\s+(?:chains?|services?))\b/i },
  { domain: "hotels", pattern: /\b(?:hotels?|motels?|resorts?|lodging|airbnbs?)\b/i },
  { domain: "homes", pattern: /\b(?:houses?|homes?|dwellings?|apartments?|condos?|properties?|property|real\s+estate|rentals?|home\s+listings?)\b/i },
  { domain: "cars", pattern: /\b(?:cars?|automobiles?|vehicles?|trucks?|motorcycles?)\b/i },
  { domain: "phones", pattern: /\b(?:phones?|smartphones?|mobile\s+phones?|cell\s+phones?|handsets?)\b/i },
];

const supportedCompanyContext =
  /\b(?:companies?|business(?:es)?|firms?|corporations?|enterprises?|organizations?|ai\s+(?:companies|firms|startups?))\b/i;

const supportedFixtureEntities =
  /\b(?:nvidia|microsoft|amazon|aws|apple|meta|google|deepmind|scale\s+ai|databricks|perplexity|hugging\s+face|openai|anthropic)\b/i;

const ignoredTargetWords = new Set([
  "a",
  "about",
  "all",
  "among",
  "an",
  "and",
  "annual",
  "are",
  "average",
  "best",
  "by",
  "camera",
  "city",
  "cities",
  "company",
  "companies",
  "cuisine",
  "cuisines",
  "count",
  "data",
  "details",
  "bedrooms",
  "bathrooms",
  "each",
  "every",
  "fiscal",
  "for",
  "from",
  "fy",
  "growth",
  "highest",
  "how",
  "in",
  "information",
  "investment",
  "investments",
  "least",
  "latest",
  "list",
  "lowest",
  "me",
  "metric",
  "model",
  "models",
  "brand",
  "brands",
  "battery",
  "storage",
  "screen",
  "rooms",
  "rates",
  "nightly",
  "meals",
  "values",
  "metrics",
  "most",
  "monthly",
  "net",
  "of",
  "on",
  "or",
  "performing",
  "performance",
  "profit",
  "profits",
  "query",
  "records",
  "report",
  "rating",
  "ratings",
  "price",
  "prices",
  "range",
  "region",
  "reviews",
  "reports",
  "return",
  "revenue",
  "roi",
  "sales",
  "show",
  "summary",
  "their",
  "the",
  "top",
  "2023",
  "2024",
  "2025",
  "weekly",
  "year",
  "yearly",
]);

const targetPatterns = [
  /\b(?:how\s+many|number\s+of|count\s+of)\s+(?:the\s+|a\s+|an\s+)?([a-z][a-z-]*)\b/gi,
  /\b(?:best|top|highest|lowest|largest|smallest|most|least)\s+(?:the\s+)?(?:\d+\s+)?([a-z][a-z-]*)\b/gi,
  /\b(?:show|list|find|give|compare|rank|analy[sz]e|search|retrieve|query|display|export|summari[sz]e)\s+(?:me\s+)?(?:the\s+|a\s+|an\s+)?(?:best\s+|top\s+)?(?:\d+\s+)?(?:for\s+|about\s+|on\s+|of\s+)?([a-z][a-z-]*)\b/gi,
  /\b(?:data|records?|metrics?|information|details|revenue|profit|growth|sales|performance|prices?|inventory|headcount)\s+(?:for|about|of|from|by|on|in)\s+(?:the\s+|a\s+|an\s+)?([a-z][a-z-]*)\b/gi,
  /\b(?:tell\s+me\s+about|what\s+about|how\s+about|info(?:rmation)?\s+(?:about|on)|details\s+(?:about|on)|report\s+on)\s+(?:the\s+|a\s+|an\s+)?([a-z][a-z-]*)\b/gi,
];

function requestedUnknownDomain(query: string): string | null {
  for (const pattern of targetPatterns) {
    for (const match of query.matchAll(pattern)) {
      const candidate = match[1]?.toLowerCase();
      if (!candidate || ignoredTargetWords.has(candidate)) continue;
      if (
        /^(?:q[1-4]|\d{4}|\d+)$/i.test(candidate) ||
        getSupportedDemoDomains(candidate).length > 0
      ) {
        continue;
      }
      return candidate;
    }
  }
  return null;
}

function createScopeIssue(domain: string): UnsupportedDemoScope {
  return {
    code: "UNSUPPORTED_DEMO_SCOPE",
    domain,
    message: `Demo Mode does not contain a matching ${domain} sample dataset. No unrelated company rows were returned. Supported sample domains are companies, restaurants, hotels, homes, cars, and phones.`,
  };
}

export function getSupportedDemoDomains(query: string): SupportedDemoDomain[] {
  const domains: SupportedDemoDomain[] = [];
  if (supportedCompanyContext.test(query) || supportedFixtureEntities.test(query))
    domains.push("companies");
  for (const { domain, pattern } of supportedDomainRules) {
    if (pattern.test(query)) domains.push(domain);
  }
  return domains;
}

export function getSupportedDemoDomain(query: string): SupportedDemoDomain | null {
  return getSupportedDemoDomains(query)[0] ?? null;
}

export function detectUnsupportedDemoScope(
  query: string
): UnsupportedDemoScope | null {
  const supportedDomains = getSupportedDemoDomains(query);
  const knownUnsupported = unsupportedDomains.find(({ pattern }) =>
    pattern.test(query)
  );
  if (
    knownUnsupported &&
    !(knownUnsupported.domain === "geography and location" && supportedDomains.length > 0)
  ) {
    return createScopeIssue(knownUnsupported.domain);
  }

  if (supportedDomains.length > 0) return null;

  const unknownDomain = requestedUnknownDomain(query);
  return unknownDomain ? createScopeIssue(unknownDomain) : null;
}
