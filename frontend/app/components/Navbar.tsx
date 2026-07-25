"use client";

import { useState } from "react";
import { Search, RefreshCw, Sun, Moon, Calendar, Bell, ExternalLink } from "lucide-react";
import { TabType } from "./Sidebar";

interface NavbarProps {
  activeTab: TabType;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Navbar({
  activeTab,
  theme,
  onToggleTheme,
  onRefresh,
  isRefreshing,
}: NavbarProps) {
  const [timeRange, setTimeRange] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");

  const tabTitles: Record<TabType, { title: string; desc: string }> = {
    dashboard: { title: "System Overview", desc: "Real-time DevOps telemetry & incident response monitoring" },
    analytics: { title: "Performance Analytics", desc: "Deep metrics breakdown & request performance exploration" },
    charts: { title: "Visualization Showcase", desc: "Infrastructure, resource utilization, and threat distribution charts" },
    pipelines: { title: "CI/CD Deployment Pipelines", desc: "Build stages, deployment history, and environment tracking" },
    logs: { title: "Production Security Logs", desc: "Live event stream, rule triggers, and raw JSON search" },
    security: { title: "Security Posture & SOC Triage", desc: "Threat intelligence center, security score, and alert management" },
    status: { title: "System Status & Incidents", desc: "Service availability, uptime metrics, and public status history" },
    settings: { title: "Console Settings", desc: "Environment parameters, API endpoints, and notification webhooks" },
  };

  const currentInfo = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <header
      style={{
        height: 64,
        padding: "0 24px",
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Title & Description */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {currentInfo.title}
        </h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {currentInfo.desc}
        </p>
      </div>

      {/* Right Action Tools */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        
        {/* Global Search Bar */}
        <div style={{ position: "relative", width: 220 }}>
          <Search style={{ width: 14, height: 14, color: "var(--text-muted)", position: "absolute", left: 10, top: 10 }} />
          <input
            type="text"
            placeholder="Search logs, IPs, rules..."
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

        {/* Time Range Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 6, padding: 2 }}>
          {["1h", "24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              style={{
                padding: "4px 10px",
                borderRadius: 4,
                border: "none",
                fontSize: 11,
                fontWeight: timeRange === range ? 600 : 500,
                background: timeRange === range ? "var(--bg-card)" : "transparent",
                color: timeRange === range ? "var(--accent-blue)" : "var(--text-muted)",
                cursor: "pointer",
                boxShadow: timeRange === range ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          title="Refresh Telemetry Data"
        >
          <RefreshCw style={{ width: 14, height: 14, animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {theme === "dark" ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
        </button>

      </div>
    </header>
  );
}
