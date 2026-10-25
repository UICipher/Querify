import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiResearchConfigurationError,
  GeminiResearchProviderError,
  requestGeminiResearch,
} from "./geminiSearch";

function interactionsPayload(answer = "A useful answer from existing model knowledge.") {
  return { interaction: { output_text: answer } };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Gemini free text-only client", () => {
  it("requires a server-side Gemini key and never falls back to sample data", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestGeminiResearch("What is photosynthesis?"))
      .rejects.toBeInstanceOf(GeminiResearchConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses Gemini 3.5 Flash-Lite through Interactions with no tools and returns no citations", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("QUERIFY_GEMINI_MODEL", "gemini-3.5-flash-lite");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(interactionsPayload()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestGeminiResearch("Explain how photosynthesis works.");
    expect(result.answer).toBe("A useful answer from existing model knowledge.");
    expect(result.sources).toEqual([]);
    expect(result.citations).toEqual([]);
    expect(result.searchSuggestionsHtml).toBe("");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("server-only-test-key");
    const requestBody = JSON.parse(String(init.body));
    expect(requestBody.model).toBe("gemini-3.5-flash-lite");
    expect(requestBody.tools).toBeUndefined();
    expect(Object.hasOwn(requestBody, "tools")).toBe(false);
    expect(requestBody.generation_config).toEqual({
      max_output_tokens: 1024,
      thinking_level: "low",
      tool_choice: "none",
    });
    expect(requestBody.input).toContain("no live web browsing");
    expect(requestBody.input).toContain("photosynthesis");
  });

  it("parses model_output text when output_text is not present", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("QUERIFY_GEMINI_MODEL", "");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      interaction: {
        steps: [{
          type: "model_output",
          content: [{ type: "text", text: "A step-based answer." }],
        }],
      },
    }), { status: 200 })));

    const result = await requestGeminiResearch("Explain gravity.");
    expect(result.answer).toBe("A step-based answer.");
    expect(result.sources).toEqual([]);
    expect(result.citations).toEqual([]);
  });

  it("rejects a different model instead of silently leaving free text-only mode", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("QUERIFY_GEMINI_MODEL", "gemini-2.5-flash");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an empty model response rather than returning demo rows", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(interactionsPayload("  ")), { status: 200 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toBeInstanceOf(GeminiResearchProviderError);
  });

  it("redacts the key and user question from provider diagnostics", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      error: {
        code: 400,
        status: "INVALID_ARGUMENT",
        message: "Request private research question rejected with key server-only-test-key",
      },
    }), { status: 400 })));
    await expect(requestGeminiResearch("private research question"))
      .rejects.toMatchObject({
        status: 400,
        providerStatus: "INVALID_ARGUMENT",
        providerMessage: "Request [redacted] rejected with key [redacted]",
      });
  });

  it("preserves provider HTTP status for free-tier quota handling", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota detail", { status: 429 })));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toMatchObject({ status: 429, code: "GEMINI_TEXT_GENERATION_FAILED" });
  });

  it("distinguishes a model timeout from a general network failure", async () => {
    vi.stubEnv("QUERIFY_GEMINI_API_KEY", "server-only-test-key");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("request timed out", "TimeoutError");
    }));
    await expect(requestGeminiResearch("Any question?"))
      .rejects.toMatchObject({ failureStage: "timeout", providerStatus: "REQUEST_TIMEOUT" });
  });
});
