import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import {
  handleOptions,
  readJson,
  RequestBodyTooLargeError,
  sendJson,
  validateReadOnlySelect,
} from "../_lib.js";
import {
  detectUnsupportedDemoScope,
  getSupportedDemoDomains,
  type SupportedDemoDomain,
} from "../../shared/queryScope.js";
import { executeDemoSql, SAMPLE_DATA_NOTICE } from "../demoDatabase.js";
import {
  compileQueryPlan,
  InvalidQueryPlanError,
  validateQueryPlan,
} from "../queryPlan.js";
import {
  LlmConfigurationError,
  LlmProviderError,
  requestQueryPlan,
} from "../llmClient.js";

type QueryBody = {
  query?: string;
  clarificationAnswer?: string;
  conversationId?: string;
  execute?: boolean;
};

const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_RATE_LIMIT_CLIENTS = 1024;
const DOMAIN_LABELS: Record<SupportedDemoDomain, string> = {
  companies: "Companies",
  restaurants: "Restaurants",
  hotels: "Hotels",
  homes: "Homes",
  cars: "Cars",
  phones: "Phones",
};
const requestsByClient = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: IncomingMessage): string {
  const realIp = req.headers?.["x-real-ip"];
  const normalized = Array.isArray(realIp) ? realIp[0] : realIp;
  return normalized?.trim() || req.socket?.remoteAddress || "unknown";
}

function takeRateLimitToken(req: IncomingMessage, now = Date.now()): boolean {
  for (const [key, record] of requestsByClient) {
    if (record.resetAt <= now) requestsByClient.delete(key);
  }
  const key = clientKey(req);
  const current = requestsByClient.get(key);
  if (!current) {
    if (requestsByClient.size >= MAX_RATE_LIMIT_CLIENTS) {
      const oldestKey = requestsByClient.keys().next().value;
      if (oldestKey) requestsByClient.delete(oldestKey);
    }
    requestsByClient.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

function clarificationResponse(question: string, options: Array<{ id: string; label: string; value: string }>) {
  return {
    status: "clarification_needed",
    conversationId: `q_${randomUUID()}`,
    question,
    options,
  };
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (!takeRateLimitToken(req)) {
    return sendJson(res, 429, {
      code: "RATE_LIMITED",
      error: "Too many demo queries from this connection. Please wait a minute and try again.",
    });
  }

  let body: QueryBody;
  try {
    body = await readJson<QueryBody>(req);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return sendJson(res, 413, {
        code: "REQUEST_TOO_LARGE",
        error: "The query request exceeds the 16 KiB size limit.",
      });
    }
    return sendJson(res, 400, {
      code: "INVALID_JSON",
      error: "The request body must be valid JSON.",
    });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return sendJson(res, 422, {
      error: "A natural-language query is required.",
    });
  }
  if (query.length > 800) {
    return sendJson(res, 422, {
      code: "QUERY_TOO_LONG",
      error: "Please keep the question under 800 characters.",
    });
  }
  const clarificationAnswer = typeof body.clarificationAnswer === "string"
    ? body.clarificationAnswer.trim().slice(0, 200)
    : "";

  if (/;|--|\/\*|\*\/|\b(drop|delete|update|insert|alter|truncate|create|replace)\b/i.test(query)) {
    return sendJson(res, 422, {
      code: "READ_ONLY_QUERY_REQUIRED",
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

  const mentionedDomains = getSupportedDemoDomains(query);
  const answerDomains = getSupportedDemoDomains(clarificationAnswer);
  let requestedDomain: SupportedDemoDomain | null = mentionedDomains[0] ?? null;
  if (mentionedDomains.length > 1) {
    const selectedDomain = answerDomains.length === 1 ? answerDomains[0] : undefined;
    if (!selectedDomain || !mentionedDomains.includes(selectedDomain)) {
      return sendJson(
        res,
        200,
        clarificationResponse(
          "This sample demo queries one data domain at a time. Which domain should I use?",
          mentionedDomains.map(domain => ({
            id: domain,
            label: DOMAIN_LABELS[domain],
            value: domain,
          }))
        )
      );
    }
    requestedDomain = selectedDomain;
  }

  const startedAt = Date.now();
  try {
    const rawPlan = await requestQueryPlan(query, clarificationAnswer || undefined);
    const plan = validateQueryPlan(rawPlan);

    if (plan.status === "unsupported") {
      return sendJson(res, 422, {
        code: "UNSUPPORTED_DEMO_SCOPE",
        error: `Demo Mode does not include a ${plan.domain} sample table. No unrelated rows were returned. Supported domains: companies, restaurants, hotels, homes, cars, and phones.`,
      });
    }

    if (
      plan.status === "query" &&
      requestedDomain &&
      plan.table !== requestedDomain
    ) {
      return sendJson(res, 502, {
        code: "AI_DOMAIN_MISMATCH",
        error: `The model selected ${DOMAIN_LABELS[plan.table]}, but the question targets ${DOMAIN_LABELS[requestedDomain]}. No rows were returned; rephrase the question or choose a domain explicitly.`,
      });
    }

    if (plan.status === "clarification_needed") {
      return sendJson(
        res,
        200,
        clarificationResponse(plan.question, plan.options)
      );
    }

    const { sql, parameters } = compileQueryPlan(plan);
    const validation = validateReadOnlySelect(sql);
    if (!validation.ok) {
      return sendJson(res, 422, {
        code: "READ_ONLY_QUERY_REQUIRED",
        error: validation.message,
      });
    }

    const result = await executeDemoSql(sql, parameters);
    return sendJson(res, 200, {
      status: "success",
      originalQuery: query,
      resolvedQuery: clarificationAnswer
        ? `${query} · clarified: ${clarificationAnswer}`
        : query,
      sql,
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rows.length,
      businessInsight: result.rows.length
        ? plan.insight
        : `No sample records in ${plan.table} matched the requested filters.`,
      chartHint: { chartType: plan.chartType, title: plan.title },
      dataNotice: SAMPLE_DATA_NOTICE,
      executionTimeMs: Math.max(1, Date.now() - startedAt),
    });
  } catch (error) {
    if (error instanceof LlmConfigurationError) {
      return sendJson(res, 503, { code: error.code, error: error.message });
    }
    if (error instanceof LlmProviderError) {
      return sendJson(res, 502, { code: error.code, error: error.message });
    }
    if (error instanceof InvalidQueryPlanError) {
      return sendJson(res, 502, {
        code: "AI_INVALID_PLAN",
        error: "The model returned a query outside the safe sample schema. Rephrase the question and try again.",
      });
    }
    return sendJson(res, 500, {
      code: "QUERY_EXECUTION_ERROR",
      error: "The sample query could not be executed. Please try again.",
    });
  }
}
