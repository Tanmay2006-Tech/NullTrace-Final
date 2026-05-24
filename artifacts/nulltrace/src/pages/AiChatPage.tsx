import { MainLayout } from "@/components/MainLayout";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrainCircuit, Send, User, Sparkles, Terminal, Activity } from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Why did checkout fail?",
  "Which service is most unstable?",
  "Explain the latest outage",
  "Show me failed pods",
  "How do I fix DB connection exhaustion?",
  "What caused the auth failures?",
  "How do I scale the API gateway?",
];

function formatMessage(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const code = inner.replace(/^[a-zA-Z]+\n/, "");
      return (
        <div key={i} className="my-3 bg-black/90 p-4 rounded-md border border-border font-mono text-sm text-green-400 overflow-x-auto relative">
          <Terminal className="h-4 w-4 absolute top-2 right-2 text-muted-foreground opacity-50" />
          <pre className="whitespace-pre-wrap">{code}</pre>
        </div>
      );
    }
    const lines = part.split("\n");
    return (
      <span key={i}>
        {lines.map((line, li) => {
          const boldLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          return (
            <span key={li}>
              <span dangerouslySetInnerHTML={{ __html: boldLine }} />
              {li < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "NullTrace Intelligence initialized. I have full context on your current infrastructure state, active incidents, logs, and service metrics. Ask me anything about your systems.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const aiMsg: Message = { role: "ai", content: "", streaming: true };
    setMessages((prev) => [...prev, aiMsg]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Stream request failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "ai", content: fullContent, streaming: true };
                return updated;
              });
            }
            if (data.done) {
              if (data.conversationId) setConversationId(data.conversationId);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "ai", content: fullContent, streaming: false };
                return updated;
              });
            }
            if (data.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "ai", content: `Error: ${data.error}`, streaming: false };
                return updated;
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "ai",
            content: "Connection error. Please try again.",
            streaming: false,
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Intelligence Engine</h1>
            <p className="text-muted-foreground text-sm">Context-aware infrastructure analysis and remediation</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          <div className="flex-1 flex flex-col glass-card rounded-xl border border-border overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-12 rounded-tr-sm"
                        : "bg-muted/50 border border-border mr-12 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        {msg.content ? (
                          formatMessage(msg.content)
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                        {msg.streaming && msg.content && (
                          <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-blink" />
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-secondary" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-background/50 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative flex items-center"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your infrastructure..."
                  className="pr-12 bg-background border-border h-12 rounded-xl focus-visible:ring-primary/50"
                  disabled={isStreaming}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                  disabled={!input.trim() || isStreaming}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="glass-card p-4 rounded-xl border border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Suggested Queries
              </h3>
              <div className="flex flex-col gap-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="justify-start h-auto py-2 px-3 text-left whitespace-normal font-normal text-sm bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                    onClick={() => handleSend(prompt)}
                    disabled={isStreaming}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Context</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Analyzes your live incidents, metrics, and logs in real time. All responses are grounded in your current infrastructure state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
