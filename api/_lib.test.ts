import { describe, expect, it } from "vitest";
import { analyticsResult, inferApiMetric } from "./_lib";

describe("same-origin demo API metrics", () => {
  it.each([
    ["Show annual revenue by company in 2024", "revenue", "revenue_millions"],
    ["Show net profit by company in 2024", "profit", "profit_millions"],
    ["Rank by revenue growth", "growth", "revenue_growth_percent"],
    ["Estimate AI investment return", "roi", "estimated_return_percent"],
  ])("infers %s consistently for %s", (query, metric, field) => {
    const result = analyticsResult(query);
    const values = result.rows.map(row => Number(row[field]));

    expect(inferApiMetric(query)).toBe(metric);
    expect(result.columns).toEqual(["company_name", field]);
    const tableAlias = field === "estimated_return_percent" ? "i" : "f";
    expect(result.sql).toContain(`ORDER BY ${tableAlias}.${field} DESC`);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    expect(result.rows).toHaveLength(5);
  });

  it("uses an explicit clarification metric over conflicting query words", () => {
    const result = analyticsResult(
      "Show net profit by company in 2024",
      "revenue"
    );

    expect(result.columns).toEqual(["company_name", "revenue_millions"]);
    expect(result.resolvedQuery).toContain("highest annual revenue");
  });

  it("infers the query metric when the clarification answer is a period", () => {
    const result = analyticsResult(
      "Show net profit by company in 2024",
      "fiscal_year_2024"
    );

    expect(result.columns).toEqual(["company_name", "profit_millions"]);
    expect(result.sql).toContain("WHERE f.fiscal_year = 2024");
    expect(result.resolvedQuery).toContain("FY 2024");
  });

  it("does not add a fiscal-year filter for all available demo rows", () => {
    const result = analyticsResult("Show revenue report", "all_time");

    expect(result.sql).not.toContain("WHERE f.fiscal_year = 2024");
    expect(result.resolvedQuery).toContain("all available demo records");
  });
});
