import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it } from "vitest";
import handler from "./query";

async function postQuery(payload: Record<string, unknown>) {
  const request = Readable.from([JSON.stringify(payload)]) as Readable & {
    method?: string;
  };
  request.method = "POST";

  let responseBody = "";
  const response = {
    statusCode: 0,
    setHeader: () => undefined,
    end: (chunk?: string | Uint8Array) => {
      responseBody = String(chunk ?? "");
    },
  } as unknown as ServerResponse;

  await handler(request as unknown as IncomingMessage, response);
  return {
    status: response.statusCode,
    body: JSON.parse(responseBody) as Record<string, unknown>,
  };
}

describe("Vercel query API", () => {
  it("uses profit for a direct net-profit prompt instead of defaulting to revenue", async () => {
    const result = await postQuery({
      query: "Show net profit by company in 2024",
      execute: true,
    });

    expect(result.status).toBe(200);
    expect(result.body.sql).toContain("ORDER BY f.profit_millions DESC");
    expect(result.body.columns).toEqual(["company_name", "profit_millions"]);
  });

  it("never returns company fixtures for the reported restaurant prompt", async () => {
    const result = await postQuery({
      query: "give me the best restaurants - revenue",
      execute: true,
    });

    expect(result.status).toBe(422);
    expect(result.body.code).toBe("UNSUPPORTED_DEMO_SCOPE");
    expect(result.body.error).toContain("does not contain restaurant data");
    expect(result.body.rows).toBeUndefined();
  });

  it("uses a selected clarification metric over conflicting query wording", async () => {
    const result = await postQuery({
      query: "Show net profit by company in 2024",
      clarificationAnswer: "revenue",
      execute: true,
    });

    expect(result.body.sql).toContain("ORDER BY f.revenue_millions DESC");
  });

  it("offers only annual and all-available demo periods for revenue reports", async () => {
    const result = await postQuery({ query: "Show me the revenue report" });
    const options = result.body.options as Array<{ value: string }>;

    expect(result.body.status).toBe("clarification_needed");
    expect(options.map(option => option.value)).toEqual([
      "fiscal_year_2024",
      "all_time",
    ]);
  });

  it("rejects monthly periods when only annual fixtures are available", async () => {
    const result = await postQuery({
      query: "Show me the revenue report",
      clarificationAnswer: "this_month",
      conversationId: "test-conversation",
    });

    expect(result.status).toBe(422);
    expect(result.body.error).toContain("annual FY 2024 fixtures");
  });

  it("offers the same four metric choices supported by the interface", async () => {
    const result = await postQuery({
      query: "Show me the best performing AI companies",
    });
    const options = result.body.options as Array<{ value: string }>;

    expect(options.map(option => option.value)).toEqual([
      "revenue",
      "profit",
      "growth",
      "roi",
    ]);
  });
});
