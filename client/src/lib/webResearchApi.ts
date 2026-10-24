import { queryApiUrl } from "./queryApi";

export type GroundedSource = { title: string; url: string };
export type GroundedCitation = { endIndex: number; sourceIndices: number[] };
export type WebResearchResponse = {
  answer: string;
  sources: GroundedSource[];
  citations: GroundedCitation[];
  searchSuggestionsHtml: string;
};

export async function executeWebResearch(query: string): Promise<WebResearchResponse> {
  const base = queryApiUrl();
  if (!base) {
    const error = new Error(
      "Web Research needs the deployed API. Open the Vercel deployment or configure VITE_QUERY_API_URL."
    ) as Error & { code?: string };
    error.code = "RESEARCH_API_NOT_CONFIGURED";
    throw error;
  }

  const endpoint = base.endsWith("/api/v1/research")
    ? base
    : `${base.replace(/\/$/, "")}/api/v1/research`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      typeof body?.error === "string" ? body.error : `Web research failed (${response.status}).`
    ) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = typeof body?.code === "string" ? body.code : undefined;
    throw error;
  }
  return body as WebResearchResponse;
}
