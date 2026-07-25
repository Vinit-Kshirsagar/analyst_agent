"use client";

import { 
  LayoutDashboard, 
  BarChart3, 
  LineChart, 
  GitCommit, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield
} from "lucide-react";

export type TabType = 
  | "dashboard"
  | "analytics"
  | "charts"
  | "pipelines"
  | "logs"
  | "security"
  | "status"
  | "settings";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  backendHealthy: boolean;
  onReturnToWelcome: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  backendHealthy,
  onReturnToWelcome,
}: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "charts", label: "Charts Showcase", icon: LineChart },
    { id: "pipelines", label: "Pipelines", icon: GitCommit },
    { id: "logs", label: "Live Logs", icon: FileText },
    { id: "security", label: "Security & SOC", icon: ShieldCheck },
    { id: "status", label: "Status Page", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      style={{
        width: collapsed ? 72 : 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "width 0.2s ease",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Top Header / Branding */}
      <div>
        <div
          style={{
            height: 64,
            padding: "0 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <div
            onClick={onReturnToWelcome}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
            title="Return to Welcome Screen"
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--accent-blue-subtle)",
                border: "1px solid var(--accent-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield style={{ width: 20, height: 20, color: "var(--accent-blue)" }} />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                  Analyst Agent
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-mono)" }}>
                  DevOps & SOC v0.1
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4,
              }}
            >
              <ChevronLeft style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: "16px 8px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as TabType)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "10px 0" : "10px 14px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: isActive ? "#60A5FA" : "#94A3B8",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  marginBottom: 4,
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: "0 3px 3px 0",
                      background: "#3B82F6",
                    }}
                  />
                )}
                <Icon style={{ width: 18, height: 18, flexShrink: 0, color: isActive ? "#60A5FA" : "#94A3B8" }} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer / Collapse & System Badge */}
      <div
        style={{
          padding: "16px 12px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
            }}
          >
            <ChevronRight style={{ width: 18, height: 18 }} />
          </button>
        ) : (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border-color)",
              padding: "10px 12px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="status-pulse"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: backendHealthy ? "#10B981" : "#EF4444",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#E2E8F0" }}>
                {backendHealthy ? "Backend Online" : "Backend Offline"}
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-mono)" }}>
              :8000
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
