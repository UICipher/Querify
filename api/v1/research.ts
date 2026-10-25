import type { IncomingMessage, ServerResponse } from "node:http";
import {
  handleOptions,
  readJson,
  RequestBodyTooLargeError,
  sendJson,
} from "../../server/querify-api/_lib.js";
import {
  GeminiResearchConfigurationError,
  GeminiResearchProviderError,
  requestGeminiResearch,
} from "../../server/querify-api/geminiSearch.js";

type ResearchBody = { query?: string };
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;
const MAX_RATE_LIMIT_CLIENTS = 1024;
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
      code: "RESEARCH_RATE_LIMITED",
      error: "Too many answer requests. Wait a minute and try again.",
    });
  }

  let body: ResearchBody;
  try {
    body = await readJson<ResearchBody>(req);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return sendJson(res, 413, {
        code: "REQUEST_TOO_LARGE",
        error: "The question exceeds the 16 KiB request limit.",
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
      code: "QUERY_REQUIRED",
      error: "Enter a question to get an answer.",
    });
  }
  if (query.length > 1000) {
    return sendJson(res, 422, {
      code: "QUERY_TOO_LONG",
      error: "Keep a question under 1,000 characters.",
    });
  }

  try {
    const result = await requestGeminiResearch(query);
    return sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof GeminiResearchConfigurationError) {
      return sendJson(res, 503, {
        code: error.code,
        error: `${error.message} No demo data was used.`,
      });
    }
    if (error instanceof GeminiResearchProviderError) {
      if (error.status === 401 || error.status === 403) {
        return sendJson(res, 502, {
          code: "GEMINI_ACCESS_DENIED",
          error: "Google rejected the configured Gemini key or Free-Tier model access. Check the server key and model settings. No demo data was used.",
        });
      }
      if (error.status === 429 || error.providerStatus === "RESOURCE_EXHAUSTED") {
        return sendJson(res, 429, {
          code: "GEMINI_QUOTA_LIMIT",
          error: "The Gemini Free-Tier request limit was reached. Wait and retry later; no demo data was used.",
        });
      }
      if (error.status === 400 || error.status === 404) {
        const providerDetails = [error.providerStatus, error.providerMessage]
          .filter((detail): detail is string => Boolean(detail))
          .join(": ");
        return sendJson(res, 502, {
          code: "GEMINI_MODEL_OR_REQUEST_REJECTED",
          error: `Google rejected the text-only Gemini model request${providerDetails ? `. Google says: ${providerDetails}` : ""}. No demo data was used.`,
        });
      }
      console.error("[Knowledge Answers] Gemini request failed", {
        upstreamStatus: error.status ?? null,
        providerStatus: error.providerStatus ?? null,
        failureStage: error.failureStage ?? null,
      });
      const safeDiagnostic = error.status
        ? `Provider HTTP ${error.status}${error.providerStatus ? ` (${error.providerStatus})` : ""}. `
        : error.failureStage
          ? `Failure stage ${error.failureStage}. `
          : `Provider status ${error.providerStatus ?? "unknown"}. `;
      return sendJson(res, 502, {
        code: error.code,
        error: `${safeDiagnostic}A text-only answer could not be generated. Try again later. No demo data was used.`,
      });
    }
    return sendJson(res, 500, {
      code: "RESEARCH_ERROR",
      error: "The answer service failed unexpectedly. No demo data was used.",
    });
  }
}
