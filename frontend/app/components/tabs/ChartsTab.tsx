"use client";

import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const resourceData = [
  { time: "00:00", cpu: 22, memory: 48, diskIO: 12 },
  { time: "04:00", cpu: 18, memory: 44, diskIO: 8 },
  { time: "08:00", cpu: 45, memory: 62, diskIO: 28 },
  { time: "12:00", cpu: 78, memory: 82, diskIO: 45 },
  { time: "16:00", cpu: 64, memory: 75, diskIO: 34 },
  { time: "20:00", cpu: 38, memory: 58, diskIO: 22 },
  { time: "24:00", cpu: 28, memory: 50, diskIO: 15 },
];

const pieData = [
  { name: "alerts-security", value: 45, fill: "#3B82F6" },
  { name: "syslog-events", value: 25, fill: "#10B981" },
  { name: "nginx-access", value: 18, fill: "#F59E0B" },
  { name: "auth-audit", value: 12, fill: "#06B6D4" },
];

const threatRadarData = [
  { category: "Brute Force", score: 85 },
  { category: "Malware", score: 65 },
  { category: "Port Scan", score: 40 },
  { category: "SQL Injection", score: 25 },
  { category: "DDoS", score: 55 },
  { category: "XSS Vulnerability", score: 30 },
];

const scatterData = [
  { payload: 1.2, latency: 12 },
  { payload: 2.8, latency: 24 },
  { payload: 4.5, latency: 45 },
  { payload: 8.1, latency: 78 },
  { payload: 12.4, latency: 110 },
  { payload: 18.0, latency: 185 },
  { payload: 24.5, latency: 240 },
];

export default function ChartsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Chart Row 1: Infrastructure Resource Utilization & Donut Log Share */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        
        {/* Resource Utilization Area Chart */}
        <div className="devops-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Host Infrastructure Utilization</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>CPU, Memory, and Disk I/O metrics across Docker containers</p>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "#3B82F6" }}>■ CPU %</span>
              <span style={{ color: "#10B981" }}>■ Memory %</span>
              <span style={{ color: "#F59E0B" }}>■ Disk I/O MB/s</span>
            </div>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
                <Area type="monotone" dataKey="cpu" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                <Area type="monotone" dataKey="memory" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="diskIO" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Log Volume Donut Chart */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Elasticsearch Index Log Share</h3>
          
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            {pieData.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: item.fill }} />
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Chart Row 2: Security Threat Surface Radar & Scatter Plot */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* Radar Threat Surface Analysis */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Threat Vector Vulnerability Surface</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius={80} data={threatRadarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--border-color)" fontSize={10} />
                <Radar name="Threat Level" dataKey="score" stroke="#EF4444" fill="#EF4444" fillOpacity={0.4} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payload Size vs Latency Scatter Plot */}
        <div className="devops-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Payload Size vs Processing Latency</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="payload" name="Payload (MB)" unit="MB" stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="number" dataKey="latency" name="Latency (ms)" unit="ms" stroke="var(--text-muted)" fontSize={11} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 6, fontSize: 12, color: "var(--text-primary)" }} />
                <Scatter name="API Requests" data={scatterData} fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
