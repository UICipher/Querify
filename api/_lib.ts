import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiRow = Record<string, string | number>;
export type ApiMetric = "revenue" | "profit" | "growth" | "roi";

export function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.end(JSON.stringify(payload));
}

export function handleOptions(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return true;
  }
  return false;
}

export async function readJson<T>(req: IncomingMessage): Promise<T> {
  let body = "";
  for await (const chunk of req) body += chunk.toString();
  if (!body.trim()) return {} as T;
  return JSON.parse(body) as T;
}

const forbidden =
  /(--|;|\/\*|\*\/|\b(drop|delete|update|insert|alter|truncate|merge|grant|revoke|create|replace)\b)/i;

export function validateReadOnlySelect(sql: string) {
  const normalized = sql.trim();
  if (
    !normalized ||
    forbidden.test(normalized) ||
    !/^select\b/i.test(normalized)
  ) {
    return {
      ok: false,
      message:
        "Only one read-only SELECT statement is permitted. Mutations, comments, semicolons, and stacked queries are blocked.",
    };
  }
  return { ok: true as const };
}

const companies: ApiRow[] = [
  {
    company_name: "NVIDIA",
    profit_millions: 68000,
    revenue_millions: 122000,
    revenue_growth_percent: 100.3,
    estimated_return_percent: 18.4,
  },
  {
    company_name: "Microsoft AI",
    profit_millions: 14200,
    revenue_millions: 38500,
    revenue_growth_percent: 43.7,
    estimated_return_percent: 16.8,
  },
  {
    company_name: "Amazon AWS AI",
    profit_millions: 10800,
    revenue_millions: 31000,
    revenue_growth_percent: 47.6,
    estimated_return_percent: 14.9,
  },
  {
    company_name: "Apple ML",
    profit_millions: 7200,
    revenue_millions: 19800,
    revenue_growth_percent: 46.7,
    estimated_return_percent: 12.8,
  },
  {
    company_name: "Meta AI",
    profit_millions: 6900,
    revenue_millions: 24500,
    revenue_growth_percent: 51.2,
    estimated_return_percent: 15.1,
  },
];

const metricDefinitions: Record<
  ApiMetric,
  {
    field: string;
    title: string;
    label: string;
    insight: string;
    alias: "f" | "i";
    table: "financial_performance" | "ai_investments";
    chartType: "bar" | "line";
  }
> = {
  revenue: {
    field: "revenue_millions",
    title: "Annual revenue by company",
    label: "highest annual revenue",
    insight:
      "Revenue leadership is concentrated among the largest platform companies; figures are illustrative demo values.",
    alias: "f",
    table: "financial_performance",
    chartType: "bar",
  },
  profit: {
    field: "profit_millions",
    title: "Highest net profit by company",
    label: "highest net profit",
    insight:
      "The result is ranked by illustrative net profit after operating costs; connect a live source for production analysis.",
    alias: "f",
    table: "financial_performance",
    chartType: "bar",
  },
  growth: {
    field: "revenue_growth_percent",
    title: "Revenue growth rate by company",
    label: "highest revenue growth rate",
    insight:
      "The result is ranked by illustrative year-over-year revenue growth; connect a live source for production analysis.",
    alias: "f",
    table: "financial_performance",
    chartType: "line",
  },
  roi: {
    field: "estimated_return_percent",
    title: "AI investment return by company",
    label: "highest AI investment return",
    insight:
      "These illustrative AI investment return estimates are not financial forecasts.",
    alias: "i",
    table: "ai_investments",
    chartType: "bar",
  },
};

function hasMetricKeywords(text: string) {
  return /\b(?:revenue|sales|profit|profitability|profitable|earnings|growth|grew|growing|roi|investment\s+return|return\s+on\s+investment)\b/i.test(
    text
  );
}

export function inferApiMetric(query: string, answer?: string): ApiMetric {
  const normalizedAnswer = answer?.trim() ?? "";
  const source =
    normalizedAnswer && hasMetricKeywords(normalizedAnswer)
      ? normalizedAnswer
      : query;
  const normalized = source.toLowerCase();

  if (
    /\b(?:roi|investment\s+return|return\s+on\s+investment)\b/.test(normalized)
  )
    return "roi";
  if (/\b(?:growth|grew|growing)\b/.test(normalized)) return "growth";
  if (/\b(?:profit|profitability|profitable|earnings)\b/.test(normalized))
    return "profit";
  return "revenue";
}

export function analyticsResult(query: string, answer?: string) {
  const metric = inferApiMetric(query, answer);
  const definition = metricDefinitions[metric];
  const normalizedAnswer = answer?.trim().toLowerCase() ?? "";
  const allTime =
    normalizedAnswer === "all_time" || normalizedAnswer === "all time";
  const rows = [...companies]
    .sort((a, b) => Number(b[definition.field]) - Number(a[definition.field]))
    .map(row => ({
      company_name: row.company_name,
      [definition.field]: row[definition.field],
    }));
  const valueExpression = `${definition.alias}.${definition.field}`;
  const source =
    metric === "roi"
      ? "FROM companies c\nJOIN ai_investments i ON c.company_id = i.company_id"
      : "FROM companies c\nJOIN financial_performance f ON c.company_id = f.company_id";
  const where = allTime ? "" : `\nWHERE ${definition.alias}.fiscal_year = 2024`;
  const sql = `SELECT c.company_name, ${valueExpression}\n${source}${where}\nORDER BY ${valueExpression} DESC\nLIMIT 5`;
  const answerSuffix = allTime
    ? "all available demo records"
    : normalizedAnswer === "fiscal_year_2024"
      ? "FY 2024"
      : definition.label;

  return {
    status: "success",
    conversationId: undefined,
    originalQuery: query,
    resolvedQuery: `${query} · ${answerSuffix}`,
    sql,
    columns: ["company_name", definition.field],
    rows,
    rowCount: rows.length,
    businessInsight: definition.insight,
    chartHint: {
      chartType: definition.chartType,
      title: definition.title,
    },
    executionTimeMs: 18,
  };
}
