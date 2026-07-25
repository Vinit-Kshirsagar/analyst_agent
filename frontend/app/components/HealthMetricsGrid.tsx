"use client";

import { Database, Cpu, Server, Zap, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";

interface ComponentDetail {
  status: string;
  detail?: string;
  models?: string[];
}

interface HealthMetricsGridProps {
  components: Record<string, ComponentDetail> | null;
  loading: boolean;
  error: string | null;
}

export default function HealthMetricsGrid({ components, loading, error }: HealthMetricsGridProps) {

  const getStatusIcon = (status?: string) => {
    if (loading) return <span style={{ fontSize: 12, color: "#8A8FA8" }}>Checking...</span>;
    if (status === "connected") return <CheckCircle2 style={{ width: 18, height: 18, color: "#4CAF50" }} />;
    if (status === "model_missing") return <AlertTriangle style={{ width: 18, height: 18, color: "#FFC107" }} />;
    return <XCircle style={{ width: 18, height: 18, color: "#F44336" }} />;
  };

  const getStatusText = (status?: string) => {
    if (loading) return "Checking...";
    if (status === "connected") return "CONNECTED";
    if (status === "model_missing") return "MODEL MISSING";
    if (status === "unreachable") return "UNREACHABLE";
    return "OFFLINE";
  };

  const getStatusBadgeStyle = (status?: string) => {
    if (status === "connected") return { background: "rgba(76, 175, 80, 0.12)", color: "#4CAF50", border: "1px solid rgba(76, 175, 80, 0.3)" };
    if (status === "model_missing") return { background: "rgba(255, 193, 7, 0.12)", color: "#FFC107", border: "1px solid rgba(255, 193, 7, 0.3)" };
    return { background: "rgba(244, 67, 54, 0.12)", color: "#F44336", border: "1px solid rgba(244, 67, 54, 0.3)" };
  };

  const esStatus = components?.elasticsearch?.status;
  const ollamaStatus = components?.ollama?.status;
  const mcpStatus = components?.mcp_server?.status;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, width: "100%" }}>
      
      {/* 1. Elasticsearch Card */}
      <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(33, 150, 243, 0.12)", border: "1px solid rgba(33, 150, 243, 0.3)", padding: 8, borderRadius: 8 }}>
                <Database style={{ width: 18, height: 18, color: "#2196F3" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>Elasticsearch</h3>
                <span style={{ fontSize: 11, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>Port 9200</span>
              </div>
            </div>
            {getStatusIcon(esStatus)}
          </div>
          <p style={{ fontSize: 13, color: "#EAEAEA", lineHeight: 1.5 }}>
            Security logs & SIEM event index storage engine.
          </p>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #3C4A6A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, ...getStatusBadgeStyle(esStatus) }}>
            {getStatusText(esStatus)}
          </span>
          <span style={{ fontSize: 12, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>alerts-security (200 docs)</span>
        </div>
      </div>

      {/* 2. Ollama LLM Card */}
      <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(233, 69, 96, 0.12)", border: "1px solid rgba(233, 69, 96, 0.3)", padding: 8, borderRadius: 8 }}>
                <Cpu style={{ width: 18, height: 18, color: "#E94560" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>Ollama AI Engine</h3>
                <span style={{ fontSize: 11, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>Port 11434</span>
              </div>
            </div>
            {getStatusIcon(ollamaStatus)}
          </div>
          <p style={{ fontSize: 13, color: "#EAEAEA", lineHeight: 1.5 }}>
            Local LLM inference runner executing model weight <code className="font-mono" style={{ color: "#E94560" }}>gemma4:e4b</code>.
          </p>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #3C4A6A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, ...getStatusBadgeStyle(ollamaStatus) }}>
            {getStatusText(ollamaStatus)}
          </span>
          <span style={{ fontSize: 12, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>Tag: gemma4:e4b</span>
        </div>
      </div>

      {/* 3. Elastic MCP Server Card */}
      <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(156, 39, 176, 0.12)", border: "1px solid rgba(156, 39, 176, 0.3)", padding: 8, borderRadius: 8 }}>
                <Server style={{ width: 18, height: 18, color: "#BA68C8" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>Elastic MCP Server</h3>
                <span style={{ fontSize: 11, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>Port 8080</span>
              </div>
            </div>
            {getStatusIcon(mcpStatus)}
          </div>
          <p style={{ fontSize: 13, color: "#EAEAEA", lineHeight: 1.5 }}>
            Model Context Protocol server providing query tools for Elasticsearch.
          </p>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #3C4A6A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, ...getStatusBadgeStyle(mcpStatus) }}>
            {getStatusText(mcpStatus)}
          </span>
          <span style={{ fontSize: 12, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>HTTP Mode (/ping)</span>
        </div>
      </div>

      {/* 4. FastAPI Agent Gateway */}
      <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(76, 175, 80, 0.12)", border: "1px solid rgba(76, 175, 80, 0.3)", padding: 8, borderRadius: 8 }}>
                <Zap style={{ width: 18, height: 18, color: "#4CAF50" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>FastAPI Gateway</h3>
                <span style={{ fontSize: 11, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>Port 8000</span>
              </div>
            </div>
            {getStatusIcon(components ? "connected" : undefined)}
          </div>
          <p style={{ fontSize: 13, color: "#EAEAEA", lineHeight: 1.5 }}>
            REST API & LangGraph agent orchestration framework backend.
          </p>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #3C4A6A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, ...getStatusBadgeStyle(components ? "connected" : "offline") }}>
            {getStatusText(components ? "connected" : "offline")}
          </span>
          <span style={{ fontSize: 12, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>CORS Enabled</span>
        </div>
      </div>

    </div>
  );
}
