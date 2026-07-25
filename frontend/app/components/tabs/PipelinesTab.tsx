"use client";

import { useState } from "react";
import { GitCommit, CheckCircle2, RefreshCw, XCircle, Clock, Play, Terminal, Layers, ArrowRight } from "lucide-react";

interface PipelineStage {
  name: string;
  status: "SUCCESS" | "RUNNING" | "FAILED" | "QUEUED";
  duration: string;
}

interface Pipeline {
  id: string;
  name: string;
  branch: string;
  author: string;
  commit: string;
  status: "SUCCESS" | "RUNNING" | "FAILED" | "QUEUED";
  duration: string;
  stages: PipelineStage[];
}

const pipelinesList: Pipeline[] = [
  {
    id: "#1428",
    name: "main-deployment-pipeline",
    branch: "main",
    author: "mayaaaank",
    commit: "5634009 feat(frontend): add root layout",
    status: "SUCCESS",
    duration: "2m 14s",
    stages: [
      { name: "Code Lint", status: "SUCCESS", duration: "12s" },
      { name: "Unit Tests", status: "SUCCESS", duration: "24s" },
      { name: "Snyk Scan", status: "SUCCESS", duration: "18s" },
      { name: "Docker Build", status: "SUCCESS", duration: "48s" },
      { name: "Deploy Prod", status: "SUCCESS", duration: "32s" },
    ],
  },
  {
    id: "#1427",
    name: "sec-agent-backend-build",
    branch: "feature/mcp-client",
    author: "soc-bot",
    commit: "a69eb44 feat(backend): implement FastAPI",
    status: "RUNNING",
    duration: "1m 05s",
    stages: [
      { name: "Code Lint", status: "SUCCESS", duration: "10s" },
      { name: "Unit Tests", status: "SUCCESS", duration: "22s" },
      { name: "Snyk Scan", status: "SUCCESS", duration: "16s" },
      { name: "Docker Build", status: "RUNNING", duration: "17s..." },
      { name: "Deploy Staging", status: "QUEUED", duration: "--" },
    ],
  },
  {
    id: "#1426",
    name: "mcp-indexing-job",
    branch: "main",
    author: "ci-worker",
    commit: "e39d5e7 feat(data): implement sample security log",
    status: "SUCCESS",
    duration: "3m 42s",
    stages: [
      { name: "ES Connect", status: "SUCCESS", duration: "15s" },
      { name: "Seed 200 Logs", status: "SUCCESS", duration: "1m 10s" },
      { name: "Index Mapping", status: "SUCCESS", duration: "45s" },
      { name: "Verify Count", status: "SUCCESS", duration: "1m 32s" },
    ],
  },
  {
    id: "#1425",
    name: "ollama-model-pull-verify",
    branch: "main",
    author: "system",
    commit: "0e5bc72 feat(infra): configure docker compose",
    status: "SUCCESS",
    duration: "45s",
    stages: [
      { name: "Pull Tag", status: "SUCCESS", duration: "20s" },
      { name: "Verify gemma4:e4b", status: "SUCCESS", duration: "25s" },
    ],
  },
];

export default function PipelinesTab() {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>(pipelinesList[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Environment & Build Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div className="devops-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>PRODUCTION ENV</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-green)" }}>v0.1.0-main</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Last deploy 10m ago</div>
        </div>
        <div className="devops-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>STAGING ENV</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-blue)" }}>v0.1.0-rc2</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Active build running</div>
        </div>
        <div className="devops-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>SUCCESS RATE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>98.4%</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Last 100 builds</div>
        </div>
        <div className="devops-card" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>AVG DURATION</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>1m 54s</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Standard CI pipeline</div>
        </div>
      </div>

      {/* Selected Pipeline Stage Pipeline Visualizer */}
      <div className="devops-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{selectedPipeline.name}</h3>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>
                {selectedPipeline.id}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Branch: <code className="font-mono">{selectedPipeline.branch}</code> • Commit: <code className="font-mono">{selectedPipeline.commit}</code> • Author: {selectedPipeline.author}
            </p>
          </div>

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "var(--accent-blue)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Play style={{ width: 14, height: 14 }} />
            <span>Trigger Pipeline</span>
          </button>
        </div>

        {/* Visual Pipeline Stages Flow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {selectedPipeline.stages.map((stage, idx) => {
            const isLast = idx === selectedPipeline.stages.length - 1;
            const isSuccess = stage.status === "SUCCESS";
            const isRunning = stage.status === "RUNNING";

            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div
                  style={{
                    width: 170,
                    padding: 14,
                    borderRadius: 8,
                    background: "var(--bg-primary)",
                    border: `1px solid ${isRunning ? "var(--accent-blue)" : isSuccess ? "var(--border-color)" : "var(--border-subtle)"}`,
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{stage.name}</span>
                    {isSuccess ? (
                      <CheckCircle2 style={{ width: 16, height: 16, color: "var(--accent-green)" }} />
                    ) : isRunning ? (
                      <RefreshCw style={{ width: 16, height: 16, color: "var(--accent-blue)", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Clock style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    Duration: {stage.duration}
                  </div>
                </div>

                {!isLast && <ArrowRight style={{ width: 16, height: 16, color: "var(--text-muted)", flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Runs Table */}
      <div className="devops-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Recent Pipeline Runs</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pipelinesList.map((pipe) => {
            const isSelected = selectedPipeline.id === pipe.id;

            return (
              <div
                key={pipe.id}
                onClick={() => setSelectedPipeline(pipe)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 6,
                  background: isSelected ? "var(--bg-card-hover)" : "var(--bg-primary)",
                  border: `1px solid ${isSelected ? "var(--accent-blue)" : "var(--border-color)"}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <GitCommit style={{ width: 18, height: 18, color: pipe.status === "SUCCESS" ? "var(--accent-green)" : "var(--accent-blue)" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {pipe.name} <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{pipe.id}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {pipe.commit} • by {pipe.author}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{pipe.duration}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 4,
                      background: pipe.status === "SUCCESS" ? "var(--accent-green-subtle)" : "var(--accent-blue-subtle)",
                      color: pipe.status === "SUCCESS" ? "var(--accent-green)" : "var(--accent-blue)",
                      border: `1px solid ${pipe.status === "SUCCESS" ? "var(--accent-green)" : "var(--accent-blue)"}`,
                    }}
                  >
                    {pipe.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
