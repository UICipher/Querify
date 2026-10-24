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

function groundedPayload() {
  return {
    candidates: [{
      content: { parts: [{ text: "A current, sourced answer." }] },
      groundingMetadata: {
        searchEntryPoint: { renderedContent: "<div>Google Search suggestions</div>" },
        groundingChunks: [{ web: { uri: "https://example.com/source", title: "Example source" } }],
        groundingSupports: [{ segment: { startIndex: 0, endIndex: 23 }, groundingChunkIndices: [0] }],
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

  it("uses Google Search grounding for any topic and returns the source widget without persisting the answer", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(groundedPayload()), {
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
    expect(result.body.searchSuggestionsHtml).toContain("Google Search suggestions");
    expect(result.body.rows).toBeUndefined();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).tools).toEqual([{ google_search: {} }]);
  });

  it("rejects an ungrounded provider answer rather than returning uncited AI prose", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "No sources." }] } }],
    }), { status: 200 })));
    const result = await postResearch({ query: "Tell me about current events" });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("GEMINI_SEARCH_FAILED");
    expect(result.body.error).toContain("No demo data was used");
  });

  it("validates blank and too-long questions", async () => {
    expect((await postResearch({ query: "   " })).status).toBe(422);
    expect((await postResearch({ query: "x".repeat(1001) })).status).toBe(422);
  });

  it("allows general questions that contain SQL-like words because this route is not a SQL executor", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(groundedPayload()), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await postResearch({ query: "What does DROP mean in geology?" });
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
