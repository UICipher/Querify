import {
  getSupportedDemoDomains,
  type SupportedDemoDomain,
} from "../shared/queryScope.js";
import { DEMO_TABLES, type DemoTableName } from "./demoDatabase.js";
import type { QueryPlan } from "./queryPlan.js";

type ClarificationPlan = {
  status: "clarification_needed";
  question: string;
  options: Array<{ id: string; label: string; value: string }>;
};

type RuleBasedPlan = QueryPlan | ClarificationPlan;

type MetricRule = {
  column: string;
  words: RegExp;
  defaultDirection: "asc" | "desc";
};

const DOMAIN_OPTIONS: Array<{
  id: SupportedDemoDomain;
  label: string;
  value: SupportedDemoDomain;
}> = [
  { id: "companies", label: "Companies", value: "companies" },
  { id: "restaurants", label: "Restaurants", value: "restaurants" },
  { id: "hotels", label: "Hotels", value: "hotels" },
  { id: "homes", label: "Homes", value: "homes" },
  { id: "cars", label: "Cars", value: "cars" },
  { id: "phones", label: "Phones", value: "phones" },
];

const METRIC_RULES: Record<DemoTableName, MetricRule[]> = {
  companies: [
    { column: "estimated_return_percent", words: /\b(?:roi|return on investment|investment return)\b/i, defaultDirection: "desc" },
    { column: "profit_millions", words: /\b(?:profit|profitable|earnings|net income)\b/i, defaultDirection: "desc" },
    { column: "revenue_growth_percent", words: /\b(?:growth|grew|growing)\b/i, defaultDirection: "desc" },
    { column: "revenue_millions", words: /\b(?:revenue|sales|money|income)\b/i, defaultDirection: "desc" },
  ],
  restaurants: [
    { column: "rating", words: /\b(?:rating|rated|review score|best rated)\b/i, defaultDirection: "desc" },
    { column: "average_meal_price_usd", words: /\b(?:meal price|average price|cost|cheapest|budget)\b/i, defaultDirection: "asc" },
    { column: "annual_revenue_usd", words: /\b(?:revenue|sales)\b/i, defaultDirection: "desc" },
    { column: "review_count", words: /\b(?:reviews|review count|most reviewed)\b/i, defaultDirection: "desc" },
  ],
  hotels: [
    { column: "nightly_rate_usd", words: /\b(?:nightly rate|nightly price|room rate|price|cost|cheapest|affordable)\b/i, defaultDirection: "asc" },
    { column: "star_rating", words: /\b(?:star|rating|rated|best rated)\b/i, defaultDirection: "desc" },
    { column: "occupancy_percent", words: /\b(?:occupancy|occupied)\b/i, defaultDirection: "desc" },
    { column: "review_count", words: /\b(?:reviews|review count)\b/i, defaultDirection: "desc" },
  ],
  homes: [
    { column: "listing_price_usd", words: /\b(?:price|cost|cheapest|affordable|least expensive)\b/i, defaultDirection: "asc" },
    { column: "bedrooms", words: /\b(?:bedrooms?|beds)\b/i, defaultDirection: "desc" },
    { column: "bathrooms", words: /\b(?:bathrooms?|baths)\b/i, defaultDirection: "desc" },
    { column: "square_feet", words: /\b(?:square feet|sq\.?\s*ft|area|size)\b/i, defaultDirection: "desc" },
    { column: "year_built", words: /\b(?:newest|recently built|year built)\b/i, defaultDirection: "desc" },
  ],
  cars: [
    { column: "range_miles", words: /\b(?:range|distance)\b/i, defaultDirection: "desc" },
    { column: "mpg", words: /\b(?:fuel efficiency|efficient|mpg|mpge)\b/i, defaultDirection: "desc" },
    { column: "price_usd", words: /\b(?:price|cost|cheapest|affordable)\b/i, defaultDirection: "asc" },
    { column: "horsepower", words: /\b(?:horsepower|power)\b/i, defaultDirection: "desc" },
    { column: "year", words: /\b(?:newest|model year)\b/i, defaultDirection: "desc" },
  ],
  phones: [
    { column: "camera_mp", words: /\b(?:camera|megapixels?|resolution)\b/i, defaultDirection: "desc" },
    { column: "battery_mah", words: /\b(?:battery|battery capacity)\b/i, defaultDirection: "desc" },
    { column: "storage_gb", words: /\b(?:storage|memory)\b/i, defaultDirection: "desc" },
    { column: "price_usd", words: /\b(?:price|cost|cheapest|affordable)\b/i, defaultDirection: "asc" },
    { column: "screen_inches", words: /\b(?:screen|display size)\b/i, defaultDirection: "desc" },
    { column: "release_year", words: /\b(?:newest|latest|release year)\b/i, defaultDirection: "desc" },
  ],
};

