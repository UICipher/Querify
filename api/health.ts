import type { IncomingMessage, ServerResponse } from "node:http";
import { handleOptions, sendJson } from "./_lib.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (handleOptions(req, res)) return;
  sendJson(res, 200, { ok: true, service: "querify-api", mode: "serverless-demo", timestamp: new Date().toISOString() });
}
