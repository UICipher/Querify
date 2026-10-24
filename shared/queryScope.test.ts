import { describe, expect, it } from "vitest";
import { detectUnsupportedDemoScope } from "./queryScope";

describe("detectUnsupportedDemoScope", () => {
  it("rejects the reported restaurant prompt with a clear no-data message", () => {
    const issue = detectUnsupportedDemoScope(
      "give me the best restaurants - revenue"
    );

    expect(issue?.code).toBe("UNSUPPORTED_DEMO_SCOPE");
    expect(issue?.domain).toBe("restaurant");
    expect(issue?.message).toContain("does not contain restaurant data");
    expect(issue?.message).toContain("no unrelated company rows were returned");
  });

  it.each([
    "best hotels by revenue",
    "compare hospital patients",
    "top products by sales",
    "highest-paid employees",
  ])("rejects an unsupported fixture domain: %s", query => {
    expect(detectUnsupportedDemoScope(query)).not.toBeNull();
  });

  it.each([
    "Show net profit by company in 2024",
    "Which AI companies have the highest revenue?",
    "Compare NVIDIA and Microsoft AI revenue",
  ])("keeps a supported company query available: %s", query => {
    expect(detectUnsupportedDemoScope(query)).toBeNull();
  });
});
