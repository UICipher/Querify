import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import {
  MAX_API_BODY_BYTES,
  readJson,
  RequestBodyTooLargeError,
  validateReadOnlySelect,
} from "./_lib";

function requestFrom(chunks: Array<string | Buffer>) {
  return Readable.from(chunks) as unknown as IncomingMessage;
}

describe("Vercel API helpers", () => {
  it("parses JSON from a streamed request body", async () => {
    const parsed = await readJson<{ query: string }>(
      requestFrom(['{"query":', '"restaurants"}'])
    );
    expect(parsed).toEqual({ query: "restaurants" });
  });

  it("rejects streamed request bodies larger than the 16 KiB limit", async () => {
    const oversized = `"${"x".repeat(MAX_API_BODY_BYTES)}"`;
    await expect(readJson(requestFrom([oversized]))).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("accepts a single read-only SELECT", () => {
    expect(
      validateReadOnlySelect('SELECT "name" FROM "restaurants" LIMIT 5')
    ).toEqual({ ok: true });
  });

  it.each([
    "DROP TABLE restaurants",
    "SELECT * FROM restaurants; SELECT * FROM companies",
    "SELECT * FROM restaurants -- comment",
    "SELECT * FROM restaurants /* comment */",
    "UPDATE restaurants SET rating = 5",
  ])("blocks unsafe or stacked SQL: %s", sql => {
    expect(validateReadOnlySelect(sql).ok).toBe(false);
  });
});