const DEFAULT_METRIC: Record<DemoTableName, string> = {
  companies: "revenue_millions",
  restaurants: "rating",
  hotels: "nightly_rate_usd",
  homes: "listing_price_usd",
  cars: "range_miles",
  phones: "camera_mp",
};

const NAME_COLUMNS: Record<DemoTableName, string[]> = {
  companies: ["company_name"],
  restaurants: ["name", "city"],
  hotels: ["name", "city"],
  homes: ["city", "neighborhood"],
  cars: ["make", "model"],
  phones: ["brand", "model"],
};

const COMPANY_METRIC_OPTIONS = [
  { id: "revenue", label: "Annual revenue", value: "revenue" },
  { id: "profit", label: "Net profit", value: "profit" },
  { id: "growth", label: "Revenue growth", value: "growth" },
  { id: "roi", label: "Estimated investment return", value: "ROI" },
];

const companyPerformanceQuestion =
  /\b(?:best|top|highest|most)\s+(?:performing|successful|money)\b|\bmost money\b/i;
const explicitCompanyMetric =
  /\b(?:revenue|sales|profit|earnings|growth|roi|return on investment|investment return)\b/i;
const lowIntent =
  /\b(?:lowest|least|cheapest|most affordable|affordable|under|below|less than|at most|up to)\b/i;
const highIntent = /\b(?:highest|greatest|top|best|most|largest|over|above)\b/i;

function hasColumn(table: DemoTableName, column: string): boolean {
  return Object.hasOwn(DEMO_TABLES[table].columns, column);
}

function domainClarification(): ClarificationPlan {
  return {
    status: "clarification_needed",
    question: "Which sample dataset should I use?",
    options: DOMAIN_OPTIONS,
  };
}

function companyMetricClarification(): ClarificationPlan {
  return {
    status: "clarification_needed",
    question: "What should “best performing” mean for this comparison?",
    options: COMPANY_METRIC_OPTIONS,
  };
}

function parseLimit(text: string): number {
  const numeric = text.match(/\b(?:top|first|show|list)\s+(\d{1,2})\b/i)?.[1];
  const word = /\b(?:top|first|show|list)\s+(?:the\s+)?five\b/i.test(text)
    ? 5
    : undefined;
  const parsed = Number(numeric ?? word ?? 10);
  return Math.max(1, Math.min(10, parsed));
}

