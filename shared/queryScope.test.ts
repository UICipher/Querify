import { describe, expect, it } from "vitest";
import { detectUnsupportedDemoScope } from "./queryScope";

describe("detectUnsupportedDemoScope", () => {
  it.each([
    ["give me the best restaurants - revenue", "restaurant and food-service"],
    ["show me the best houses - revenue", "housing and real estate"],
    ["what is the revenue for phones", "phone and mobile-device"],
    ["compare cars by profit", "automotive and vehicle"],
    ["best hotels by revenue", "hotel and lodging"],
  ])("rejects the unsupported request: %s", (query, domain) => {
    const issue = detectUnsupportedDemoScope(query);

    expect(issue?.code).toBe("UNSUPPORTED_DEMO_SCOPE");
    expect(issue?.domain).toBe(domain);
    expect(issue?.message).toContain("no company rows were returned");
  });

  it.each([
    "show me the best dragons by revenue",
    "find the whales with the highest growth",
    "data about bicycles in 2024",
  ])("rejects a new unsupported target noun: %s", query => {
    expect(detectUnsupportedDemoScope(query)?.code).toBe(
      "UNSUPPORTED_DEMO_SCOPE"
    );
  });

  it.each([
    "Show net profit by company in 2024",
    "Which AI companies have the highest revenue?",
    "Compare NVIDIA and Microsoft AI revenue",
    "Show me the best performing AI companies in 2024",
    "Show me the revenue report",
  ])(
    "keeps supported company or generic metric queries available: %s",
    query => {
      expect(detectUnsupportedDemoScope(query)).toBeNull();
    }
  );
});
