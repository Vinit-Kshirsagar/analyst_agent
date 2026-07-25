"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown, ChevronRight, Terminal, RefreshCw, Download, Copy, Check } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip } from "recharts";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "ERROR" | "WARN" | "INFO" | "DEBUG";
  sourceIp: string;
  ruleName: string;
  index: string;
  message: string;
  rawJson: object;
}

const mockLogs: LogEntry[] = [
  {
    id: "seed-alert-0001",
    timestamp: "2026-07-26T00:15:32.410Z",
    level: "ERROR",
    sourceIp: "10.0.0.55",
    ruleName: "Brute Force Attack",
    index: "alerts-security",
    message: "Multiple failed authentication attempts detected from 10.0.0.55 (count: 42)",
    rawJson: {
      "@timestamp": "2026-07-26T00:15:32.410Z",
      "source": { "ip": "10.0.0.55", "port": 49152 },
      "destination": { "ip": "10.0.0.1", "port": 22 },
      "event": { "type": "authentication", "outcome": "failure", "severity": 4 },
      "rule": { "name": "Brute Force Attack", "description": "Alert from 10.0.0.55" }
    }
  },
  {
    id: "seed-alert-0002",
    timestamp: "2026-07-26T00:14:18.102Z",
    level: "WARN",
    sourceIp: "192.168.1.50",
    ruleName: "Failed Login Attempt",
    index: "alerts-security",
    message: "Failed login for user admin from IP 192.168.1.50",
    rawJson: {
      "@timestamp": "2026-07-26T00:14:18.102Z",
      "source": { "ip": "192.168.1.50", "port": 54210 },
      "destination": { "ip": "10.0.0.2", "port": 443 },
      "event": { "type": "authentication", "outcome": "failure", "severity": 2 },
      "rule": { "name": "Failed Login Attempt" }
    }
  },
  {
    id: "seed-alert-0003",
    timestamp: "2026-07-26T00:12:05.881Z",
    level: "ERROR",
    sourceIp: "172.16.0.23",
    ruleName: "Malware Detected",
    index: "alerts-security",
    message: "Malware signature match /tmp/suspicious_payload.sh on 172.16.0.23",
    rawJson: {
      "@timestamp": "2026-07-26T00:12:05.881Z",
      "source": { "ip": "172.16.0.23", "port": 38921 },
      "event": { "type": "malware", "outcome": "failure", "severity": 5 },
      "rule": { "name": "Malware Detected" }
    }
  },
  {
    id: "seed-alert-0004",
    timestamp: "2026-07-26T00:10:44.204Z",
    level: "INFO",
    sourceIp: "10.0.0.2",
    ruleName: "Successful Login",
    index: "syslog-events",
    message: "User user_42 successfully authenticated via SSH",
    rawJson: {
      "@timestamp": "2026-07-26T00:10:44.204Z",
      "source": { "ip": "10.0.0.2", "port": 22 },
      "event": { "type": "authentication", "outcome": "success", "severity": 1 }
    }
  },
  {
    id: "seed-alert-0005",
    timestamp: "2026-07-26T00:08:12.650Z",
    level: "DEBUG",
    sourceIp: "127.0.0.1",
    ruleName: "MCP Tool Call Ping",
    index: "nginx-access",
    message: "GET /ping HTTP/1.1 200 OK - elasticsearch-core-mcp-server",
    rawJson: {
      "@timestamp": "2026-07-26T00:08:12.650Z",
      "http": { "method": "GET", "status_code": 200, "url": "/ping" }
    }
  }
];

const logHistogram = [
  { time: "00:00", count: 420 },
  { time: "02:00", count: 280 },
  { time: "04:00", count: 190 },
  { time: "06:00", count: 520 },
  { time: "08:00", count: 890 },
  { time: "10:00", count: 1240 },
  { time: "12:00", count: 950 },
];

export default function LogsTab() {
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = mockLogs.filter((log) => {
    const matchLevel = selectedLevel === "ALL" || log.level === selectedLevel;
    const matchQuery =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sourceIp.includes(searchQuery) ||
      log.ruleName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchQuery;
  });

  const handleCopyJson = (log: LogEntry) => {
    navigator.clipboard.writeText(JSON.stringify(log.rawJson, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Log Volume Stream Histogram */}
      <div className="devops-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Real-Time Log Volume Stream</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Ingested documents in Elasticsearch index alerts-security (events/min)</p>
          </div>
          <span style={{ fontSize: 11, color: "var(--accent-blue)", background: "var(--accent-blue-subtle)", padding: "4px 8px", borderRadius: 4, fontFamily: "var(--font-mono)" }}>
            200 SEEDED DOCUMENTS
          </span>
        </div>

        <div style={{ width: "100%", height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={logHistogram} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="devops-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        
        {/* Search */}
        <div style={{ position: "relative", minWidth: 280, flex: 1 }}>
          <Search style={{ width: 14, height: 14, color: "var(--text-muted)", position: "absolute", left: 10, top: 10 }} />
          <input
            type="text"
            placeholder="Filter logs by message, IP, rule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px 6px 32px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>

        {/* Severity Level Chips */}
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                background: selectedLevel === lvl ? "var(--accent-blue)" : "var(--bg-primary)",
                color: selectedLevel === lvl ? "#FFFFFF" : "var(--text-muted)",
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

      </div>

      {/* Log Explorer List */}
      <div className="devops-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Log Stream Records</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const levelColor =
              log.level === "ERROR"
                ? "var(--accent-red)"
                : log.level === "WARN"
                ? "var(--accent-orange)"
                : log.level === "INFO"
                ? "var(--accent-green)"
                : "var(--accent-cyan)";

            return (
              <div
                key={log.id}
                style={{
                  borderRadius: 6,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  overflow: "hidden",
                }}
              >
                {/* Log Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, overflow: "hidden" }}>
                    {isExpanded ? <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronRight style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />}
                    
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 3,
                        background: `${levelColor}20`,
                        color: levelColor,
                        border: `1px solid ${levelColor}`,
                        flexShrink: 0,
                      }}
                    >
                      {log.level}
                    </span>

                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                      {log.timestamp}
                    </span>

                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {log.message}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>
                      {log.sourceIp}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {log.index}
                    </span>
                  </div>
                </div>

                {/* Expanded Raw JSON View */}
                {isExpanded && (
                  <div style={{ padding: 14, borderTop: "1px solid var(--border-color)", background: "#0D1117" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#8B949E", fontFamily: "var(--font-mono)" }}>Raw JSON Document ({log.id})</span>
                      
                      <button
                        type="button"
                        onClick={() => handleCopyJson(log)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#21262D",
                          border: "1px solid #30363D",
                          color: "#C9D1D9",
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {copiedId === log.id ? <Check style={{ width: 12, height: 12, color: "#3FB950" }} /> : <Copy style={{ width: 12, height: 12 }} />}
                        <span>{copiedId === log.id ? "Copied" : "Copy JSON"}</span>
                      </button>
                    </div>

                    <pre style={{ fontSize: 12, color: "#58A6FF", fontFamily: "var(--font-mono)", overflowX: "auto", margin: 0 }}>
                      {JSON.stringify(log.rawJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
