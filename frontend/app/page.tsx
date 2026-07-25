"use client";

import { useState, useEffect, useCallback } from "react";
import WelcomePage from "./components/WelcomePage";
import Sidebar, { TabType } from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { ThemeMode } from "./components/ui/animated-theme-toggler";

// Tab Components
import DashboardOverview from "./components/tabs/DashboardOverview";
import AnalyticsTab from "./components/tabs/AnalyticsTab";
import ChartsTab from "./components/tabs/ChartsTab";
import PipelinesTab from "./components/tabs/PipelinesTab";
import LogsTab from "./components/tabs/LogsTab";
import SecurityTab from "./components/tabs/SecurityTab";
import StatusTab from "./components/tabs/StatusTab";
import SettingsTab from "./components/tabs/SettingsTab";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function StatusPage() {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const [healthData, setHealthData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize data-theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "cream" : prev === "cream" ? "light" : "dark"));
  };

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

  const backendHealthy = healthData?.status === "healthy";

  // If user is on Welcome Page
  if (showWelcome) {
    return (
      <WelcomePage
        onEnterDashboard={() => setShowWelcome(false)}
        theme={theme}
        onSelectTheme={setTheme}
      />
    );
  }

  // Main Dashboard Application Workspace
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        backendHealthy={backendHealthy}
        onReturnToWelcome={() => setShowWelcome(true)}
      />

      {/* Main Content Viewport */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Sticky Header Navbar */}
        <Navbar
          activeTab={activeTab}
          theme={theme === "cream" ? "light" : theme}
          onToggleTheme={toggleTheme}
          onRefresh={fetchHealth}
          isRefreshing={loading}
        />

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          
          {/* Active Tab View */}
          {activeTab === "dashboard" && (
            <DashboardOverview healthData={healthData} backendError={error} />
          )}

          {activeTab === "analytics" && <AnalyticsTab />}

          {activeTab === "charts" && <ChartsTab />}

          {activeTab === "pipelines" && <PipelinesTab />}

          {activeTab === "logs" && <LogsTab />}

          {activeTab === "security" && <SecurityTab />}

          {activeTab === "status" && <StatusTab healthData={healthData} />}

          {activeTab === "settings" && (
            <SettingsTab healthData={healthData} apiUrl={API_URL} />
          )}

        </main>
      </div>

    </div>
  );
}
