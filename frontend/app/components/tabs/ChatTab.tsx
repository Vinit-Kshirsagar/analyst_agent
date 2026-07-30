"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, AlertCircle, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Role = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  tools_used?: string[];
  error?: string | null;
}

interface ChatResponse {
  session_id: string;
  answer: string;
  plan: string;
  tools_used: string[];
  iterations: number;
  error: string | null;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "Ask about security alerts in Elasticsearch (index alerts-security). Example: “Search alerts-security for event.type malware, size 3.”",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useStream, setUseStream] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clearChat = () => {
    setSessionId(null);
    setMessages([
      {
        id: newId(),
        role: "system",
        content: "Session cleared. Ask a new question about alerts-security.",
      },
    ]);
  };

  const sendJson = useCallback(async (text: string) => {
    const resp = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
      }),
    });
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(
        typeof errBody.detail === "string"
          ? errBody.detail
          : `HTTP ${resp.status}`
      );
    }
    const data = (await resp.json()) as ChatResponse;
    setSessionId(data.session_id);
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "assistant",
        content: data.answer || "(empty answer)",
        tools_used: data.tools_used,
        error: data.error,
      },
    ]);
  }, [sessionId]);

  const sendStream = useCallback(async (text: string) => {
    const resp = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
      }),
    });
    if (!resp.ok || !resp.body) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let eventName = "message";
    let finalAnswer: ChatResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let dataLine = "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLine += line.slice(5).trim();
          }
        }
        if (!dataLine) continue;
        try {
          const payload = JSON.parse(dataLine);
          if (eventName === "result") {
            finalAnswer = payload as ChatResponse;
          }
          if (eventName === "error") {
            throw new Error(payload.detail || "Stream error");
          }
        } catch (e) {
          if (e instanceof Error && e.message !== "Stream error" && !e.message.includes("JSON")) {
            // rethrow our stream errors
            if (e.message.includes("detail") || eventName === "error") throw e;
          }
          if (e instanceof SyntaxError) continue;
          if (eventName === "error") throw e;
        }
      }
    }

    if (!finalAnswer) {
      throw new Error("Stream ended without a result event");
    }
    setSessionId(finalAnswer.session_id);
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "assistant",
        content: finalAnswer!.answer || "(empty answer)",
        tools_used: finalAnswer!.tools_used,
        error: finalAnswer!.error,
      },
    ]);
  }, [sessionId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "user", content: text },
    ]);
    setLoading(true);
    try {
      if (useStream) {
        await sendStream(text);
      } else {
        await sendJson(text);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: err instanceof Error ? err.message : String(err),
          error: "request_failed",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px - 48px)",
        maxHeight: 720,
        minHeight: 480,
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "var(--bg-sidebar)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquare size={18} style={{ color: "var(--accent)" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>SOC Agent Chat</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Phase 3 UI · {useStream ? "SSE /api/chat/stream" : "POST /api/chat"}
              {sessionId ? ` · session ${sessionId.slice(0, 8)}…` : " · new session"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={useStream}
              onChange={(e) => setUseStream(e.target.checked)}
            />
            Stream
          </label>
          <button
            type="button"
            onClick={clearChat}
            title="Clear session"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf:
                m.role === "user"
                  ? "flex-end"
                  : m.role === "system"
                    ? "center"
                    : "flex-start",
              maxWidth: m.role === "system" ? "90%" : "78%",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background:
                  m.role === "user"
                    ? "var(--accent)"
                    : m.role === "system"
                      ? "transparent"
                      : "var(--bg-primary)",
                color:
                  m.role === "user"
                    ? "#fff"
                    : m.error
                      ? "var(--danger, #f87171)"
                      : "var(--text-primary)",
                border:
                  m.role === "assistant"
                    ? "1px solid var(--border-color)"
                    : m.role === "system"
                      ? "1px dashed var(--border-color)"
                      : "none",
              }}
            >
              {m.content}
            </div>
            {m.tools_used && m.tools_used.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                tools: {m.tools_used.join(", ")}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            Agent running (may take up to a few minutes)…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: 12,
          display: "flex",
          gap: 8,
          background: "var(--bg-sidebar)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about alerts-security…"
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: loading || !input.trim() ? "var(--border-color)" : "var(--accent)",
            color: "#fff",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send
        </button>
      </form>

      <div
        style={{
          padding: "6px 14px 10px",
          fontSize: 11,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <AlertCircle size={12} />
        API: {API_URL} · Seed index: alerts-security · Debug: POST /debug/agent-run still available
      </div>
    </div>
  );
}
