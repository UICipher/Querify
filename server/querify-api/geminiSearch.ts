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

  constructor(
    readonly status?: number,
    readonly providerStatus?: string,
    readonly providerMessage?: string
  ) {
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

function safeProviderMessage(value: unknown, secrets: string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  let message = value.replace(/\s+/g, " ").trim();
  for (const secret of secrets) {
    if (secret.length >= 4) message = message.replaceAll(secret, "[redacted]");
  }
  message = message.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[redacted]");
  return message.slice(0, 240) || undefined;
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

function addSource(
  sources: GroundedSource[],
  sourceIndexByUrl: Map<string, number>,
  rawUrl: unknown,
  rawTitle: unknown
): number | null {
  const url = safeHttpsUrl(rawUrl);
  if (!url) return null;

  const existingIndex = sourceIndexByUrl.get(url);
  if (existingIndex !== undefined) return existingIndex;

  const title = typeof rawTitle === "string" && rawTitle.trim()
    ? rawTitle.trim().slice(0, 240)
    : new URL(url).hostname;
  const index = sources.push({ title, url }) - 1;
  sourceIndexByUrl.set(url, index);
  return index;
}

function addCitation(
  citations: GroundedCitation[],
  endIndex: number,
  sourceIndices: number[]
): void {
  const uniqueIndices = [...new Set(sourceIndices)];
  if (!uniqueIndices.length) return;
  const existing = citations.find(citation => citation.endIndex === endIndex);
  if (existing) {
    for (const sourceIndex of uniqueIndices) {
      if (!existing.sourceIndices.includes(sourceIndex)) existing.sourceIndices.push(sourceIndex);
    }
    return;
  }
  citations.push({ endIndex, sourceIndices: uniqueIndices });
}

function validateResult(result: GeminiResearchResult): GeminiResearchResult {
  const answer = result.answer.trim();
  const searchSuggestionsHtml = result.searchSuggestionsHtml.trim();
  if (
    !answer ||
    answer.length > 20_000 ||
    !result.sources.length ||
    !result.citations.length ||
    !searchSuggestionsHtml ||
    searchSuggestionsHtml.length > 50_000
  ) {
    throw new GeminiResearchProviderError();
  }
  return { ...result, answer, searchSuggestionsHtml };
}

function parseInteractionsResult(payload: Record<string, unknown>): GeminiResearchResult {
  const interaction = asRecord(payload.interaction) ?? payload;
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
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
      const blockEndIndex = integerField(annotation, "end_index", "endIndex");
      if (blockEndIndex === null || blockEndIndex > block.text.length) continue;
      const sourceIndex = addSource(sources, sourceIndexByUrl, annotation.url, annotation.title);
      if (sourceIndex === null) continue;
      const endIndex = blockOffset + blockEndIndex - leadingWhitespace;
      if (endIndex < 0 || endIndex > answer.length) continue;
      addCitation(citations, endIndex, [sourceIndex]);
    }
    blockOffset += block.text.length + 1;
  }

  return validateResult({
    answer,
    sources,
    citations,
    searchSuggestionsHtml: suggestions.join("\n"),
  });
}

function parseGenerateContentResult(payload: Record<string, unknown>): GeminiResearchResult {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const candidate = asRecord(candidates[0]);
  const content = asRecord(candidate?.content);
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const answerParts = parts
    .map(part => asRecord(part)?.text)
    .filter((text): text is string => typeof text === "string");
  const joinedAnswer = answerParts.join("\n");
  const leadingWhitespace = joinedAnswer.length - joinedAnswer.trimStart().length;
  const answer = joinedAnswer.trim();

  const metadata = asRecord(candidate?.groundingMetadata ?? candidate?.grounding_metadata);
  const chunks = Array.isArray(metadata?.groundingChunks)
    ? metadata.groundingChunks
    : Array.isArray(metadata?.grounding_chunks)
      ? metadata.grounding_chunks
      : [];
  const sources: GroundedSource[] = [];
  const sourceIndexByUrl = new Map<string, number>();
  const chunkIndexToSourceIndex = new Map<number, number>();

  chunks.forEach((chunkValue, chunkIndex) => {
    const chunk = asRecord(chunkValue);
    const web = asRecord(chunk?.web);
    const sourceIndex = addSource(sources, sourceIndexByUrl, web?.uri ?? web?.url, web?.title);
    if (sourceIndex !== null) chunkIndexToSourceIndex.set(chunkIndex, sourceIndex);
  });

  const rawSupports = Array.isArray(metadata?.groundingSupports)
    ? metadata.groundingSupports
    : Array.isArray(metadata?.grounding_supports)
      ? metadata.grounding_supports
      : [];
  const citations: GroundedCitation[] = [];
  for (const supportValue of rawSupports) {
    const support = asRecord(supportValue);
    const segment = asRecord(support?.segment);
    if (!segment) continue;
    const rawEndIndex = integerField(segment, "end_index", "endIndex");
    if (rawEndIndex === null) continue;
    const endIndex = rawEndIndex - leadingWhitespace;
    if (endIndex < 0 || endIndex > answer.length) continue;

    const rawChunkIndices = support?.groundingChunkIndices ?? support?.grounding_chunk_indices;
    if (!Array.isArray(rawChunkIndices)) continue;
    const sourceIndices = rawChunkIndices
      .filter((index): index is number => typeof index === "number" && Number.isInteger(index))
      .map(index => chunkIndexToSourceIndex.get(index))
      .filter((index): index is number => index !== undefined);
    addCitation(citations, endIndex, sourceIndices);
  }

  const searchEntryPoint = asRecord(metadata?.searchEntryPoint ?? metadata?.search_entry_point);
  const suggestions = searchEntryPoint?.renderedContent ?? searchEntryPoint?.rendered_content;
  return validateResult({
    answer,
    sources,
    citations,
    searchSuggestionsHtml: typeof suggestions === "string" ? suggestions : "",
  });
}

export async function requestGeminiResearch(
  query: string,
  fetcher: typeof fetch = fetch
): Promise<GeminiResearchResult> {
  const apiKey = process.env.QUERIFY_GEMINI_API_KEY?.trim();
  const model = process.env.QUERIFY_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  if (!apiKey || !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) {
    throw new GeminiResearchConfigurationError();
  }

  const input = `${RESEARCH_INSTRUCTIONS}\n\nUser question:\n${query}`;
  const useGenerateContent = /^gemini-(?:2\.5|2\.0)-/.test(model);
  const url = useGenerateContent
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    : "https://generativelanguage.googleapis.com/v1beta/interactions";
  const requestBody = useGenerateContent
    ? {
        contents: [{ parts: [{ text: input }] }],
        tools: [{ googleSearchRetrieval: {} }],
      }
    : {
        model,
        input,
        tools: [{ type: "google_search" }],
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
  } catch {
    throw new GeminiResearchProviderError();
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
  if (!payload) throw new GeminiResearchProviderError();
  return useGenerateContent
    ? parseGenerateContentResult(payload)
    : parseInteractionsResult(payload);
}
