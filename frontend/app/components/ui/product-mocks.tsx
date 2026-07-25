"use client";

import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  Search,
  Server,
  Shield,
} from "lucide-react";

/** Lightweight UI shells for landing mockups — not the real dashboard. */

export function MockChrome({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/60 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 truncate font-mono text-[10px] text-[var(--text-muted)]">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export function MockInboxStyle() {
  return (
    <MockChrome title="analyst-agent · operations console" className="h-full">
      <div className="flex h-[280px] sm:h-[320px]">
        <aside className="hidden w-36 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-primary)]/40 p-2 text-[10px] sm:block">
          {[
            { label: "Alerts", n: 128, active: true },
            { label: "Logs", n: 9 },
            { label: "Health", n: 5 },
            { label: "Pipelines", n: 3 },
          ].map((i) => (
            <div
              key={i.label}
              className={cn(
                "mb-1 flex items-center justify-between rounded-lg px-2 py-1.5",
                i.active
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              <span className="font-medium">{i.label}</span>
              <span className="tabular-nums opacity-70">{i.n}</span>
            </div>
          ))}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[var(--border-color)] px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-2 py-1.5 text-[10px] text-[var(--text-muted)]">
              <Search className="h-3 w-3" />
              Ask about malicious IPs today…
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden p-3">
            {[
              {
                t: "Brute force · 10.0.0.55",
                b: "SSH :22 — 214 failed attempts in 12m",
                tag: "HIGH",
              },
              {
                t: "Malware signature",
                b: "/tmp/suspicious.sh matched on host-23",
                tag: "CRIT",
              },
              {
                t: "Failed login cluster",
                b: "192.168.1.50 — 30m window",
                tag: "MED",
              },
            ].map((row) => (
              <div
                key={row.t}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/30 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-semibold text-[var(--text-primary)]">
                      {row.t}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                      {row.b}
                    </div>
                  </div>
                  <span className="shrink-0 rounded border border-[var(--accent-red)]/40 bg-[var(--accent-red-subtle)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent-red)]">
                    {row.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-44 shrink-0 border-l border-[var(--border-color)] p-3 text-[10px] md:block">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-blue-subtle)] text-[var(--accent-blue)]">
              <Shield className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                Investigation
              </div>
              <div className="text-[var(--text-muted)]">gemma4:e4b</div>
            </div>
          </div>
          <p className="leading-relaxed text-[var(--text-secondary)]">
            Source 10.0.0.55 shows coordinated SSH brute force. Recommend
            temporary ban + review auth logs for lateral movement.
          </p>
        </div>
      </div>
    </MockChrome>
  );
}

export function MockHealthDashboard() {
  return (
    <MockChrome title="dashboard · stack health">
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {[
          { l: "ES", v: "ok", icon: Database },
          { l: "Ollama", v: "ok", icon: CpuLike },
          { l: "MCP", v: "ok", icon: Server },
          { l: "API", v: "ok", icon: Activity },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/40 p-2.5"
          >
            <s.icon className="mb-1 h-3.5 w-3.5 text-[var(--accent-blue)]" />
            <div className="text-[10px] text-[var(--text-muted)]">{s.l}</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-green)]">
              <CheckCircle2 className="h-3 w-3" />
              {s.v}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border-color)] px-3 pb-3">
        <div className="flex h-16 items-end gap-1">
          {[40, 55, 48, 72, 65, 80, 58, 90, 70, 85, 62, 78].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-[var(--accent-blue)]/80"
              style={{ height: `${h}%`, opacity: 0.45 + (i % 3) * 0.15 }}
            />
          ))}
        </div>
        <div className="mt-1 text-center font-mono text-[9px] text-[var(--text-muted)]">
          request volume · last 12h
        </div>
      </div>
    </MockChrome>
  );
}

function CpuLike({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

export function MockAlertsList() {
  return (
    <MockChrome title="threat stream">
      <div className="space-y-2 p-3">
        {[
          { i: Bell, t: "Brute force", s: "HIGH" },
          { i: AlertTriangle, t: "Malware hit", s: "CRIT" },
          { i: Shield, t: "Policy drift", s: "MED" },
        ].map((a) => (
          <div
            key={a.t}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-2.5 py-2"
          >
            <a.i className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            <span className="flex-1 text-[11px] font-medium text-[var(--text-primary)]">
              {a.t}
            </span>
            <span className="text-[9px] font-bold text-[var(--accent-red)]">
              {a.s}
            </span>
          </div>
        ))}
      </div>
    </MockChrome>
  );
}

export function MockNlpQuery() {
  return (
    <MockChrome title="natural language query">
      <div className="space-y-2 p-3 text-[11px]">
        <div className="rounded-xl bg-[var(--accent-blue-subtle)] px-3 py-2 text-[var(--text-primary)]">
          Which IPs look malicious in the last 24h and why?
        </div>
        <div className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-[var(--text-secondary)]">
          Top source: <span className="font-mono text-[var(--accent-blue)]">10.0.0.55</span>{" "}
          — SSH brute force with rising failure rate. Correlated with 3 hosts.
        </div>
      </div>
    </MockChrome>
  );
}
