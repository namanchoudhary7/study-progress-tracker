import { useRef, useState } from "react";
import { Bot, Send, Wrench } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { streamChat, type ChatMessage } from "../../api/agent";

interface DisplayMessage extends ChatMessage {
  toolCalls?: string[];
  model?: string;
}

const SUGGESTIONS = [
  "How is my studying going this week?",
  "Log 45 minutes of studying I just did",
  "What's overdue or due for review?",
  "Help me plan for an exam in two weeks",
];

export function AgentPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;

    setError(null);
    setInput("");
    const history: ChatMessage[] = [...messages.map(({ role, content }) => ({ role, content })), { role: "user", content: question }];
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: "", toolCalls: [] }]);
    setStreaming(true);
    scrollToBottom();

    try {
      await streamChat(history, (event) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (event.type === "delta") {
            last.content += event.text;
          } else if (event.type === "tool_call") {
            last.toolCalls = [...(last.toolCalls ?? []), event.name];
          } else if (event.type === "done") {
            last.content = event.text || last.content;
            last.model = event.model?.replace(/^gemini:/, "");
          } else if (event.type === "error") {
            setError(event.message);
          }
          return next;
        });
        scrollToBottom();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <Card className="text-sm text-neutral-500">
            <p className="mb-3 flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
              <Bot className="h-4 w-4" /> Ask about your study data, log sessions, or plan ahead.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="secondary" size="sm" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              }`}
            >
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {m.toolCalls.map((name, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800"
                    >
                      <Wrench className="h-2.5 w-2.5" /> {name}
                    </span>
                  ))}
                </div>
              )}
              {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              {m.role === "assistant" && m.model && (
                <div className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-600">{m.model}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div className="mb-2"><ErrorBanner message={error} /></div>}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <Textarea
          className="flex-1 resize-none"
          rows={2}
          placeholder="Ask your study coach…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <Button type="submit" variant="primary" icon={Send} disabled={streaming || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
