import type { IncomingMessage, ServerResponse } from "node:http";
import {
  handleOptions,
  readJson,
  RequestBodyTooLargeError,
  sendJson,
} from "../_lib.js";
import {
  GeminiResearchConfigurationError,
  GeminiResearchProviderError,
  requestGeminiResearch,
} from "../geminiSearch.js";

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
      error: "Too many web research requests. Please wait a minute and try again.",
    });
  }

  let body: ResearchBody;
  try {
    body = await readJson<ResearchBody>(req);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return sendJson(res, 413, {
        code: "REQUEST_TOO_LARGE",
        error: "The research request exceeds the 16 KiB size limit.",
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
      error: "Enter a question to search the public web.",
    });
  }
  if (query.length > 1000) {
    return sendJson(res, 422, {
      code: "QUERY_TOO_LONG",
      error: "Keep a web research question under 1,000 characters.",
    });
  }

  try {
    const result = await requestGeminiResearch(query);
    return sendJson(res, 200, result);
  } catch (error) {
    if (error instanceof GeminiResearchConfigurationError) {
      return sendJson(res, 503, {
        code: error.code,
        error: "Web Research is not configured. Add QUERIFY_GEMINI_API_KEY in Vercel settings. No demo data was used.",
      });
    }
    if (error instanceof GeminiResearchProviderError) {
      return sendJson(res, 502, {
        code: error.code,
        error: "Google Search grounding did not return a sourced answer. Check Gemini model access, billing, and key settings, then retry. No demo data was used.",
      });
    }
    return sendJson(res, 500, {
      code: "RESEARCH_ERROR",
      error: "Web research failed unexpectedly. No demo data was used.",
    });
  }
}
