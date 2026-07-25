"use client";

import { useState } from "react";
import { Settings, Server, Key, Bell, Save, Check } from "lucide-react";
import TechnicalDetailsInspector from "../TechnicalDetailsInspector";

interface SettingsTabProps {
  healthData: any;
  apiUrl: string;
}

export default function SettingsTab({ healthData, apiUrl }: SettingsTabProps) {
  const [esUrl, setEsUrl] = useState("http://localhost:9200");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [mcpUrl, setMcpUrl] = useState("http://localhost:8080");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Environment & Stack Config Form */}
      <div className="devops-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
          Stack Connection & Endpoint Parameters
        </h3>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                FastAPI Gateway URL
              </label>
              <input
                type="text"
                value={apiUrl}
                disabled
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Elasticsearch Service URL
              </label>
              <input
                type="text"
                value={esUrl}
                onChange={(e) => setEsUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Ollama LLM Host URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                Elastic MCP Server URL
              </label>
              <input
                type="text"
                value={mcpUrl}
                onChange={(e) => setMcpUrl(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                background: "var(--accent-blue)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {saved ? <Check style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
              <span>{saved ? "Parameters Saved" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Raw Telemetry Inspector */}
      <TechnicalDetailsInspector data={healthData} apiUrl={apiUrl} />

    </div>
  );
}
