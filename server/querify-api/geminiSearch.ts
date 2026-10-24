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

  constructor() {
    super("Google Search grounding did not return a usable sourced answer.");
    this.name = "GeminiResearchProviderError";
  }
}

const RESEARCH_INSTRUCTIONS = `Answer the user's question using Google Search grounding. The question may concern any topic or country. Prefer current, primary, and credible sources when relevant. Be clear about dates, disagreements, uncertainty, and what the sources do not establish. Do not invent facts or citations. Use concise, readable prose in the user's language. Do not claim that your search covers the entire internet.`;

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
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: RESEARCH_INSTRUCTIONS }] },
          contents: [{ role: "user", parts: [{ text: query }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(9_000),
      }
    );
  } catch {
    throw new GeminiResearchProviderError();
  }

  if (!response.ok) throw new GeminiResearchProviderError();
  const payload = asRecord(await response.json().catch(() => null));
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const candidate = asRecord(candidates[0]);
  const content = asRecord(candidate?.content);
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const answer = parts
    .map(part => asRecord(part)?.text)
    .filter((text): text is string => typeof text === "string")
    .join("")
    .trim();
  const metadata = asRecord(candidate?.groundingMetadata);
  const chunks = Array.isArray(metadata?.groundingChunks)
    ? metadata.groundingChunks
    : [];
  const sources: GroundedSource[] = [];
  const sourceIndexMap = new Map<number, number>();

  chunks.forEach((value, originalIndex) => {
    const chunk = asRecord(value);
    const web = asRecord(chunk?.web);
    const url = safeHttpsUrl(web?.uri);
    if (!url) return;
    const title = typeof web?.title === "string" && web.title.trim()
      ? web.title.trim().slice(0, 240)
      : new URL(url).hostname;
    let sourceIndex = sources.findIndex(source => source.url === url);
    if (sourceIndex < 0) {
      sourceIndex = sources.push({ title, url }) - 1;
    }
    sourceIndexMap.set(originalIndex, sourceIndex);
  });

  const rawSupports = Array.isArray(metadata?.groundingSupports)
    ? metadata.groundingSupports
    : [];
  const citations: GroundedCitation[] = rawSupports.flatMap(value => {
    const support = asRecord(value);
    const segment = asRecord(support?.segment);
    const endIndex = segment?.endIndex;
    if (typeof endIndex !== "number" || !Number.isInteger(endIndex) || endIndex < 0) {
      return [];
    }
    const rawIndices = Array.isArray(support?.groundingChunkIndices)
      ? support.groundingChunkIndices
      : [];
    const sourceIndices = [...new Set(rawIndices
      .filter((index): index is number => typeof index === "number")
      .map(index => sourceIndexMap.get(index))
      .filter((index): index is number => index !== undefined))];
    return sourceIndices.length ? [{ endIndex, sourceIndices }] : [];
  });

  const searchEntryPoint = asRecord(metadata?.searchEntryPoint);
  const searchSuggestionsHtml = searchEntryPoint?.renderedContent;
  if (
    !answer ||
    answer.length > 20_000 ||
    !sources.length ||
    typeof searchSuggestionsHtml !== "string" ||
    !searchSuggestionsHtml.trim() ||
    searchSuggestionsHtml.length > 50_000
  ) {
    throw new GeminiResearchProviderError();
  }

  return { answer, sources, citations, searchSuggestionsHtml };
}
