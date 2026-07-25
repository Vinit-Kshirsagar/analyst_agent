"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import HealthMetricsGrid from "./components/HealthMetricsGrid";
import ChatPreviewSandbox from "./components/ChatPreviewSandbox";
import TechnicalDetailsInspector from "./components/TechnicalDetailsInspector";
import { ShieldCheck, Activity, Layers, ExternalLink, HelpCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function StatusPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/health`, { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
      const data = await resp.json();
      setHealthData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const overallStatus = loading
    ? "loading"
    : error
    ? "error"
    : healthData?.status === "healthy"
    ? "healthy"
    : "degraded";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-dark)" }}>
      
      {/* Sticky Header */}
      <Header overallStatus={overallStatus} onRefresh={fetchHealth} isRefreshing={loading} />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto", padding: "28px 24px 48px" }}>
        
        {/* Banner Section */}
        <section className="glass-card" style={{ padding: "24px 28px", marginBottom: 24, background: "linear-gradient(135deg, rgba(22, 33, 62, 0.9) 0%, rgba(15, 52, 96, 0.6) 100%)", borderColor: "rgba(233, 69, 96, 0.3)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ background: "rgba(233, 69, 96, 0.2)", color: "#E94560", border: "1px solid rgba(233, 69, 96, 0.4)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
                  SOC AI ENGINE
                </span>
                <span style={{ fontSize: 12, color: "#8A8FA8" }}>Local-First Agentic SIEM</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>
                Security Operations Center (SOC) Console
              </h2>
              <p style={{ fontSize: 14, color: "#EAEAEA", maxWidth: 780, lineHeight: 1.6 }}>
                Real-time stack telemetry and threat investigation workspace powered by <strong style={{ color: "#E94560" }}>FastAPI</strong>, <strong style={{ color: "#2196F3" }}>Elasticsearch</strong>, <strong style={{ color: "#BA68C8" }}>Elastic MCP</strong>, and <strong style={{ color: "#4CAF50" }}>Ollama (`gemma4:e4b`)</strong>.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ background: "rgba(10, 16, 30, 0.6)", border: "1px solid #3C4A6A", padding: "10px 16px", borderRadius: 8, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#8A8FA8", display: "block" }}>Seeded Alerts</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#4CAF50", fontFamily: "var(--font-mono)" }}>200</span>
              </div>
              <div style={{ background: "rgba(10, 16, 30, 0.6)", border: "1px solid #3C4A6A", padding: "10px 16px", borderRadius: 8, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#8A8FA8", display: "block" }}>Target Index</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2196F3", fontFamily: "var(--font-mono)" }}>alerts-security</span>
              </div>
            </div>
          </div>
        </section>

        {/* Error Alert Box if Backend Error */}
        {error && (
          <div style={{ background: "rgba(244, 67, 54, 0.12)", border: "1px solid rgba(244, 67, 54, 0.4)", borderRadius: 10, padding: 16, marginBottom: 24, color: "#F44336" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14 }}>
              <span>Backend Gateway Unreachable ({API_URL})</span>
            </div>
            <p style={{ fontSize: 13, color: "#EAEAEA", marginTop: 4 }}>
              Error Detail: {error}. Please verify that the backend container is up (<code className="font-mono">docker compose up -d</code>).
            </p>
          </div>
        )}

        {/* Component Health Grid */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8 }}>
              <Layers style={{ width: 18, height: 18, color: "#E94560" }} /> Stack Component Health
            </h3>
            <span style={{ fontSize: 12, color: "#8A8FA8", fontFamily: "var(--font-mono)" }}>Auto-verified via Docker Network</span>
          </div>

          <HealthMetricsGrid components={healthData?.components || null} loading={loading} error={error} />
        </section>

        {/* Interactive Chat Sandbox Section */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck style={{ width: 18, height: 18, color: "#4CAF50" }} /> Interactive Analyst Chat Sandbox
            </h3>
            <span style={{ fontSize: 12, color: "#8A8FA8" }}>LangGraph & MCP Workflow Simulation</span>
          </div>

          <ChatPreviewSandbox />
        </section>

        {/* Raw Telemetry Inspector */}
        <TechnicalDetailsInspector data={healthData} apiUrl={API_URL} />

      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #3C4A6A", background: "#16213E", padding: "20px 24px", color: "#8A8FA8", fontSize: 12 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong style={{ color: "#EAEAEA" }}>Autonomous Security Agent</strong> — Local-first SOC Assistant (Phase 0)
          </div>
          <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-mono)" }}>
            <span>Frontend :3000</span>
            <span>API :8000</span>
            <span>MCP :8080</span>
            <span>ES :9200</span>
            <span>Ollama :11434</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
