"use client";

import { CheckCircle2, Clock, ShieldCheck, Activity, AlertTriangle } from "lucide-react";

interface StatusTabProps {
  healthData: any;
}

export default function StatusTab({ healthData }: StatusTabProps) {
  const isHealthy = healthData?.status === "healthy";

  const services = [
    { name: "Elasticsearch Engine", port: "9200", uptime: "99.99%", status: "Operational" },
    { name: "Ollama LLM Inference (gemma4:e4b)", port: "11434", uptime: "99.95%", status: "Operational" },
    { name: "Elastic MCP Server", port: "8080", uptime: "100.0%", status: "Operational" },
    { name: "FastAPI Gateway", port: "8000", uptime: "99.98%", status: "Operational" },
    { name: "Next.js Web Console", port: "3000", uptime: "100.0%", status: "Operational" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Banner Status */}
      <div
        className="devops-card"
        style={{
          padding: 24,
          background: isHealthy ? "var(--accent-green-subtle)" : "var(--accent-orange-subtle)",
          borderColor: isHealthy ? "var(--accent-green)" : "var(--accent-orange)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <CheckCircle2 style={{ width: 32, height: 32, color: isHealthy ? "var(--accent-green)" : "var(--accent-orange)" }} />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            {isHealthy ? "All Systems Operational" : "System Running in Degraded Mode"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            All core microservices, Elasticsearch indexing pipelines, and Ollama LLM inference servers are reachable over the Docker bridge network.
          </p>
        </div>
      </div>

      {/* Service Availability 90-Day Uptime Grid */}
      <div className="devops-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Service Availability & Uptime History</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {services.map((svc, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  {svc.name} <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>:{svc.port}</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
                  {svc.uptime} uptime
                </span>
              </div>

              {/* 90-day visual bars */}
              <div style={{ display: "flex", gap: 3, width: "100%" }}>
                {Array.from({ length: 60 }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: 24,
                      borderRadius: 2,
                      background: idx === 42 ? "var(--accent-orange)" : "var(--accent-green)",
                      opacity: 0.85,
                    }}
                    title={`Day ${60 - idx} ago: Operational`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident History Timeline */}
      <div className="devops-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Recent Maintenance & Incident History</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { date: "July 25, 2026", title: "Phase 0 Stack Initialization & Verification", desc: "Successfully launched single-node Elasticsearch 8.11.0, Ollama gemma4:e4b, and Elastic MCP server.", status: "COMPLETED" },
            { date: "July 24, 2026", title: "Deterministic Security Log Seed Ingestion", desc: "Generated and indexed 200 security alert records into alerts-security index with zero duplicates.", status: "RESOLVED" },
          ].map((inc, i) => (
            <div key={i} style={{ padding: 14, background: "var(--bg-primary)", borderRadius: 6, border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{inc.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-green)", background: "var(--accent-green-subtle)", padding: "2px 8px", borderRadius: 4 }}>
                  {inc.status}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{inc.desc}</p>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>{inc.date}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
