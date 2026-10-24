import { describe, expect, it } from "vitest";
import {
  compileQueryPlan,
  InvalidQueryPlanError,
  validateQueryPlan,
} from "./queryPlan";

describe("AI query plan validation and compilation", () => {
  it("allows only the seeded sample tables and columns", () => {
    expect(() =>
      validateQueryPlan({
        status: "query",
        table: "restaurants",
        columns: ["name", "rating"],
        filters: [],
        groupBy: [],
        limit: 10,
      })
    ).not.toThrow();

    expect(() =>
      validateQueryPlan({
        status: "query",
        table: "restaurant_users",
        columns: ["email"],
        limit: 10,
      })
    ).toThrow(InvalidQueryPlanError);

    expect(() =>
      validateQueryPlan({
        status: "query",
        table: "phones",
        columns: ["camera_mp; DROP TABLE phones"],
        limit: 10,
      })
    ).toThrow(InvalidQueryPlanError);
  });

  it("uses bound values for filters and allowlisted identifiers for SQL", () => {
    const plan = validateQueryPlan({
      status: "query",
      table: "restaurants",
      columns: ["name", "city"],
      filters: [
        { column: "city", operator: "contains", value: "Seattle' OR 1=1 --" },
      ],
      groupBy: [],
      orderBy: { column: "name", direction: "asc" },
      limit: 8,
    });
    if (plan.status !== "query") throw new Error("Expected a query plan");

    const compiled = compileQueryPlan(plan);
    expect(compiled.sql).toContain('INSTR(LOWER("city"), LOWER(?)) > 0');
    expect(compiled.sql).not.toContain("Seattle");
    expect(compiled.parameters).toEqual(["Seattle' OR 1=1 --"]);
    expect(compiled.sql).toContain('ORDER BY "name" ASC LIMIT 8');
  });

  it("limits aggregate functions to allowed fields and safely compiles grouped AVG", () => {
    const plan = validateQueryPlan({
      status: "query",
      table: "hotels",
      columns: ["city"],
      filters: [],
      groupBy: ["city"],
      aggregate: { function: "avg", column: "nightly_rate_usd" },
      orderBy: { column: "avg_nightly_rate_usd", direction: "desc" },
      limit: 20,
    });
    if (plan.status !== "query") throw new Error("Expected a query plan");
    expect(compileQueryPlan(plan).sql).toContain(
      'SELECT "city", AVG("nightly_rate_usd") AS "avg_nightly_rate_usd"'
    );

    expect(() =>
      validateQueryPlan({
        status: "query",
        table: "phones",
        columns: [],
        groupBy: [],
        aggregate: { function: "sum", column: "brand" },
        limit: 10,
      })
    ).toThrow(InvalidQueryPlanError);
  });

  it("rejects mixed ungrouped fields and out-of-range row limits", () => {
    expect(() =>
      validateQueryPlan({
        status: "query",
        table: "cars",
        columns: ["make"],
        filters: [],
        groupBy: [],
        aggregate: { function: "avg", column: "range_miles" },
        limit: 10,
      })
    ).toThrow(InvalidQueryPlanError);

    expect(() =>
      validateQueryPlan({
        status: "query",
        table: "cars",
        columns: ["make"],
        filters: [],
        groupBy: [],
        limit: 500,
      })
    ).toThrow(InvalidQueryPlanError);
  });
});
