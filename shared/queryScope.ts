export type UnsupportedDemoScope = {
  code: "UNSUPPORTED_DEMO_SCOPE";
  domain: string;
  message: string;
};

const unsupportedDomains: Array<{
  domain: string;
  pattern: RegExp;
}> = [
  {
    domain: "restaurant",
    pattern:
      /\b(?:restaurants?|caf[eé]s?|cafeterias?|diners?|dining|food\s+(?:chains?|services?))\b/i,
  },
  {
    domain: "hotel and lodging",
    pattern: /\b(?:hotels?|motels?|resorts?|lodging)\b/i,
  },
  {
    domain: "healthcare",
    pattern: /\b(?:hospitals?|clinics?|patients?|pharmacies?|healthcare)\b/i,
  },
  {
    domain: "education",
    pattern: /\b(?:schools?|universities|university|colleges?|students?)\b/i,
  },
  {
    domain: "product and order",
    pattern: /\b(?:products?|skus?|orders?|inventory|catalog items?)\b/i,
  },
  {
    domain: "customer and client",
    pattern: /\b(?:customers?|clients?|users?|subscribers?)\b/i,
  },
  {
    domain: "employee and payroll",
    pattern: /\b(?:employees?|staff|payroll|salaries|salary|workforce)\b/i,
  },
  {
    domain: "real estate and property",
    pattern: /\b(?:real estate|properties|property|home listings?)\b/i,
  },
  {
    domain: "transportation",
    pattern: /\b(?:flights?|airlines?|passengers?|vehicles?|cars?)\b/i,
  },
  {
    domain: "sports",
    pattern: /\b(?:sports?|players?|leagues?|teams?)\b/i,
  },
  {
    domain: "movie and media",
    pattern: /\b(?:movies?|films?|books?|authors?|box office)\b/i,
  },
];

export function detectUnsupportedDemoScope(
  query: string
): UnsupportedDemoScope | null {
  const match = unsupportedDomains.find(({ pattern }) => pattern.test(query));
  if (!match) return null;

  return {
    code: "UNSUPPORTED_DEMO_SCOPE",
    domain: match.domain,
    message: `Demo Mode does not contain ${match.domain} data. It only has illustrative company financial and AI-investment fixtures, so no unrelated company rows were returned. Connect a ${match.domain} data source or ask about the available company fixtures.`,
  };
}
