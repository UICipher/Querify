import type { IncomingMessage, ServerResponse } from "node:http";
import { analyticsResult, handleOptions, readJson, sendJson, validateReadOnlySelect } from "../_lib.js";

type QueryBody = { query?: string; clarificationAnswer?: string; conversationId?: string; execute?: boolean };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  let body: QueryBody;
  try { body = await readJson<QueryBody>(req); } catch { return sendJson(res, 400, { error: "Invalid JSON body" }); }

  const query = String(body.query ?? "").trim();
  if (!query) return sendJson(res, 422, { error: "A natural-language query is required." });

  const lower = query.toLowerCase();
  if (/;|--|\/\*|\b(drop|delete|update|insert|alter|truncate)\b/i.test(query)) {
    return sendJson(res, 422, { error: "Only one read-only SELECT statement is permitted. Mutations, comments, semicolons, and stacked queries are blocked." });
  }

  if (!body.clarificationAnswer && !body.conversationId && lower.includes("revenue report")) {
    return sendJson(res, 200, { status: "clarification_needed", conversationId: `q_${Date.now()}`, originalQuery: query, question: "Which reporting window should we use?", options: [{ id: "this_month", label: "This Month", value: "this_month" }, { id: "last_month", label: "Last Month", value: "last_month" }, { id: "all_time", label: "All Time", value: "all_time" }] });
  }

  if (!body.clarificationAnswer && !body.conversationId && /best performing|most money|top performing/i.test(query)) {
    return sendJson(res, 200, { status: "clarification_needed", conversationId: `q_${Date.now()}`, originalQuery: query, question: "Which business metric should define performance?", options: [{ id: "revenue", label: "Highest Revenue", value: "revenue" }, { id: "profit", label: "Highest Net Profit", value: "profit" }, { id: "growth", label: "Highest Revenue Growth Rate", value: "growth" }] });
  }

  if (/^select\b/i.test(query)) {
    const validation = validateReadOnlySelect(query);
    if (!validation.ok) return sendJson(res, 422, { error: validation.message });
  }

  return sendJson(res, 200, analyticsResult(query, body.clarificationAnswer ?? "revenue"));
}
