"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, ShieldAlert, Sparkles, Terminal, Trash2, Shield, CornerDownLeft } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  threatLevel?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  details?: {
    ip?: string;
    eventsAnalyzed?: number;
    recommendedActions?: string[];
  };
  timestamp: string;
  steps?: string[];
}

const PRESET_QUERIES = [
  "What IPs seem malicious today and why?",
  "Show suspicious SSH brute force attempts in last 24h",
  "Summarize high severity malware alerts in alerts-security",
];

export default function ChatPreviewSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Security Agent Assistant initialized (Phase 0/1 Bridge). Connected to Elasticsearch (alerts-security), Ollama (gemma4:e4b), and Elastic MCP Server. How can I assist with threat triage today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentStep]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsThinking(true);

    // Simulate LangGraph Agent Loop Execution Steps
    const steps = [
      "PLAN: Parsing query & constructing Elastic MCP tools schema...",
      "ROUTE: Routing query to MCP search_security_logs tool...",
      "EXECUTE: MCP retrieving alerts from index 'alerts-security'...",
      "OBSERVE: 47 events matched. Analyzing IP threat indicators...",
      "FINALIZE: Generating structured response via gemma4:e4b...",
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setCurrentStep(null);
        setIsThinking(false);

        // Simulated AI SOC Threat Response
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `Based on my analysis of 47 security events in the last 24 hours in **alerts-security**, I identified high-risk malicious activity targeting authentication endpoints.`,
          threatLevel: "HIGH",
          details: {
            ip: "10.0.0.55",
            eventsAnalyzed: 47,
            recommendedActions: [
              "Block IP 10.0.0.55 at edge firewall",
              "Force password reset on targeted SSH user accounts",
              "Isolate compromised host workstation (10.0.0.12)",
            ],
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiResponse]);
      }
    }, 600);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "ai",
        text: "Console session cleared. Ready for new SOC security queries.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: 560, overflow: "hidden" }}>
      
      {/* Top Console Bar */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #3C4A6A", background: "#16213E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquare style={{ width: 18, height: 18, color: "#E94560" }} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>SOC Analyst Assistant Sandbox</h2>
          <span style={{ fontSize: 11, background: "rgba(76, 175, 80, 0.15)", color: "#4CAF50", border: "1px solid rgba(76, 175, 80, 0.3)", padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-mono)" }}>
            MCP Active
          </span>
        </div>

        <button
          type="button"
          onClick={handleClear}
          title="Clear Session (Cmd+K)"
          style={{ background: "transparent", border: "none", color: "#8A8FA8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#E94560")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#8A8FA8")}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
          <span>Clear</span>
        </button>
      </div>

      {/* Preset Queries Bar */}
      <div style={{ padding: "8px 16px", background: "rgba(15, 52, 96, 0.3)", borderBottom: "1px solid rgba(60, 74, 106, 0.4)", display: "flex", gap: 8, overflowX: "auto" }}>
        <span style={{ fontSize: 11, color: "#8A8FA8", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          <Sparkles style={{ width: 12, height: 12, color: "#FFC107" }} /> Presets:
        </span>
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            style={{
              background: "rgba(30, 41, 59, 0.8)",
              border: "1px solid #3C4A6A",
              color: "#EAEAEA",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 14,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#E94560";
              e.currentTarget.style.color = "#FFF";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#3C4A6A";
              e.currentTarget.style.color = "#EAEAEA";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                background: msg.sender === "user" ? "#0F3460" : "#16213E",
                border: msg.sender === "user" ? "1px solid #3C4A6A" : "1px solid rgba(60, 74, 106, 0.6)",
                borderRadius: msg.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                padding: 14,
                boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: msg.sender === "user" ? "#4CAF50" : "#E94560" }}>
                  {msg.sender === "user" ? "SOC Analyst" : "Security Agent AI"}
                </span>
                <span style={{ fontSize: 10, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>{msg.timestamp}</span>
              </div>

              <p style={{ fontSize: 14, color: "#EAEAEA", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {msg.text}
              </p>

              {/* Threat Details Card if Present */}
              {msg.details && (
                <div style={{ marginTop: 12, padding: 12, background: "rgba(244, 67, 54, 0.08)", border: "1px solid rgba(244, 67, 54, 0.3)", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <ShieldAlert style={{ width: 16, height: 16, color: "#F44336" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#F44336" }}>
                      SUSPICIOUS IP DETECTED: {msg.details.ip} (RISK: {msg.threatLevel})
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: "#EAEAEA", marginBottom: 6 }}>
                    • 42 failed SSH authentication attempts across 14 target accounts
                  </p>

                  <span style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", display: "block", marginTop: 8, marginBottom: 4 }}>
                    Recommended Mitigation Steps:
                  </span>
                  <ul style={{ paddingLeft: 16, fontSize: 12, color: "#8A8FA8" }}>
                    {msg.details.recommendedActions?.map((act, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live LangGraph Step Execution Indicator */}
        {isThinking && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(15, 52, 96, 0.5)", border: "1px dashed #E94560", padding: "10px 14px", borderRadius: 8, width: "fit-content" }}>
            <Terminal className="animate-spin" style={{ width: 16, height: 16, color: "#E94560" }} />
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#EAEAEA" }}>
              {currentStep || "LangGraph Agent executing workflow..."}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Field Area */}
      <div style={{ padding: 14, background: "#16213E", borderTop: "1px solid #3C4A6A" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your security investigation query... (e.g. 'Show failed SSH logins')"
            disabled={isThinking}
            style={{
              flex: 1,
              background: "#1A1A2E",
              border: "1px solid #3C4A6A",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#E94560")}
            onBlur={(e) => (e.target.style.borderColor = "#3C4A6A")}
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isThinking || !input.trim()}
            style={{
              background: input.trim() && !isThinking ? "#E94560" : "#3C4A6A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: input.trim() && !isThinking ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              transition: "background 0.2s ease",
            }}
          >
            <span>Send</span>
            <CornerDownLeft style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 4px" }}>
          <span style={{ fontSize: 11, color: "#8A8FA8" }}>Press <kbd style={{ background: "#1A1A2E", border: "1px solid #3C4A6A", padding: "1px 4px", borderRadius: 3 }}>Enter</kbd> to submit query</span>
          <span style={{ fontSize: 11, color: "#8A8FA8" }}>FastAPI REST + Elastic MCP Stream</span>
        </div>
      </div>

    </div>
  );
}
