import type { IncomingMessage, ServerResponse } from "node:http";

export function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown
) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.end(JSON.stringify(payload));
}

export function handleOptions(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return true;
  }
  return false;
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the 16 KiB limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

export const MAX_API_BODY_BYTES = 16 * 1024;

export async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as string | Uint8Array);
    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_API_BODY_BYTES) throw new RequestBodyTooLargeError();
    chunks.push(buffer);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) return {} as T;
  return JSON.parse(body) as T;
}

const forbidden =
  /(--|;|\/\*|\*\/|\b(drop|delete|update|insert|alter|truncate|merge|grant|revoke|create|replace)\b)/i;

export function validateReadOnlySelect(sql: string) {
  const normalized = sql.trim();
  if (
    !normalized ||
    forbidden.test(normalized) ||
    !/^select\b/i.test(normalized)
  ) {
    return {
      ok: false,
      message:
        "Only one read-only SELECT statement is permitted. Mutations, comments, semicolons, and stacked queries are blocked.",
    };
  }
  return { ok: true as const };
}
