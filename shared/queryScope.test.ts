import { describe, expect, it } from "vitest";
import {
  detectUnsupportedDemoScope,
  getSupportedDemoDomain,
  getSupportedDemoDomains,
} from "./queryScope";

describe("detectUnsupportedDemoScope", () => {
  it.each([
    ["give me the best restaurants by rating", "restaurants"],
    ["show me the best houses under 500000", "homes"],
    ["what is the average price for phones", "phones"],
    ["compare cars by range", "cars"],
    ["best hotels by nightly rate", "hotels"],
  ])("recognizes a supported sample domain: %s", (query, domain) => {
    expect(getSupportedDemoDomain(query)).toBe(domain);
    expect(detectUnsupportedDemoScope(query)).toBeNull();
  });

  it("returns all explicit supported domains for a mixed-domain question", () => {
    expect(getSupportedDemoDomains("Compare companies and restaurants")).toEqual([
      "companies",
      "restaurants",
    ]);
  });

  it.each([
    "show me the best dragons by revenue",
    "find the whales with the highest growth",
    "data about bicycles in 2024",
    "show me the highest-rated dragons",
    "Compare companies and bitcoin prices",
  ])("rejects a new unsupported target noun: %s", query => {
    const issue = detectUnsupportedDemoScope(query);
    expect(issue?.code).toBe("UNSUPPORTED_DEMO_SCOPE");
    expect(issue?.message).toContain("No unrelated company rows were returned");
  });

  it.each([
    "Show net profit by company in 2024",
    "Which AI companies have the highest revenue?",
    "Compare NVIDIA and Microsoft AI revenue",
    "Show me the best performing AI companies in 2024",
    "Show me the revenue report",
    "Compare restaurants by city",
  ])(
    "keeps supported company or generic metric queries available: %s",
    query => {
      expect(detectUnsupportedDemoScope(query)).toBeNull();
    }
  );
});
