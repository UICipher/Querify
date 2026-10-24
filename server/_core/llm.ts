import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type Message = {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
};

export type InvokeParams = {
  messages: Message[];
  model?: string;
  maxTokens?: number;
  max_tokens?: number;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string;
    };
    finish_reason: string | null;
  }>;
};

const platformApiBase = () => {
  if (!ENV.forgeApiUrl.trim()) throw new Error("MANUS_API_URL is not configured");
  return ENV.forgeApiUrl.replace(/\/$/, "");
};
const resolveApiUrl = () => `${platformApiBase()}/v1/chat/completions`;

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("MANUS_API_KEY is not configured");
  }
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const { messages, model, maxTokens, max_tokens } = params;

  const payload: Record<string, unknown> = {
    model: model || process.env.QUERIFY_LLM_MODEL || "llama-3.3-70b-versatile",
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };

  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return (await response.json()) as InvokeResult;
}

export async function listLLMModels() {
  platformApiBase();
  return { object: "list", data: [] };
}
