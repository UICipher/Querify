import type { IncomingMessage, ServerResponse } from "node:http";
import {
  analyticsResult,
  handleOptions,
  readJson,
  sendJson,
  validateReadOnlySelect,
} from "../_lib.js";
import { detectUnsupportedDemoScope } from "../../shared/queryScope.js";

type QueryBody = {
  query?: string;
  clarificationAnswer?: string;
  conversationId?: string;
  execute?: boolean;
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let body: QueryBody;
  try {
    body = await readJson<QueryBody>(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const query = String(body.query ?? "").trim();
  if (!query) {
    return sendJson(res, 422, {
      error: "A natural-language query is required.",
    });
  }

  const lower = query.toLowerCase();
  const answer = body.clarificationAnswer?.trim().toLowerCase() ?? "";
  if (answer === "this_month" || answer === "last_month") {
    return sendJson(res, 422, {
      error:
        "Demo Mode only contains annual FY 2024 fixtures. Choose FY 2024 or all available demo data; monthly reporting requires a live data source.",
    });
  }

  if (/;|--|\/\*|\b(drop|delete|update|insert|alter|truncate)\b/i.test(query)) {
    return sendJson(res, 422, {
      error:
        "Only one read-only SELECT statement is permitted. Mutations, comments, semicolons, and stacked queries are blocked.",
    });
  }

  const scopeIssue = detectUnsupportedDemoScope(query);
  if (scopeIssue) {
    return sendJson(res, 422, {
      code: scopeIssue.code,
      error: scopeIssue.message,
    });
  }

  if (!answer && !body.conversationId && lower.includes("revenue report")) {
    return sendJson(res, 200, {
      status: "clarification_needed",
      conversationId: `q_${Date.now()}`,
      originalQuery: query,
      question:
        "Which available reporting window should we use? Demo Mode has annual FY 2024 fixtures and all available demo rows, not monthly data.",
      options: [
        {
          id: "fiscal_year_2024",
          label: "Fiscal Year 2024",
          value: "fiscal_year_2024",
        },
        {
          id: "all_time",
          label: "All available demo data",
          value: "all_time",
        },
      ],
    });
  }

  if (
    !answer &&
    !body.conversationId &&
    /best performing|most money|top performing/i.test(query)
  ) {
    return sendJson(res, 200, {
      status: "clarification_needed",
      conversationId: `q_${Date.now()}`,
      originalQuery: query,
      question: "Which business metric should define performance?",
      options: [
        { id: "revenue", label: "Highest Revenue", value: "revenue" },
        { id: "profit", label: "Highest Net Profit", value: "profit" },
        {
          id: "growth",
          label: "Highest Revenue Growth Rate",
          value: "growth",
        },
        {
          id: "roi",
          label: "Highest AI Investment Return",
          value: "roi",
        },
      ],
    });
  }

  if (/^select\b/i.test(query)) {
    const validation = validateReadOnlySelect(query);
    if (!validation.ok)
      return sendJson(res, 422, { error: validation.message });
  }

  return sendJson(res, 200, analyticsResult(query, body.clarificationAnswer));
}
