export type GroundedSource = {
  title: string;
  url: string;
};

export type GroundedCitation = {
  endIndex: number;
  sourceIndices: number[];
};

export type GeminiResearchResult = {
  answer: string;
  sources: GroundedSource[];
  citations: GroundedCitation[];
  searchSuggestionsHtml: string;
};

const FREE_TEXT_MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 50_000;
const MAX_ANSWER_LENGTH = 20_000;

export class GeminiResearchConfigurationError extends Error {
  readonly code = "GEMINI_NOT_CONFIGURED";

  constructor(message = "Text-only answers require QUERIFY_GEMINI_API_KEY in the server environment.") {
    super(message);
    this.name = "GeminiResearchConfigurationError";
  }
}

export class GeminiResearchProviderError extends Error {
  readonly code = "GEMINI_TEXT_GENERATION_FAILED";

  constructor(
    readonly status?: number,
    readonly providerStatus?: string,
    readonly providerMessage?: string,
    readonly failureStage?: "network" | "timeout" | "invalid-json" | "invalid-output"
  ) {
    super("Gemini did not return a usable text-only answer.");
    this.name = "GeminiResearchProviderError";
  }
}

const TEXT_ONLY_INSTRUCTIONS = `Answer the user's question directly from your existing knowledge. This request has no live web browsing, Search grounding, external files, or citations. Never say that you searched, checked current sources, or verified facts online. Do not invent sources, citations, URLs, dates, prices, rankings, or other factual details. For current, local, or rapidly changing questions, clearly say that you cannot verify the latest information and that your answer may be outdated. For subjective rankings such as a world's top ten restaurants, explain that rankings depend on the publisher, criteria, and date, and label any list as an unverified starting point rather than a definitive current ranking. If you do not know enough to answer reliably, say so and ask a focused clarification rather than filling gaps with guesses. Keep the answer concise, structured, and in the user's language.`;

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | null {
  return typeof value === "object" && value !== null
    ? value as RecordValue
    : null;
}

function safeProviderMessage(value: unknown, secrets: string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  let message = value.replace(/\s+/g, " ").trim();
  for (const secret of secrets) {
    if (secret.length >= 4) message = message.replaceAll(secret, "[redacted]");
  }
  message = message.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]");
  return message.slice(0, 240) || undefined;
}

function outputTextFromSteps(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.flatMap(stepValue => {
    const step = asRecord(stepValue);
    if (step?.type !== "model_output" || !Array.isArray(step.content)) return [];
    return step.content.flatMap(contentValue => {
      const content = asRecord(contentValue);
      return content?.type === "text" && typeof content.text === "string"
        ? [content.text]
        : [];
    });
  }).join("\n");
}

function parseInteractionsResult(payload: RecordValue): GeminiResearchResult {
  const interaction = asRecord(payload.interaction) ?? payload;
  const directText = interaction.output_text ?? interaction.outputText;
  const rawAnswer = typeof directText === "string"
    ? directText
    : outputTextFromSteps(interaction.steps);
  const answer = rawAnswer.trim();
  if (!answer || answer.length > MAX_ANSWER_LENGTH) {
    throw new GeminiResearchProviderError(undefined, "INVALID_OUTPUT", undefined, "invalid-output");
  }

  return {
    answer,
    sources: [],
    citations: [],
    searchSuggestionsHtml: "",
  };
}

export async function requestGeminiResearch(
  query: string,
  fetcher: typeof fetch = fetch
): Promise<GeminiResearchResult> {
  const apiKey = process.env.QUERIFY_GEMINI_API_KEY?.trim();
  const configuredModel = process.env.QUERIFY_GEMINI_MODEL?.trim();
  if (!apiKey) throw new GeminiResearchConfigurationError();
  if (configuredModel && configuredModel !== FREE_TEXT_MODEL) {
    throw new GeminiResearchConfigurationError(
      `Free text-only mode supports only ${FREE_TEXT_MODEL}; update QUERIFY_GEMINI_MODEL in the server environment.`
    );
  }

  const input = `${TEXT_ONLY_INSTRUCTIONS}\n\nUser question:\n${query}`;
  const url = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const requestBody = {
    model: FREE_TEXT_MODEL,
    input,
    generation_config: {
      max_output_tokens: 1024,
      thinking_level: "low",
      tool_choice: "none",
    },
  };

  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    const timedOut = errorName === "TimeoutError" || errorName === "AbortError";
    throw new GeminiResearchProviderError(
      undefined,
      timedOut ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
      undefined,
      timedOut ? "timeout" : "network"
    );
  }

  if (!response.ok) {
    const providerPayload = asRecord(await response.json().catch(() => null));
    const providerError = asRecord(providerPayload?.error);
    const providerStatus = typeof providerError?.status === "string"
      ? providerError.status.slice(0, 64)
      : undefined;
    const providerMessage = safeProviderMessage(providerError?.message, [apiKey, query]);
    throw new GeminiResearchProviderError(response.status, providerStatus, providerMessage);
  }

  const payload = asRecord(await response.json().catch(() => null));
  if (!payload) {
    throw new GeminiResearchProviderError(undefined, "INVALID_JSON", undefined, "invalid-json");
  }
  return parseInteractionsResult(payload);
}
