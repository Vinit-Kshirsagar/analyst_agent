"use client";

import { 
  Activity, 
  Server, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  GitCommit, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from "recharts";

interface DashboardOverviewProps {
  healthData: any;
  backendError: string | null;
}

const activityData = [
  { time: "00:00", requests: 1240, errors: 4, latency: 14 },
  { time: "04:00", requests: 980, errors: 2, latency: 12 },
  { time: "08:00", requests: 2450, errors: 8, latency: 18 },
  { time: "12:00", requests: 3890, errors: 14, latency: 22 },
  { time: "16:00", requests: 3120, errors: 6, latency: 16 },
  { time: "20:00", requests: 2100, errors: 3, latency: 13 },
  { time: "24:00", requests: 1650, errors: 5, latency: 15 },
];

export default function DashboardOverview({ healthData, backendError }: DashboardOverviewProps) {
  const components = healthData?.components || {};

  const services = [
    { name: "Elasticsearch Index", port: "9200", status: components.elasticsearch?.status === "connected" ? "healthy" : "unreachable", detail: components.elasticsearch?.detail },
    { name: "Ollama LLM (gemma4:e4b)", port: "11434", status: components.ollama?.status === "connected" ? "healthy" : "warning", detail: components.ollama?.status },
    { name: "Elastic MCP Server", port: "8080", status: components.mcp_server?.status === "connected" ? "healthy" : "unreachable", detail: components.mcp_server?.detail },
    { name: "FastAPI Gateway", port: "8000", status: backendError ? "error" : "healthy", detail: backendError || "Connected" },
    { name: "Next.js Web Console", port: "3000", status: "healthy", detail: "Active" },
  ];

  const kpiCards = [
    { title: "System Uptime", value: "99.98%", change: "+0.02%", positive: true, icon: Clock, desc: "Last 30 days operational SLA" },
    { title: "Active Services", value: "5 / 5", change: "100%", positive: true, icon: Server, desc: "All core containers online" },
    { title: "API Throughput", value: "1.42M", change: "+12.4%", positive: true, icon: Activity, desc: "Total requests processed today" },
    { title: "Error Rate", value: "0.04%", change: "-0.01%", positive: true, icon: ShieldAlert, desc: "HTTP 5xx & connection errors" },
    { title: "Deployments", value: "42", change: "+4 today", positive: true, icon: GitCommit, desc: "CI/CD automated builds" },
    { title: "Active Analysts", value: "12", change: "Online", positive: true, icon: Users, desc: "SOC operator sessions active" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Overview KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="devops-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {card.title}
                </span>
                <Icon style={{ width: 16, height: 16, color: "var(--accent-blue)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                  {card.value}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: card.positive ? "var(--accent-green)" : "var(--accent-red)", display: "flex", alignItems: "center" }}>
                  {card.positive ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <ArrowDownRight style={{ width: 12, height: 12 }} />}
                  {card.change}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        
        {/* Real-time System Request & Latency Chart */}
        <div className="devops-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Request Volume & Latency Trend</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>24-hour API request distribution (req/min)</p>
            </div>
            <span style={{ fontSize: 11, color: "var(--accent-green)", background: "var(--accent-green-subtle)", padding: "4px 8px", borderRadius: 4, fontFamily: "var(--font-mono)" }}>
              LIVE STREAM
            </span>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }}
                />
                <Area type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#reqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Service Health List */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Stack Component Health</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {services.map((svc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 6, border: "1px solid var(--border-color)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{svc.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Port :{svc.port}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="status-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: svc.status === "healthy" ? "#10B981" : svc.status === "warning" ? "#F59E0B" : "#EF4444" }}></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: svc.status === "healthy" ? "var(--accent-green)" : svc.status === "warning" ? "var(--accent-orange)" : "var(--accent-red)" }}>
                    {svc.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Security Incident Stream & Deployment Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* Security Incident Stream */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Recent Security Incident Stream</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { rule: "Brute Force Attack", ip: "10.0.0.55", severity: "HIGH", time: "2 mins ago" },
              { rule: "Failed Login Attempt", ip: "192.168.1.50", severity: "MEDIUM", time: "14 mins ago" },
              { rule: "Malware Detected", ip: "172.16.0.23", severity: "CRITICAL", time: "32 mins ago" },
              { rule: "Network Scanning", ip: "10.10.10.45", severity: "LOW", time: "1 hour ago" },
            ].map((incident, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid var(--border-color)" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{incident.rule}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Source: {incident.ip}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "var(--accent-red-subtle)" : "var(--accent-orange-subtle)",
                    color: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "var(--accent-red)" : "var(--accent-orange)",
                    border: `1px solid ${incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "var(--accent-red)" : "var(--accent-orange)"}`,
                  }}>
                    {incident.severity}
                  </span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{incident.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Activity Timeline */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>CI/CD Deployment History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { env: "Production", commit: "feat(backend): add health endpoint", author: "devops-bot", time: "10 mins ago", status: "SUCCESS" },
              { env: "Staging", commit: "feat(mcp): update ES query tool", author: "mayaaaank", time: "45 mins ago", status: "SUCCESS" },
              { env: "Development", commit: "fix(frontend): update dark mode theme", author: "frontend-team", time: "2 hours ago", status: "SUCCESS" },
              { env: "Production", commit: "chore(data): reseed 200 security logs", author: "ci-worker", time: "4 hours ago", status: "SUCCESS" },
            ].map((dep, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg-primary)", borderRadius: 6, border: "1px solid var(--border-color)" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{dep.commit}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dep.env} • by {dep.author}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-green)", background: "var(--accent-green-subtle)", padding: "2px 8px", borderRadius: 4 }}>
                    {dep.status}
                  </span>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{dep.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
