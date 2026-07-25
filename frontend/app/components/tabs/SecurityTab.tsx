"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock, Eye, Ban, CheckCircle2, Terminal } from "lucide-react";
import ChatPreviewSandbox from "../ChatPreviewSandbox";

interface SecurityAlert {
  id: string;
  rule: string;
  sourceIp: string;
  targetUser: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "BLOCKED" | "INVESTIGATING" | "RESOLVED";
  timestamp: string;
}

const mockSecurityAlerts: SecurityAlert[] = [
  { id: "SEC-001", rule: "Brute Force SSH Attack", sourceIp: "10.0.0.55", targetUser: "root", severity: "HIGH", status: "ACTIVE", timestamp: "10 mins ago" },
  { id: "SEC-002", rule: "Malware Signature Execution", sourceIp: "172.16.0.23", targetUser: "user_42", severity: "CRITICAL", status: "INVESTIGATING", timestamp: "32 mins ago" },
  { id: "SEC-003", rule: "Failed Login Spike", sourceIp: "192.168.1.50", targetUser: "admin", severity: "MEDIUM", status: "ACTIVE", timestamp: "45 mins ago" },
  { id: "SEC-004", rule: "Port Scanning Activity", sourceIp: "10.10.10.45", targetUser: "system", severity: "LOW", status: "RESOLVED", timestamp: "2 hours ago" },
];

export default function SecurityTab() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(mockSecurityAlerts);

  const handleAction = (id: string, newStatus: SecurityAlert["status"]) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Security Score & Threat Posture Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
        
        {/* Security Health Score Card */}
        <div className="devops-card" style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 110, height: 110, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <svg width="110" height="110" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="var(--border-color)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="var(--accent-green)" strokeWidth="8" fill="none" strokeDasharray="264" strokeDashoffset="10" strokeLinecap="round" />
            </svg>
            <span style={{ position: "absolute", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              96
            </span>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Overall Security Posture</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-green)", background: "var(--accent-green-subtle)", padding: "2px 8px", borderRadius: 4, marginTop: 4 }}>
            EXCELLENT (SOC2 Compliant)
          </span>
        </div>

        {/* Security Controls & Vulnerability Breakdown */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Security Compliance & Controls</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { name: "Container Isolation", desc: "Docker rootless & network bridge", status: "PASS" },
              { name: "LLM Model Integrity", desc: "Ollama gemma4:e4b verified", status: "PASS" },
              { name: "Elastic MCP Protocol", desc: "HTTP tool endpoint verification", status: "PASS" },
              { name: "Log Storage Encryption", desc: "ES cluster single-node X-Pack", status: "PASS" },
            ].map((ctrl, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 6, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{ctrl.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{ctrl.desc}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-green)", background: "var(--accent-green-subtle)", padding: "2px 6px", borderRadius: 3 }}>
                  {ctrl.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Active SOC Security Alerts Table */}
      <div className="devops-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Active Threat Triage Stream</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((alert) => {
            const isCritical = alert.severity === "CRITICAL" || alert.severity === "HIGH";

            return (
              <div key={alert.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-primary)", borderRadius: 6, border: "1px solid var(--border-color)" }}>
                
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <ShieldAlert style={{ width: 20, height: 20, color: isCritical ? "var(--accent-red)" : "var(--accent-orange)" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {alert.rule} <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>({alert.id})</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      IP: <span style={{ color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>{alert.sourceIp}</span> • Target User: {alert.targetUser} • {alert.timestamp}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: alert.status === "RESOLVED" ? "var(--accent-green-subtle)" : alert.status === "BLOCKED" ? "var(--accent-red-subtle)" : "var(--accent-orange-subtle)",
                      color: alert.status === "RESOLVED" ? "var(--accent-green)" : alert.status === "BLOCKED" ? "var(--accent-red)" : "var(--accent-orange)",
                    }}
                  >
                    {alert.status}
                  </span>

                  {alert.status !== "BLOCKED" && alert.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => handleAction(alert.id, "BLOCKED")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        background: "var(--accent-red-subtle)",
                        border: "1px solid var(--accent-red)",
                        color: "var(--accent-red)",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Ban style={{ width: 12, height: 12 }} />
                      <span>Block IP</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive SOC Analyst Chat Assistant Sandbox */}
      <div style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
          Interactive Analyst Chat Sandbox (LangGraph + MCP Simulator)
        </h3>
        <ChatPreviewSandbox />
      </div>

    </div>
  );
}
