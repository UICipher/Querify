import { describe, expect, it } from "vitest";
import {
  createDemoResult,
  formatResultValue,
  inferDemoMetric,
} from "./demoResults";

describe("createDemoResult", () => {
  it.each([
    ["revenue", "revenue_millions", "financial_performance"],
    ["profit", "profit_millions", "financial_performance"],
    ["growth", "revenue_growth_percent", "financial_performance"],
    ["roi", "estimated_return_percent", "ai_investments"],
  ])(
    "matches the selected %s metric across SQL, rows, and chart",
    (metric, field, table) => {
      const result = createDemoResult(metric);
      const values = result.rows.map(row => Number(row[field]));

      expect(result.sql).toContain(table);
      expect(result.sql).toContain(
        `ORDER BY ${table === "ai_investments" ? field : `f.${field}`} DESC`
      );
      expect(result.chartField).toBe(field);
      expect(values).toEqual([...values].sort((a, b) => b - a));
      expect(result.rows.length).toBe(10);
    }
  );

  it("uses the selected period and limit in the generated query", () => {
    const annual = createDemoResult("profit", {
      period: "fiscal_year_2024",
      limit: 5,
    });
    const allTime = createDemoResult("revenue", {
      period: "all_time",
      limit: 5,
    });

    expect(annual.sql).toContain("WHERE f.fiscal_year = 2024");
    expect(annual.sql).toContain("LIMIT 5;");
    expect(annual.rows).toHaveLength(5);
    expect(allTime.sql).not.toContain("WHERE f.fiscal_year = 2024");
    expect(allTime.logic).toContain("all available demo records");
  });

  it("formats numeric demo values for readable tables", () => {
    expect(formatResultValue("revenue_millions", 122000)).toBe("$122,000M");
    expect(formatResultValue("revenue_growth_percent", 100.3)).toBe("+100.3%");
    expect(formatResultValue("company_name", "NVIDIA")).toBe("NVIDIA");
  });
});

describe("inferDemoMetric", () => {
  it.each([
    ["rank by revenue", "revenue"],
    ["show annual net profit", "profit"],
    ["revenue growth rate", "growth"],
    ["compare investment return", "roi"],
    ["rank by ROI", "roi"],
    ["show the strongest companies", "revenue"],
  ])("maps '%s' to the matching demo metric", (question, expected) => {
    expect(inferDemoMetric(question)).toBe(expected);
  });
});
