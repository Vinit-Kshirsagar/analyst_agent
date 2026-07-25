"use client";

import { useState } from "react";
import { Code, Copy, Check, ChevronDown, ChevronRight, Terminal } from "lucide-react";

interface TechnicalDetailsInspectorProps {
  data: any;
  apiUrl: string;
}

export default function TechnicalDetailsInspector({ data, apiUrl }: TechnicalDetailsInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonString = data ? JSON.stringify(data, null, 2) : "{}";

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ marginTop: 20, overflow: "hidden" }}>
      
      {/* Header Bar Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "14px 18px",
          background: "#16213E",
          border: "none",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Code style={{ width: 18, height: 18, color: "#2196F3" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Technical Telemetry & Raw Backend Response</span>
          <span style={{ fontSize: 11, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>GET {apiUrl}/health</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#8A8FA8" }}>{isOpen ? "Collapse" : "Expand Inspector"}</span>
          {isOpen ? <ChevronDown style={{ width: 16, height: 16, color: "#8A8FA8" }} /> : <ChevronRight style={{ width: 16, height: 16, color: "#8A8FA8" }} />}
        </div>
      </button>

      {/* Collapsible Content Body */}
      {isOpen && (
        <div style={{ padding: 18, borderTop: "1px solid #3C4A6A", background: "#1A1A2E" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#8A8FA8", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 6 }}>
              <Terminal style={{ width: 14, height: 14, color: "#4CAF50" }} /> Response Payload JSON
            </span>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#0F3460",
                color: "#EAEAEA",
                border: "1px solid #3C4A6A",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {copied ? <Check style={{ width: 13, height: 13, color: "#4CAF50" }} /> : <Copy style={{ width: 13, height: 13 }} />}
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </button>
          </div>

          <pre
            style={{
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              color: "#EAEAEA",
              background: "#16213E",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #3C4A6A",
              overflowX: "auto",
              maxHeight: 280,
            }}
          >
            {jsonString}
          </pre>

        </div>
      )}

    </div>
  );
}
