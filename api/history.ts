import type { IncomingMessage, ServerResponse } from "node:http";
import { handleOptions, sendJson } from "../server/querify-api/_lib.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
  sendJson(res, 200, {
    entries: [
      { status: "SUCCESS", question: "Which AI companies have the highest revenue in 2024?", rows: 5, duration: 18, time: new Date().toISOString() },
      { status: "SECURITY_BLOCKED", question: "DROP TABLE companies;", rows: 0, duration: 1, time: new Date().toISOString(), error: "Only one read-only SELECT statement is permitted." },
    ],
    source: "querify-serverless-demo",
  });
}
