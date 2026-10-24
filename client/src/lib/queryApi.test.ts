import { afterEach, describe, expect, it, vi } from "vitest";
import { queryApiUrl } from "./queryApi";

describe("queryApiUrl", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("prefers the configured runtime API URL", () => {
    vi.stubGlobal("window", {
      __MANUS_CONFIG__: { queryApiUrl: "https://api.example.test" },
      location: { origin: "https://querify.example.test" },
    });

    expect(queryApiUrl()).toBe("https://api.example.test");
  });

  it("does not silently use the page origin for an unconfigured local Demo Mode", () => {
    vi.stubGlobal("window", {
      __MANUS_CONFIG__: {},
      location: { origin: "https://querify.example.test" },
    });

    expect(queryApiUrl()).toBe("");
  });
});
