import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiResearchConfigurationError,
  GeminiResearchProviderError,
  requestGeminiResearch,
} from "./geminiSearch";

function groundedPayload(sourceUrl = "https://example.com/report") {
  const answer = "Current answer with evidence.";
  return {
    steps: [
      { type: "google_search_call", arguments: { queries: ["current query"] } },
      {
        type: "google_search_result",
        result: [{ search_suggestions: "<div>Google Search suggestions</div>" }],
      },
      {
        type: "model_output",
        content: [{
          type: "text",
          text: answer,
          annotations: [{
            type: "url_citation",
            url: sourceUrl,
            title: "Example report",
            start_index: 0,
            end_index: answer.length,
          }],
        }],
      },
    ],
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

  it("calls the Interactions API with Google Search and returns URL citations", async () => {
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
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("server-only-test-key");
    const requestBody = JSON.parse(String(init.body));
    expect(requestBody.model).toBe("gemini-3.8-flash");
    expect(requestBody.tools).toEqual([{ type: "google_search" }]);
    expect(requestBody.input).toContain("climate policy");
    expect(requestBody.temperature).toBeUndefined();
    expect(requestBody.generation_config).toBeUndefined();
  });

  it("rejects an answer when Google returns no grounded citations or suggestions", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      steps: [{
        type: "model_output",
        content: [{ type: "text", text: "Uncited answer.", annotations: [] }],
      }],
    }), { status: 200 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchProviderError);
  });

  it("rejects insecure source links and does not present them as citations", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify(groundedPayload("http://example.com/report")),
      { status: 200 }
    )));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchProviderError);
  });

  it("preserves provider HTTP status for safe error diagnosis", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota detail", { status: 429 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toMatchObject({ status: 429, code: "GEMINI_SEARCH_FAILED" });
  });
});
