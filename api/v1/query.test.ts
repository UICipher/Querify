import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./query";

type Plan = Record<string, unknown>;
let requestSequence = 0;

async function postQuery(payload: Record<string, unknown>) {
  const request = Readable.from([JSON.stringify(payload)]) as Readable & {
    method?: string;
    headers?: Record<string, string>;
  };
  request.method = "POST";
  request.headers = { "x-real-ip": `test-client-${++requestSequence}` };

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

function queryPlan(overrides: Plan = {}): Plan {
  return {
    status: "query",
    table: "restaurants",
    columns: ["name", "city", "rating"],
    filters: [],
    groupBy: [],
    aggregate: null,
    orderBy: { column: "rating", direction: "desc" },
    limit: 5,
    title: "Top sample restaurants",
    insight: "The highest-rated restaurant sample records are shown first.",
    chartType: "bar",
    ...overrides,
  };
}

function configureModel(plan: Plan) {
  vi.stubEnv("QUERIFY_LLM_API_KEY", "test-server-secret");
  vi.stubEnv("QUERIFY_LLM_MODEL", "test-model");
  vi.stubEnv("QUERIFY_LLM_BASE_URL", "https://api.example.test/v1");
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(plan) } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Vercel AI-backed query API", () => {
  it("generates parameterized SQL and executes a restaurant query against seeded sample data", async () => {
    const fetchMock = configureModel(
      queryPlan({
        filters: [{ column: "city", operator: "eq", value: "Seattle" }],
      })
    );
    const result = await postQuery({
      query: "Show highly rated restaurants in Seattle",
      execute: true,
    });

    expect(result.status).toBe(200);
    expect(result.body.status).toBe("success");
    expect(result.body.sql).toContain('FROM "restaurants"');
    expect(result.body.sql).toContain('WHERE "city" = ?');
    expect(result.body.rows).toEqual([
      { name: "Harbor & Herb", city: "Seattle", rating: 4.8 },
      { name: "Marlow Noodle House", city: "Seattle", rating: 4.5 },
      { name: "Copper Bowl", city: "Seattle", rating: 4.2 },
    ]);
    expect(result.body.dataNotice).toContain("synthetic sample data");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-server-secret",
        }),
      })
    );
  });

  it.each([
    {
      query: "Find hotels with the lowest sample nightly rates",
      plan: queryPlan({
        table: "hotels",
        columns: ["name", "city", "nightly_rate_usd"],
        orderBy: { column: "nightly_rate_usd", direction: "asc" },
      }),
      first: { name: "Cypress Court", nightly_rate_usd: 176 },
    },
    {
      query: "Find three-bedroom homes under 600000",
      plan: queryPlan({
        table: "homes",
        columns: ["city", "neighborhood", "bedrooms", "listing_price_usd"],
        filters: [
          { column: "bedrooms", operator: "eq", value: 3 },
          { column: "listing_price_usd", operator: "lt", value: 600000 },
        ],
        orderBy: { column: "listing_price_usd", direction: "asc" },
      }),
      first: { city: "Portland", bedrooms: 3, listing_price_usd: 498000 },
    },
    {
      query: "Rank cars by estimated range",
      plan: queryPlan({
        table: "cars",
        columns: ["make", "model", "range_miles"],
        orderBy: { column: "range_miles", direction: "desc" },
        limit: 1,
      }),
      first: { make: "Morrow", model: "Cityline", range_miles: 610 },
    },
    {
      query: "Show phones with the highest camera resolution",
      plan: queryPlan({
        table: "phones",
        columns: ["brand", "model", "camera_mp"],
        orderBy: { column: "camera_mp", direction: "desc" },
        limit: 1,
      }),
      first: { brand: "Morrow", model: "Edge 5", camera_mp: 108 },
    },
    {
      query: "Rank companies by revenue growth",
      plan: queryPlan({
        table: "companies",
        columns: ["company_name", "revenue_growth_percent"],
        orderBy: { column: "revenue_growth_percent", direction: "desc" },
        limit: 1,
      }),
      first: { company_name: "NVIDIA", revenue_growth_percent: 100.3 },
    },
  ])("executes the model-selected $plan.table sample table", async ({ query, plan, first }) => {
    configureModel(plan);
    const result = await postQuery({ query, execute: true });
    expect(result.status).toBe(200);
    expect(result.body.sql).toContain(`FROM "${String(plan.table)}"`);
    expect((result.body.rows as Array<Record<string, unknown>>)[0]).toMatchObject(first);
  });

  it("asks which sample table to use before querying a mixed-domain prompt", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await postQuery({ query: "Compare companies and restaurants" });

    expect(result.status).toBe(200);
    expect(result.body.status).toBe("clarification_needed");
    expect(result.body.options).toEqual([
      { id: "companies", label: "Companies", value: "companies" },
      { id: "restaurants", label: "Restaurants", value: "restaurants" },
    ]);
    expect(result.body.rows).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("binds the model to the domain selected after a mixed-domain clarification", async () => {
    configureModel(queryPlan());
    const result = await postQuery({
      query: "Compare companies and restaurants",
      clarificationAnswer: "restaurants",
    });

    expect(result.status).toBe(200);
    expect(result.body.sql).toContain('FROM "restaurants"');
    expect(result.body.rows).toEqual([
      { name: "Little Fig", city: "New York", rating: 4.9 },
      { name: "Harbor & Herb", city: "Seattle", rating: 4.8 },
      { name: "Juniper Table", city: "Portland", rating: 4.7 },
      { name: "Saffron Street", city: "Austin", rating: 4.6 },
      { name: "Marlow Noodle House", city: "Seattle", rating: 4.5 },
    ]);
  });

  it("rejects a wrong model table even after the user selects a domain", async () => {
    configureModel(
      queryPlan({
        table: "companies",
        columns: ["company_name"],
        orderBy: { column: "company_name", direction: "asc" },
      })
    );
    const result = await postQuery({
      query: "Compare companies and restaurants",
      clarificationAnswer: "restaurants",
    });

    expect(result.status).toBe(502);
    expect(result.body.code).toBe("AI_DOMAIN_MISMATCH");
    expect(result.body.rows).toBeUndefined();
  });

  it("rejects a valid model plan when its table does not match the requested domain", async () => {
    configureModel(
      queryPlan({
        table: "companies",
        columns: ["company_name"],
        orderBy: { column: "company_name", direction: "asc" },
      })
    );
    const result = await postQuery({ query: "Show restaurants rated above 4.5" });

    expect(result.status).toBe(502);
    expect(result.body.code).toBe("AI_DOMAIN_MISMATCH");
    expect(result.body.error).toContain("No rows were returned");
    expect(result.body.rows).toBeUndefined();
  });

  it("returns a sanitized provider error when the configured model endpoint fails", async () => {
    vi.stubEnv("QUERIFY_LLM_API_KEY", "test-server-secret");
    vi.stubEnv("QUERIFY_LLM_MODEL", "test-model");
    vi.stubEnv("QUERIFY_LLM_BASE_URL", "https://api.example.test/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("private provider diagnostic", { status: 500 }))
    );
    const result = await postQuery({ query: "Show restaurants by rating" });

    expect(result.status).toBe(502);
    expect(result.body.code).toBe("AI_PROVIDER_ERROR");
    expect(result.body.error).not.toContain("private provider diagnostic");
    expect(result.body.error).not.toContain("test-server-secret");
  });

  it("supports safe grouped aggregates", async () => {
    configureModel(
      queryPlan({
        table: "hotels",
        columns: ["city"],
        groupBy: ["city"],
        aggregate: { function: "avg", column: "nightly_rate_usd" },
        orderBy: { column: "avg_nightly_rate_usd", direction: "desc" },
        limit: 5,
      })
    );
    const result = await postQuery({ query: "Average hotel nightly rate by city" });
    expect(result.status).toBe(200);
    expect(result.body.sql).toContain('AVG("nightly_rate_usd")');
    expect(result.body.sql).toContain('GROUP BY "city"');
    expect((result.body.rows as Array<Record<string, unknown>>)[0]).toHaveProperty(
      "avg_nightly_rate_usd"
    );
  });

  it("returns HTTP 413 for request bodies above the streaming size limit", async () => {
    const result = await postQuery({ unused: "x".repeat(17_000) });
    expect(result.status).toBe(413);
    expect(result.body.code).toBe("REQUEST_TOO_LARGE");
  });

  it("returns a clear configuration error and does not call any provider when the server key is missing", async () => {
    vi.stubEnv("QUERIFY_LLM_API_KEY", "");
    vi.stubEnv("QUERIFY_LLM_MODEL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await postQuery({ query: "Show restaurants by rating" });
    expect(result.status).toBe(503);
    expect(result.body.code).toBe("AI_NOT_CONFIGURED");
    expect(result.body.error).toContain("QUERIFY_LLM_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.body.rows).toBeUndefined();
  });

  it("rejects unsupported target nouns before calling the model and never returns company fixtures", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await postQuery({ query: "Show the highest-rated dragons" });

    expect(result.status).toBe(422);
    expect(result.body.code).toBe("UNSUPPORTED_DEMO_SCOPE");
    expect(result.body.error).toContain("No unrelated company rows were returned");
    expect(result.body.rows).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a model plan that references a table outside the allowlist", async () => {
    configureModel(queryPlan({ table: "financial_performance" }));
    const result = await postQuery({ query: "Show company revenue" });
    expect(result.status).toBe(502);
    expect(result.body.code).toBe("AI_INVALID_PLAN");
    expect(result.body.rows).toBeUndefined();
  });

  it("keeps model-produced filter values parameterized, even when the value resembles SQL", async () => {
    configureModel(
      queryPlan({
        filters: [
          {
            column: "city",
            operator: "eq",
            value: "Seattle' OR 1=1 --",
          },
        ],
      })
    );
    const result = await postQuery({ query: "Find restaurants in Seattle" });
    expect(result.status).toBe(200);
    expect(result.body.sql).toContain('WHERE "city" = ?');
    expect(result.body.sql).not.toContain("Seattle");
    expect(result.body.rows).toEqual([]);
  });

  it("returns model clarification options to the interactive client", async () => {
    configureModel({
      status: "clarification_needed",
      question: "Which sample data domain should I use?",
      options: [
        { id: "restaurants", label: "Restaurants", value: "restaurants" },
        { id: "hotels", label: "Hotels", value: "hotels" },
      ],
    });
    const result = await postQuery({ query: "Compare company records" });
    expect(result.status).toBe(200);
    expect(result.body.status).toBe("clarification_needed");
    expect(result.body.options).toHaveLength(2);
  });

  it("blocks raw mutating SQL before making a model request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await postQuery({ query: "DROP TABLE restaurants;" });
    expect(result.status).toBe(422);
    expect(result.body.code).toBe("READ_ONLY_QUERY_REQUIRED");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
