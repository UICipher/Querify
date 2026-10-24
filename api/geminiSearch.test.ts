import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiResearchConfigurationError,
  GeminiResearchProviderError,
  requestGeminiResearch,
} from "./geminiSearch";

function groundedPayload() {
  return {
    candidates: [{
      content: { parts: [{ text: "Current answer with evidence." }] },
      groundingMetadata: {
        searchEntryPoint: { renderedContent: "<div>Google Search suggestions</div>" },
        groundingChunks: [
          { web: { uri: "https://example.com/report", title: "Example report" } },
        ],
        groundingSupports: [
          { segment: { startIndex: 0, endIndex: 29 }, groundingChunkIndices: [0] },
        ],
      },
    }],
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Gemini Google Search grounding client", () => {
  it("requires a dedicated server-side Gemini key and does not attempt a demo fallback", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiResearch("What happened today?"))
      .rejects.toBeInstanceOf(GeminiResearchConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls native generateContent with Google Search and returns sources and citation offsets", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("QUERIFY_GEMINI_MODEL", "gemini-3.8-flash");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(groundedPayload()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestGeminiResearch("What changed in climate policy this month?");
    expect(result.answer).toBe("Current answer with evidence.");
    expect(result.sources).toEqual([
      { title: "Example report", url: "https://example.com/report" },
    ]);
    expect(result.citations).toEqual([{ endIndex: 29, sourceIndices: [0] }]);
    expect(result.searchSuggestionsHtml).toContain("Google Search suggestions");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("server-only-test-key");
    const requestBody = JSON.parse(String(init.body));
    expect(requestBody.tools).toEqual([{ google_search: {} }]);
    expect(requestBody.contents[0].parts[0].text).toContain("climate policy");
  });

  it("rejects an answer when Google returns no grounded sources or suggestions", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "Uncited answer." }] } }],
    }), { status: 200 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchProviderError);
  });

  it("rejects insecure source links and does not present them as citations", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    const payload = groundedPayload();
    payload.candidates[0].groundingMetadata.groundingChunks[0].web.uri = "http://example.com";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchProviderError);
  });

  it("returns a generic provider error for non-success responses", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota detail", { status: 429 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchProviderError);
  });
});