function numericFilters(
  table: DemoTableName,
  text: string
): QueryPlan["filters"] {
  const filters: QueryPlan["filters"] = [];
  const priceColumn = [
    "listing_price_usd",
    "average_meal_price_usd",
    "nightly_rate_usd",
    "price_usd",
  ].find(column => hasColumn(table, column));
  const amount = text.match(
    /\b(?:under|below|less than|at most|no more than|up to|over|above|more than|at least)\s+\$?([\d,]+(?:\.\d+)?)/i
  );
  const hasPriceContext = /\b(?:price|cost|budget|rate|nightly|listing|meal|usd|dollars?)\b|\$/i.test(text);
  if (priceColumn && amount && hasPriceContext) {
    const value = Number(amount[1].replaceAll(",", ""));
    if (Number.isFinite(value)) {
      const isUpperBound = /\b(?:under|below|less than|at most|no more than|up to)\b/i.test(amount[0]);
      filters.push({ column: priceColumn, operator: isUpperBound ? "lt" : "gt", value });
    }
  }

  const ratingColumn = hasColumn(table, "rating")
    ? "rating"
    : hasColumn(table, "star_rating")
      ? "star_rating"
      : null;
  const rating = text.match(
    /\b(?:rated|rating|stars?)\s+(?:above|over|greater than|at least|below|under|less than)?\s*(\d(?:\.\d+)?)\b/i
  );
  if (ratingColumn && rating) {
    const value = Number(rating[1]);
    const isUpperBound = /\b(?:below|under|less than)\b/i.test(rating[0]);
    const isInclusive = /\b(?:at least)\b/i.test(rating[0]);
    filters.push({
      column: ratingColumn,
      operator: isUpperBound ? "lt" : isInclusive ? "gte" : "gt",
      value,
    });
  }

  if (hasColumn(table, "bedrooms")) {
    const bedroom = text.match(
      /\b(\d+|one|two|three|four|five)\s*-?\s*(?:bedrooms?|beds?)\b/i
    );
    if (bedroom) {
      const wordNumbers: Record<string, number> = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
      };
      const isMinimum = /\b(?:at least|minimum|or more)\b/i.test(text);
      filters.push({
        column: "bedrooms",
        operator: isMinimum ? "gte" : "eq",
        value: Number(bedroom[1]) || wordNumbers[bedroom[1].toLowerCase()],
      });
    }
  }

  const yearColumn = ["fiscal_year", "release_year", "year", "investment_year"].find(
    column => hasColumn(table, column)
  );
  const year = text.match(/\b(?:in|during|for|year)\s+(20\d{2})\b/i);
  if (yearColumn && year) {
    filters.push({ column: yearColumn, operator: "eq", value: Number(year[1]) });
  }

  const locationColumn = hasColumn(table, "city")
    ? "city"
    : hasColumn(table, "headquarters")
      ? "headquarters"
      : null;
  if (locationColumn) {
    const knownLocations = new Set(
      DEMO_TABLES[table].rows
        .map(row => (row as unknown as Record<string, unknown>)[locationColumn])
        .filter((value): value is string => typeof value === "string")
    );
    const location = [...knownLocations].find(value =>
      new RegExp(`\\b${value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(text)
    );
    if (location) filters.push({ column: locationColumn, operator: "eq", value: location });
  }

  return filters;
}

export function buildRuleBasedPlan(
  query: string,
  clarificationAnswer = "",
  requestedDomain?: SupportedDemoDomain | null
): RuleBasedPlan {
  const text = `${query} ${clarificationAnswer}`.trim();
  const mentionedDomains = getSupportedDemoDomains(query);
  const selectedDomain = requestedDomain ?? mentionedDomains[0] ?? null;
  if (!selectedDomain) return domainClarification();

  if (
    selectedDomain === "companies" &&
    companyPerformanceQuestion.test(query) &&
    !explicitCompanyMetric.test(text)
  ) {
    return companyMetricClarification();
  }

  const table = selectedDomain as DemoTableName;
  const rules = METRIC_RULES[table];
  const metric = rules.find(rule => rule.words.test(text));
  const sortColumn = metric?.column ?? DEFAULT_METRIC[table];
  const direction = lowIntent.test(text)
    ? "asc"
    : highIntent.test(text)
      ? "desc"
      : metric?.defaultDirection ?? "desc";
  const columns = [...NAME_COLUMNS[table]];
  if (hasColumn(table, sortColumn) && !columns.includes(sortColumn)) columns.push(sortColumn);

  const filters = numericFilters(table, text);
  for (const filter of filters) {
    if (!columns.includes(filter.column)) columns.push(filter.column);
  }
  const asksForCount = /\b(?:how many|count(?:\s+of)?|number of)\b/i.test(text);
  const asksForAverageByCity =
    /\b(?:average|avg|mean)\b/i.test(text) &&
    /\b(?:by|per)\s+(?:city|region|cuisine)\b/i.test(text);
  const groupColumn = text.match(/\b(?:by|per)\s+(city|region|cuisine)\b/i)?.[1]?.toLowerCase();
  const groupBy =
    asksForAverageByCity && groupColumn && hasColumn(table, groupColumn)
      ? [groupColumn]
      : [];
  const aggregate = asksForCount
    ? { function: "count" as const, column: "id" }
    : groupBy.length
      ? { function: "avg" as const, column: sortColumn }
      : undefined;
  if (aggregate && aggregate.function === "count") columns.splice(0, columns.length);
  if (groupBy.length) {
    columns.splice(0, columns.length, ...groupBy);
  }

  const aggregateAlias = aggregate
    ? `${aggregate.function}_${aggregate.column}`
    : undefined;
  const orderColumn = aggregateAlias ?? sortColumn;
  const displayMetric = sortColumn.replaceAll("_", " ");
  const label = DEMO_TABLES[table].label;
  const title = asksForCount
    ? `Sample record count · ${label}`
    : groupBy.length
      ? `Average ${displayMetric} by ${groupBy[0]}`
      : `${label} sample results by ${displayMetric}`;

  return {
    status: "query",
    table,
    columns,
    filters,
    groupBy,
    ...(aggregate ? { aggregate } : {}),
    ...(!asksForCount
      ? { orderBy: { column: orderColumn, direction } }
      : {}),
    limit: parseLimit(text),
    title,
    insight:
      "Structured local interpretation ran against the illustrative sample tables. No external model or API key was used.",
    chartType: "bar",
  };
}
