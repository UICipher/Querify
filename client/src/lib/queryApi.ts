export type LiveQueryResponse = {
  status?: "clarification_needed" | "sql_ready" | "success";
  conversationId?: string;
  question?: string;
  resolvedQuery?: string;
  options?: Array<{ id: string; label: string; value: string }>;
  sql?: string;
  columns?: string[];
  rows?: Array<Record<string, string | number | null>>;
  businessInsight?: string;
  chartHint?: { chartType?: "table" | "bar" | "line"; title?: string };
  executionTimeMs?: number;
};

type QueryRuntime = { queryApiUrl?: string };

type QueryWindow = Window & { __MANUS_CONFIG__?: QueryRuntime };

export function queryApiUrl(): string {
  const runtimeUrl = (
    window as QueryWindow
  ).__MANUS_CONFIG__?.queryApiUrl?.trim();
  const buildUrl = import.meta.env.VITE_QUERY_API_URL?.trim();
  return (
    runtimeUrl ||
    buildUrl ||
    (import.meta.env.PROD ? window.location.origin : "")
  );
}

export async function executeLiveQuery(payload: {
  query: string;
  clarificationAnswer?: string;
  conversationId?: string;
  execute?: boolean;
}): Promise<LiveQueryResponse> {
  const base = queryApiUrl();
  if (!base) throw new Error("LIVE_API_NOT_CONFIGURED");

  const endpoint = base.endsWith("/api/v1/query")
    ? base
    : `${base.replace(/\/$/, "")}/api/v1/query`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      body?.message ||
        body?.error ||
        `Query request failed (${response.status})`
    ) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body as LiveQueryResponse;
}
