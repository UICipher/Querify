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

function generateContentPayload(sourceUrl = "https://example.com/source") {
  const answer = "A current, sourced answer.";
  return {
    candidates: [{
      content: { parts: [{ text: answer }] },
      groundingMetadata: {
        searchEntryPoint: { renderedContent: "<div>Google Search suggestions</div>" },
        groundingChunks: [{ web: { uri: sourceUrl, title: "Example source" } }],
        groundingSupports: [{
          segment: { startIndex: 0, endIndex: answer.length, text: answer },
          groundingChunkIndices: [0],
        }],
      },
    }],
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Vercel general Web Research endpoint", () => {
  it("returns an explicit configuration error instead of substituting demo rows", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "What is new in astronomy?" });
    expect(result.status).toBe(503);
    expect(result.body.code).toBe("GEMINI_NOT_CONFIGURED");
    expect(result.body.error).toContain("No demo data was used");
    expect(result.body.rows).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses Gemini 2.5 GenerateContent Search grounding and returns source citations without persistence", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(generateContentPayload()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "Find recent ocean research in any language" });
    expect(result.status).toBe(200);
    expect(result.body.answer).toBe("A current, sourced answer.");
    expect(result.body.sources).toEqual([
      { title: "Example source", url: "https://example.com/source" },
    ]);
    expect(result.body.citations).toEqual([{ endIndex: 26, sourceIndices: [0] }]);
    expect(result.body.searchSuggestionsHtml).toContain("Google Search suggestions");
    expect(result.body.rows).toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    const requestBody = JSON.parse(String(init.body));
    expect(requestBody.tools).toEqual([{ googleSearchRetrieval: {} }]);
    expect(requestBody.contents[0].parts[0].text).toContain("recent ocean research");
  });

  it("rejects an ungrounded provider answer rather than returning uncited AI prose", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("QUERIFY_GEMINI_MODEL", "");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "No sources." }] } }],
    }), { status: 200 })));
    const result = await postResearch({ query: "Tell me about current events" });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("GEMINI_SEARCH_FAILED");
    expect(result.body.error).toContain("No demo data was used");
  });

  it("returns safe guidance when Gemini rejects the key or access", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private provider body", { status: 403 })));
    const result = await postResearch({ query: "What is new in astronomy?" });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("GEMINI_ACCESS_DENIED");
    expect(result.body.error).toContain("No demo data was used");
    expect(result.body.error).not.toContain("private provider body");
  });

  it("returns quota guidance when Gemini rate-limits a request", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private provider body", { status: 429 })));
    const result = await postResearch({ query: "What is new in astronomy?" });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("GEMINI_QUOTA_LIMIT");
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
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(generateContentPayload()), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "What does DROP mean in geology?" });
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
