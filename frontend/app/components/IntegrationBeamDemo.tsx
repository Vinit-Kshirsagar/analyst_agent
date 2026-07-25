"use client";

import React, { useRef } from "react";
import { User, Shield, Server, Database, Cpu } from "lucide-react";
import { AnimatedBeam } from "./ui/animated-beam";
import { cn } from "@/lib/utils";

export default function IntegrationBeamDemo({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const gatewayRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<HTMLDivElement>(null);
  const ollamaRef = useRef<HTMLDivElement>(null);
  const mcpRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full min-h-[160px] w-full items-center justify-center overflow-hidden rounded-xl bg-transparent p-3 sm:p-4",
        className
      )}
    >
      <div className="flex h-full w-full max-w-xl flex-row items-center justify-between gap-6">
        
        {/* User Node */}
        <div className="flex flex-col items-center gap-2">
          <div
            ref={userRef}
            className="z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--accent-blue)] bg-[var(--bg-card)] p-3 shadow-lg"
          >
            <User className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] font-mono">SOC Analyst</span>
        </div>

        {/* Central Gateway Node */}
        <div className="flex flex-col items-center gap-2">
          <div
            ref={gatewayRef}
            className="z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--accent-green)] bg-[var(--bg-card)] p-3 shadow-xl"
          >
            <Shield className="h-8 w-8 text-[var(--accent-green)]" />
          </div>
          <span className="text-[11px] font-semibold text-[var(--accent-green)] font-mono">FastAPI Gateway</span>
        </div>

        {/* Microservices Cluster */}
        <div className="flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              ref={esRef}
              className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--accent-blue)] bg-[var(--bg-card)] p-2.5 shadow-md"
            >
              <Database className="h-5 w-5 text-[var(--accent-blue)]" />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Elasticsearch :9200</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              ref={ollamaRef}
              className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--accent-orange)] bg-[var(--bg-card)] p-2.5 shadow-md"
            >
              <Cpu className="h-5 w-5 text-[var(--accent-orange)]" />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Ollama (gemma4:e4b)</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              ref={mcpRef}
              className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--accent-cyan)] bg-[var(--bg-card)] p-2.5 shadow-md"
            >
              <Server className="h-5 w-5 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">Elastic MCP :8080</span>
          </div>
        </div>

      </div>

      {/* Bi-directional Beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={userRef}
        toRef={gatewayRef}
        duration={3}
        gradientStartColor="#3B82F6"
        gradientStopColor="#10B981"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gatewayRef}
        toRef={userRef}
        duration={3}
        reverse
        gradientStartColor="#10B981"
        gradientStopColor="#3B82F6"
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gatewayRef}
        toRef={esRef}
        duration={3.5}
        gradientStartColor="#10B981"
        gradientStopColor="#3B82F6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gatewayRef}
        toRef={ollamaRef}
        duration={3.5}
        gradientStartColor="#10B981"
        gradientStopColor="#F59E0B"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gatewayRef}
        toRef={mcpRef}
        duration={3.5}
        gradientStartColor="#10B981"
        gradientStopColor="#06B6D4"
      />
    </div>
  );
}
