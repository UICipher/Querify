import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiRow = Record<string, string | number>;

export function sendJson(res: ServerResponse, status: number, payload: unknown) {
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

const forbidden = /(--|;|\/\*|\*\/|\b(drop|delete|update|insert|alter|truncate|merge|grant|revoke|create|replace)\b)/i;

export function validateReadOnlySelect(sql: string) {
  const normalized = sql.trim();
  if (!normalized || forbidden.test(normalized) || !/^select\b/i.test(normalized)) {
    return { ok: false, message: "Only one read-only SELECT statement is permitted. Mutations, comments, semicolons, and stacked queries are blocked." };
  }
  return { ok: true as const };
}

const companies: ApiRow[] = [
  { company_name: "NVIDIA", profit_millions: 68000, revenue_millions: 122000, revenue_growth_percent: 100.3 },
  { company_name: "Microsoft AI", profit_millions: 14200, revenue_millions: 38500, revenue_growth_percent: 43.7 },
  { company_name: "Amazon AWS AI", profit_millions: 10800, revenue_millions: 31000, revenue_growth_percent: 47.6 },
  { company_name: "Apple ML", profit_millions: 7200, revenue_millions: 19800, revenue_growth_percent: 46.7 },
  { company_name: "Meta AI", profit_millions: 6900, revenue_millions: 24500, revenue_growth_percent: 51.2 },
];

export function analyticsResult(query: string, answer = "revenue") {
  const metric = answer.includes("profit") ? "profit_millions" : answer.includes("growth") ? "revenue_growth_percent" : "revenue_millions";
  const title = metric === "profit_millions" ? "Highest net profit by company" : metric === "revenue_growth_percent" ? "Revenue growth rate by company" : "Annual revenue by company";
  const rows = [...companies].sort((a, b) => Number(b[metric]) - Number(a[metric]));
  const sql = `SELECT company_name, ${metric}\nFROM financial_performance\nWHERE fiscal_year = 2024\nORDER BY ${metric} DESC\nLIMIT 5`;
  return { status: "success", conversationId: undefined, originalQuery: query, resolvedQuery: `${query} · ${answer}`, sql, columns: ["company_name", metric], rows, rowCount: rows.length, businessInsight: "Revenue leadership is concentrated among the largest platform companies, while relative growth tells a different story.", chartHint: { chartType: metric === "revenue_growth_percent" ? "line" : "bar", title }, executionTimeMs: 18 };
}
