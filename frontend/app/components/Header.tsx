"use client";

import { Shield, Activity, Terminal, RefreshCw, Cpu, Server } from "lucide-react";

interface HeaderProps {
  overallStatus: "healthy" | "degraded" | "error" | "loading";
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ overallStatus, onRefresh, isRefreshing }: HeaderProps) {
  const getStatusBadge = () => {
    switch (overallStatus) {
      case "healthy":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(76, 175, 80, 0.12)", border: "1px solid rgba(76, 175, 80, 0.4)", padding: "4px 12px", borderRadius: 20 }}>
            <span className="animate-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF50" }}></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4CAF50", letterSpacing: "0.05em" }}>SYSTEM ONLINE</span>
          </div>
        );
      case "degraded":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255, 193, 7, 0.12)", border: "1px solid rgba(255, 193, 7, 0.4)", padding: "4px 12px", borderRadius: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFC107" }}></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FFC107", letterSpacing: "0.05em" }}>DEGRADED</span>
          </div>
        );
      case "error":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(244, 67, 54, 0.12)", border: "1px solid rgba(244, 67, 54, 0.4)", padding: "4px 12px", borderRadius: 20 }}>
            <span className="animate-pulse-red" style={{ width: 8, height: 8, borderRadius: "50%", background: "#F44336" }}></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#F44336", letterSpacing: "0.05em" }}>UNREACHABLE</span>
          </div>
        );
      default:
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(138, 143, 168, 0.12)", border: "1px solid rgba(138, 143, 168, 0.3)", padding: "4px 12px", borderRadius: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8A8FA8" }}></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#8A8FA8", letterSpacing: "0.05em" }}>INITIALIZING...</span>
          </div>
        );
    }
  };

  return (
    <header className="glass-header" style={{ position: "sticky", top: 0, zIndex: 50, padding: "12px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Left: Brand / Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ background: "rgba(233, 69, 96, 0.15)", border: "1px solid rgba(233, 69, 96, 0.4)", padding: 10, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield style={{ width: 22, height: 22, color: "#E94560" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>Autonomous Security Agent</h1>
              <span style={{ fontSize: 11, fontWeight: 600, background: "#0F3460", color: "#EAEAEA", border: "1px solid #3C4A6A", padding: "2px 8px", borderRadius: 4 }}>
                PHASE 0
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#8A8FA8", marginTop: 2 }}>SOC Analyst Operations Console & Stack Monitor</p>
          </div>
        </div>

        {/* Right: Actions & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {getStatusBadge()}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#0F3460",
              color: "#EAEAEA",
              border: "1px solid #3C4A6A",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#E94560")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#3C4A6A")}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
            <span>{isRefreshing ? "Checking..." : "Refresh Stack"}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
