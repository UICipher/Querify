import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../../api/v1/research";

let sequence = 0;

async function postResearch(payload: Record<string, unknown>) {
  const request = Readable.from([JSON.stringify(payload)]) as Readable & {
    method?: string;
    headers?: Record<string, string>;
  };
  request.method = "POST";
  request.headers = { "x-real-ip": `research-test-${++sequence}` };
  let responseBody = "";
  const response = {
    statusCode: 0,
    setHeader: () => undefined,
    end: (chunk?: string | Uint8Array) => { responseBody = String(chunk ?? ""); },
  } as unknown as ServerResponse;
  await handler(request as unknown as IncomingMessage, response);
  return { status: response.statusCode, body: JSON.parse(responseBody) as Record<string, unknown> };
}

function textOnlyPayload(answer = "A useful answer from existing model knowledge.") {
  return { interaction: { output_text: answer } };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Vercel text-only Knowledge Answers endpoint", () => {
  it("returns a configuration error instead of substituting demo rows", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "What is photosynthesis?" });
    expect(result.status).toBe(503);
    expect(result.body.code).toBe("GEMINI_NOT_CONFIGURED");
    expect(result.body.error).toContain("No demo data was used");
    expect(result.body.rows).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a text-only answer with no sources, citations, or Search tools", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("QUERIFY_GEMINI_MODEL", "gemini-3.5-flash-lite");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(textOnlyPayload()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "What are common ways to rank restaurants?" });
    expect(result.status).toBe(200);
    expect(result.body.answer).toBe("A useful answer from existing model knowledge.");
    expect(result.body.sources).toEqual([]);
    expect(result.body.citations).toEqual([]);
    expect(result.body.searchSuggestionsHtml).toBe("");
    expect(result.body.rows).toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    const requestBody = JSON.parse(String(init.body));
    expect(requestBody.model).toBe("gemini-3.5-flash-lite");
    expect(requestBody.tools).toBeUndefined();
    expect(requestBody.input).toContain("no live web browsing");
    expect(requestBody.input).toContain("rank restaurants");
  });

  it("returns a safe error when the model response has no answer", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(textOnlyPayload(" ")), { status: 200 })));
    const result = await postResearch({ query: "Tell me about science." });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("GEMINI_TEXT_GENERATION_FAILED");
    expect(result.body.error).toContain("Failure stage invalid-output");
    expect(result.body.error).toContain("No demo data was used");
  });

  it("returns safe guidance when Gemini rejects the key or model access", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private provider body", { status: 403 })));
    const result = await postResearch({ query: "What is photosynthesis?" });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("GEMINI_ACCESS_DENIED");
    expect(result.body.error).toContain("No demo data was used");
    expect(result.body.error).not.toContain("private provider body");
  });

  it("returns a clear free-tier quota response", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private provider body", { status: 429 })));
    const result = await postResearch({ query: "What is photosynthesis?" });
    expect(result.status).toBe(429);
    expect(result.body.code).toBe("GEMINI_QUOTA_LIMIT");
    expect(result.body.error).toContain("Free-Tier request limit");
  });

  it("exposes a safe upstream status for generic failures without echoing provider bodies", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private provider body", { status: 500 })));
    const result = await postResearch({ query: "What is photosynthesis?" });
    expect(result.status).toBe(502);
    expect(result.body.error).toContain("Provider HTTP 500");
    expect(result.body.error).not.toContain("private provider body");
    expect(result.body.error).not.toContain("server-only-test-key");
  });

  it("reports a safe retry message when the model request times out", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("request timed out", "TimeoutError");
    }));
    const result = await postResearch({ query: "private question" });
    expect(result.status).toBe(502);
    expect(result.body.error).toContain("Failure stage timeout");
    expect(result.body.error).not.toContain("private question");
    expect(result.body.error).not.toContain("server-only-test-key");
  });

  it("returns sanitized Google request diagnostics without echoing secrets", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        code: 400,
        status: "INVALID_ARGUMENT",
        message: "Request private research question rejected with key server-only-test-key",
      },
    }), { status: 400 })));
    const result = await postResearch({ query: "private research question" });
    expect(result.status).toBe(502);
    expect(result.body.error).toContain("INVALID_ARGUMENT");
    expect(result.body.error).toContain("Request [redacted] rejected with key [redacted]");
    expect(result.body.error).not.toContain("server-only-test-key");
    expect(result.body.error).not.toContain("private research question");
  });

  it("validates blank and too-long questions", async () => {
    expect((await postResearch({ query: "   " })).status).toBe(422);
    expect((await postResearch({ query: "x".repeat(1001) })).status).toBe(422);
  });

  it("allows general questions that contain SQL-like words because this route is not a SQL executor", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(textOnlyPayload()), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "What does DROP mean in geology?" });
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
