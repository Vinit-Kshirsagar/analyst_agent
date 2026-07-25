"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Filter, Calendar, TrendingUp, Zap, Server, ShieldCheck } from "lucide-react";

const analyticsTimeSeries = [
  { time: "00:00", p50: 12, p95: 28, p99: 45, throughput: 1100 },
  { time: "03:00", p50: 10, p95: 24, p99: 38, throughput: 850 },
  { time: "06:00", p50: 14, p95: 32, p99: 52, throughput: 1650 },
  { time: "09:00", p50: 18, p95: 42, p99: 68, throughput: 2890 },
  { time: "12:00", p50: 22, p95: 48, p99: 82, throughput: 3400 },
  { time: "15:00", p50: 16, p95: 36, p99: 58, throughput: 2750 },
  { time: "18:00", p50: 14, p95: 30, p99: 48, throughput: 2100 },
  { time: "21:00", p50: 12, p95: 26, p99: 42, throughput: 1450 },
];

const statusCodeData = [
  { status: "200 OK", count: 1240500, fill: "#10B981" },
  { status: "304 Not Modified", count: 142000, fill: "#3B82F6" },
  { status: "400 Bad Request", count: 12400, fill: "#F59E0B" },
  { status: "404 Not Found", count: 8500, fill: "#06B6D4" },
  { status: "500 Internal Error", count: 420, fill: "#EF4444" },
];

const endpointData = [
  { endpoint: "/health", calls: 452000, latency: "4ms", cacheHit: "99.8%" },
  { endpoint: "/api/mcp/query", calls: 289000, latency: "42ms", cacheHit: "88.2%" },
  { endpoint: "/api/ollama/generate", calls: 142000, latency: "185ms", cacheHit: "76.4%" },
  { endpoint: "/api/es/alerts", calls: 512000, latency: "18ms", cacheHit: "94.5%" },
  { endpoint: "/debug", calls: 25000, latency: "2ms", cacheHit: "100%" },
];

export default function AnalyticsTab() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("ALL");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Filter Bar */}
      <div className="devops-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Filter style={{ width: 16, height: 16, color: "var(--accent-blue)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Filter Analytics:</span>
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            style={{
              padding: "6px 12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--text-primary)",
              outline: "none",
            }}
          >
            <option value="ALL">All API Endpoints</option>
            <option value="/health">/health</option>
            <option value="/api/mcp/query">/api/mcp/query</option>
            <option value="/api/ollama/generate">/api/ollama/generate</option>
            <option value="/api/es/alerts">/api/es/alerts</option>
          </select>
        </div>

        {/* Analytics Key Performance Indicators */}
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>P95 Latency</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>32ms</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>P99 Latency</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-orange)", fontFamily: "var(--font-mono)" }}>68ms</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Throughput</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>1,450 req/s</span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Cache Hit Ratio</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>94.2%</span>
          </div>
        </div>
      </div>

      {/* Latency Percentile Composed Chart */}
      <div className="devops-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Latency Percentile Distribution (P50, P95, P99)</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Execution time across API Gateway microservices (milliseconds)</p>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "#10B981" }}>■ P50</span>
            <span style={{ color: "#3B82F6" }}>■ P95</span>
            <span style={{ color: "#EF4444" }}>■ P99</span>
          </div>
        </div>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analyticsTimeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="ms" />
              <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
              <Area type="monotone" dataKey="p50" fill="#10B981" stroke="#10B981" fillOpacity={0.1} />
              <Line type="monotone" dataKey="p95" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HTTP Status Code & Endpoint Performance Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* Status Code Bar Chart */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>HTTP Response Code Breakdown</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCodeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="status" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top API Endpoints Performance Table */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Top API Endpoint Performance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {endpointData.map((ep, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 6, border: "1px solid var(--border-color)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{ep.endpoint}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{ep.calls.toLocaleString()} requests</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>{ep.latency}</span>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Cache: {ep.cacheHit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
