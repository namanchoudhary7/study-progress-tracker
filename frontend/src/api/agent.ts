import { getCsrfToken } from "../lib/csrfToken";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AgentStreamEvent =
  | { type: "delta"; text: string }
  | { type: "tool_call"; name: string; arguments: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: unknown }
  | { type: "confirm_required"; token: string; name: string; arguments: Record<string, unknown> }
  | { type: "done"; text: string; model?: string }
  | { type: "error"; message: string };

/** Parses one `event: ...\ndata: ...\n\n` SSE frame into an AgentStreamEvent. */
function parseFrame(frame: string): AgentStreamEvent | null {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  const parsed = JSON.parse(data);
  return { type: event, ...parsed } as AgentStreamEvent;
}

async function streamSSE(
  path: string,
  body: unknown,
  onEvent: (event: AgentStreamEvent) => void
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const wait = retryAfter ? ` Try again in ${retryAfter}s.` : "";
      throw new Error(`You're sending messages too quickly.${wait}`);
    }
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const event = parseFrame(frame);
      if (event) onEvent(event);
    }
  }
}

export function streamChat(messages: ChatMessage[], onEvent: (event: AgentStreamEvent) => void): Promise<void> {
  return streamSSE("/agent/chat", { messages }, onEvent);
}

/** Resumes a paused agent turn after the user approves or declines a destructive tool call. */
export function confirmToolCall(
  token: string,
  approved: boolean,
  onEvent: (event: AgentStreamEvent) => void
): Promise<void> {
  return streamSSE("/agent/confirm", { token, approved }, onEvent);
}
