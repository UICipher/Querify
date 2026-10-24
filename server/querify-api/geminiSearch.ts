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

export class GeminiResearchConfigurationError extends Error {
  readonly code = "GEMINI_NOT_CONFIGURED";

  constructor() {
    super("Web Research needs QUERIFY_GEMINI_API_KEY in the server environment.");
    this.name = "GeminiResearchConfigurationError";
  }
}

export class GeminiResearchProviderError extends Error {
  readonly code = "GEMINI_SEARCH_FAILED";

  constructor(readonly status?: number) {
    super("Google Search grounding did not return a usable sourced answer.");
    this.name = "GeminiResearchProviderError";
  }
}

const RESEARCH_INSTRUCTIONS = `Use Google Search grounding to research the user's question before answering. The question may concern any topic or country. Prefer current, primary, and credible sources when relevant. Be clear about dates, disagreements, uncertainty, and what the sources do not establish. Do not invent facts or citations. Use concise, readable prose in the user's language. Do not claim that your search covers the entire internet.`;
const REQUEST_TIMEOUT_MS = 50_000;

type TextOutputBlock = {
  text: string;
  annotations: unknown[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function integerField(
  record: Record<string, unknown>,
  snakeCase: string,
  camelCase: string
): number | null {
  const value = record[snakeCase] ?? record[camelCase];
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export async function requestGeminiResearch(
  query: string,
  fetcher: typeof fetch = fetch
): Promise<GeminiResearchResult> {
  const apiKey = process.env.QUERIFY_GEMINI_API_KEY?.trim();
  const model = process.env.QUERIFY_GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  if (!apiKey || !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) {
    throw new GeminiResearchConfigurationError();
  }

  let response: Response;
  try {
    response = await fetcher(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model,
          input: `${RESEARCH_INSTRUCTIONS}\n\nUser question:\n${query}`,
          tools: [{ type: "google_search" }],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
  } catch {
    throw new GeminiResearchProviderError();
  }

  if (!response.ok) throw new GeminiResearchProviderError(response.status);

  const payload = asRecord(await response.json().catch(() => null));
  const interaction = asRecord(payload?.interaction) ?? payload;
  const steps = Array.isArray(interaction?.steps) ? interaction.steps : [];
  const textBlocks: TextOutputBlock[] = [];
  const suggestions: string[] = [];

  for (const value of steps) {
    const step = asRecord(value);
    if (!step) continue;

    if (step.type === "google_search_result") {
      const results = Array.isArray(step.result)
        ? step.result
        : step.result
          ? [step.result]
          : [];
      for (const resultValue of results) {
        const result = asRecord(resultValue);
        const suggestion = result?.search_suggestions ?? result?.searchSuggestions;
        if (typeof suggestion === "string" && suggestion.trim()) {
          suggestions.push(suggestion.trim());
        }
      }
    }

    if (step.type !== "model_output" || !Array.isArray(step.content)) continue;
    for (const contentValue of step.content) {
      const content = asRecord(contentValue);
      if (content?.type !== "text" || typeof content.text !== "string") continue;
      textBlocks.push({
        text: content.text,
        annotations: Array.isArray(content.annotations) ? content.annotations : [],
      });
    }
  }

  const joinedAnswer = textBlocks.map(block => block.text).join("\n");
  const leadingWhitespace = joinedAnswer.length - joinedAnswer.trimStart().length;
  const answer = joinedAnswer.trim();
  const sources: GroundedSource[] = [];
  const sourceIndexByUrl = new Map<string, number>();
  const citations: GroundedCitation[] = [];
  let blockOffset = 0;

  for (const block of textBlocks) {
    for (const annotationValue of block.annotations) {
      const annotation = asRecord(annotationValue);
      if (annotation?.type !== "url_citation") continue;
      const url = safeHttpsUrl(annotation.url);
      const blockEndIndex = integerField(annotation, "end_index", "endIndex");
      if (!url || blockEndIndex === null || blockEndIndex > block.text.length) continue;

      let sourceIndex = sourceIndexByUrl.get(url);
      if (sourceIndex === undefined) {
        const title = typeof annotation.title === "string" && annotation.title.trim()
          ? annotation.title.trim().slice(0, 240)
          : new URL(url).hostname;
        sourceIndex = sources.push({ title, url }) - 1;
        sourceIndexByUrl.set(url, sourceIndex);
      }

      const endIndex = blockOffset + blockEndIndex - leadingWhitespace;
      if (endIndex < 0 || endIndex > answer.length) continue;
      const existing = citations.find(citation => citation.endIndex === endIndex);
      if (existing) {
        if (!existing.sourceIndices.includes(sourceIndex)) {
          existing.sourceIndices.push(sourceIndex);
        }
      } else {
        citations.push({ endIndex, sourceIndices: [sourceIndex] });
      }
    }
    blockOffset += block.text.length + 1;
  }

  const searchSuggestionsHtml = suggestions.join("\n");
  if (
    !answer ||
    answer.length > 20_000 ||
    !sources.length ||
    !citations.length ||
    !searchSuggestionsHtml ||
    searchSuggestionsHtml.length > 50_000
  ) {
    throw new GeminiResearchProviderError();
  }

  return { answer, sources, citations, searchSuggestionsHtml };
}
