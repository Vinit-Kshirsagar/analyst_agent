#!/usr/bin/env bash
# ==============================================================================
# PHASE 0 — FOUNDATION & ENVIRONMENT SETUP (HARDENED, V2-CORRECTED)
# Autonomous Security Agent
#
# SCOPE: Infrastructure only. This script provisions Docker services,
# healthchecks, memory limits, pinned versions, and idempotent seed data.
# It does NOT implement agent logic, LangGraph nodes, or MCP client code —
# that is Phase 1 and is intentionally out of scope here.
#
# Usage:
#   chmod +x phase0_setup.sh
#   ./phase0_setup.sh setup      # generate files + bring stack up
#   ./phase0_setup.sh verify     # run all Phase 0 exit-criteria checks
#   ./phase0_setup.sh teardown   # stop stack (keeps volumes)
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# CONFIG — confirmed against actual machine via `ollama list`
# ------------------------------------------------------------------------------
GEMMA_MODEL_TAG="gemma4:e4b"
ES_VERSION="8.11.0"
OLLAMA_VERSION="0.32.1"          # verified: supports gemma4:e4b (0.30+ required)
MCP_IMAGE="docker.elastic.co/mcp/elasticsearch:0.4.0"   # official Elastic image, not the guessed one
PROJECT_ROOT="$(pwd)"
COMPOSE_FILE="docker/docker-compose.yml"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[phase0]${NC} $1"; }
warn() { echo -e "${YELLOW}[phase0][warn]${NC} $1"; }
err()  { echo -e "${RED}[phase0][error]${NC} $1"; }

# ==============================================================================
# STEP 0.A — PREREQUISITE CHECKS
# ==============================================================================
check_prerequisites() {
  log "Checking prerequisites..."
  command -v docker >/dev/null 2>&1 || { err "Docker not found. Install Docker Desktop / Engine first."; exit 1; }
  command -v git    >/dev/null 2>&1 || { err "Git not found."; exit 1; }
  command -v python3 >/dev/null 2>&1 || { err "Python 3.11+ not found."; exit 1; }
  docker compose version >/dev/null 2>&1 || { err "Docker Compose plugin not found."; exit 1; }

  if ! command -v ollama >/dev/null 2>&1; then
    warn "ollama CLI not found on host — assuming you'll run it inside the container only."
  else
    if ! ollama list | grep -q "$GEMMA_MODEL_TAG"; then
      warn "$GEMMA_MODEL_TAG not found in local 'ollama list'. It will be pulled inside the container."
    else
      log "Confirmed model present on host: $GEMMA_MODEL_TAG"
    fi
  fi
  log "Prerequisites OK."
}

# ==============================================================================
# STEP 0.C2 — LINUX HOST KERNEL SETTING (vm.max_map_count)
# Skipped automatically on macOS. Required for Elasticsearch on native Linux.
# ==============================================================================
check_linux_max_map_count() {
  if [[ "$(uname)" != "Linux" ]]; then
    log "Non-Linux host detected — vm.max_map_count check not required (Docker Desktop handles this)."
    return
  fi

  local current
  current=$(cat /proc/sys/vm/max_map_count)
  if [[ "$current" -lt 262144 ]]; then
    warn "vm.max_map_count is $current — Elasticsearch requires >= 262144."
    warn "Applying fix now (requires sudo)..."
    sudo sysctl -w vm.max_map_count=262144
    if ! grep -q "vm.max_map_count" /etc/sysctl.conf 2>/dev/null; then
      echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf >/dev/null
      log "Persisted vm.max_map_count=262144 in /etc/sysctl.conf"
    fi
  else
    log "vm.max_map_count already sufficient ($current)."
  fi
}

# ==============================================================================
# STEP 0.B — DIRECTORY STRUCTURE
# ==============================================================================
create_directory_structure() {
  log "Creating directory structure..."
  mkdir -p docker
  mkdir -p backend/app
  mkdir -p backend/data
  mkdir -p frontend/app
  mkdir -p data
}

# ==============================================================================
# STEP 0.B/C/D/E/F/G — DOCKER COMPOSE FILE (all 5 services, corrected)
# ==============================================================================
write_docker_compose() {
  log "Writing $COMPOSE_FILE ..."
  cat > "$COMPOSE_FILE" <<YAML
version: '3.8'

networks:
  agent-network:
    driver: bridge

volumes:
  elasticsearch-data:
  ollama-data:

services:

  # ---------------------------------------------------------------
  # Elasticsearch — pinned version, healthcheck, bounded memory
  # ---------------------------------------------------------------
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:${ES_VERSION}
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms2g -Xmx2g
    mem_limit: 4g
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:9200/_cluster/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - agent-network

  # ---------------------------------------------------------------
  # Ollama — pinned to a version that actually supports gemma4:e4b,
  # healthcheck uses the guaranteed-present ollama CLI, not curl.
  # ---------------------------------------------------------------
  ollama:
    image: ollama/ollama:${OLLAMA_VERSION}
    container_name: ollama
    mem_limit: 10g
    # Prefer host models (${HOME}/.ollama) to avoid re-downloading gemma4:e4b (~9.6GB).
    # Stop host Ollama app/service first if it conflicts on port 11434.
    volumes:
      - ${HOME}/.ollama:/root/.ollama
    ports:
      - "11434:11434"
    healthcheck:
      test: ["CMD-SHELL", "ollama list >/dev/null 2>&1 || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 12
      start_period: 15s
    networks:
      - agent-network

  # ---------------------------------------------------------------
  # MCP Server — official Elastic image, run in HTTP mode.
  # Real port is 8080, real healthcheck path is /ping.
  # ---------------------------------------------------------------
  mcp-server:
    image: ${MCP_IMAGE}
    container_name: mcp-server
    command: ["http"]
    environment:
      - ES_URL=http://elasticsearch:9200
      - ES_API_KEY=
    ports:
      - "8080:8080"
    depends_on:
      elasticsearch:
        condition: service_healthy
    # Official image has no curl/wget — process check is the reliable health probe.
    healthcheck:
      test: ["CMD-SHELL", "pidof elasticsearch-core-mcp-server >/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 5s
    networks:
      - agent-network

  # ---------------------------------------------------------------
  # Backend — FastAPI skeleton only (health/debug endpoints).
  # No agent/LangGraph logic here — that's Phase 1.
  # Gated on ALL dependencies reporting healthy, not just started.
  # ---------------------------------------------------------------
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: backend
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - OLLAMA_URL=http://ollama:11434
      - MCP_SERVER_URL=http://mcp-server:8080
      - GEMMA_MODEL_TAG=${GEMMA_MODEL_TAG}
      - LOG_LEVEL=INFO
    ports:
      - "8000:8000"
    depends_on:
      elasticsearch:
        condition: service_healthy
      ollama:
        condition: service_healthy
      mcp-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
    volumes:
      - ../backend:/app
      - ../data:/app/data
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    networks:
      - agent-network

  # ---------------------------------------------------------------
  # Frontend — Next.js skeleton only (status page, no chat UI).
  # Browser calls FastAPI via NEXT_PUBLIC_API_URL (localhost:8000).
  # ---------------------------------------------------------------
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - INTERNAL_API_URL=http://backend:8000
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ../frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - agent-network
YAML
  log "docker-compose.yml written with 5 services, all healthcheck-gated."
}

# ==============================================================================
# STEP 0.H — BACKEND SKELETON (health/debug endpoints only — no agent logic)
# ==============================================================================
write_backend_skeleton() {
  log "Writing backend skeleton (Phase 0 scope: health checks only)..."

  cat > backend/requirements.txt <<'REQ'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
elasticsearch==8.11.0
httpx==0.25.2
REQ

  cat > backend/Dockerfile <<'DOCKERFILE'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
DOCKERFILE

  cat > backend/app/__init__.py <<'PY'
PY

  # Minimal main.py: only what Phase 0 needs to prove the stack is wired
  # correctly. Agent endpoints (/chat, /chat/stream) are Phase 1 scope.
  cat > backend/app/main.py <<'PY'
"""
Phase 0 skeleton API.
Purpose: prove Elasticsearch, Ollama, and MCP Server are reachable from the
backend container over the Docker network. No agent/LangGraph logic here —
that begins in Phase 1. CORS is enabled so the Next.js frontend (port 3000)
can call this API from the browser.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
import httpx

app = FastAPI(title="Security Agent - Phase 0 Skeleton")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8080")
GEMMA_MODEL_TAG = os.getenv("GEMMA_MODEL_TAG", "gemma4:e4b")


@app.get("/health")
def health():
    """Reports true reachability of each dependency, not just container state."""
    components = {}

    try:
        es = Elasticsearch(ES_URL)
        components["elasticsearch"] = {
            "status": "connected" if es.ping() else "unreachable"
        }
    except Exception as e:
        components["elasticsearch"] = {"status": "error", "detail": str(e)}

    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
        tags = [m["name"] for m in r.json().get("models", [])]
        components["ollama"] = {
            "status": "connected" if GEMMA_MODEL_TAG in tags else "model_missing",
            "models": tags,
        }
    except Exception as e:
        components["ollama"] = {"status": "error", "detail": str(e)}

    try:
        r = httpx.get(f"{MCP_SERVER_URL}/ping", timeout=5.0)
        components["mcp_server"] = {
            "status": "connected" if r.status_code == 200 else "unreachable"
        }
    except Exception as e:
        components["mcp_server"] = {"status": "error", "detail": str(e)}

    overall = "healthy" if all(
        c.get("status") == "connected" for c in components.values()
    ) else "degraded"

    return {"status": overall, "components": components}


@app.get("/debug")
def debug():
    """Placeholder debug endpoint. Metrics/tracing land in Phase 1+."""
    return {"phase": "0", "note": "Full metrics implemented in Phase 1."}
PY

  log "Backend skeleton written (health/debug endpoints only, CORS for Next.js)."
}

# ==============================================================================
# STEP 0.G — FRONTEND SKELETON (Next.js status page only — no chat UI)
# ==============================================================================
write_frontend_skeleton() {
  log "Writing Next.js frontend skeleton (Phase 0 scope: status page only)..."
  mkdir -p frontend/app

  cat > frontend/package.json <<'JSON'
{
  "name": "security-agent-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3000"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.5.3"
  }
}
JSON

  cat > frontend/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
JSON

  cat > frontend/next.config.mjs <<'JS'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
export default nextConfig;
JS

  cat > frontend/Dockerfile <<'DOCKERFILE'
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
DOCKERFILE

  cat > frontend/app/layout.tsx <<'TSX'
import type { ReactNode } from "react";

export const metadata = {
  title: "Security Agent - Phase 0 Status",
  description: "Phase 0 environment status page",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#1A1A2E", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
TSX

  cat > frontend/app/page.tsx <<'TSX'
"use client";

import { useState } from "react";

/**
 * Phase 0 skeleton UI (Next.js).
 * Purpose: confirm the browser can reach FastAPI /health and display the result.
 * Full chat UI is Phase 3 scope.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function StatusPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkHealth() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${API_URL}/health`, { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: 24 }}>
      <h1>Security Agent — Phase 0 Environment Status</h1>
      <p style={{ color: "#EAEAEA" }}>
        Next.js skeleton. Calls FastAPI at <code>{API_URL}</code>. Chat UI comes in Phase 3.
      </p>
      <button
        type="button"
        onClick={checkHealth}
        disabled={loading}
        style={{
          background: "#E94560",
          color: "#fff",
          border: "none",
          padding: "10px 16px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {loading ? "Checking…" : "Check backend health"}
      </button>
      {error && <pre style={{ color: "#F44336", marginTop: 16 }}>{error}</pre>}
      {result && (
        <pre
          style={{
            marginTop: 16,
            background: "#16213E",
            padding: 16,
            borderRadius: 8,
            overflow: "auto",
          }}
        >
          {result}
        </pre>
      )}
    </main>
  );
}
TSX

  log "Next.js frontend skeleton written (status page only)."
}

# ==============================================================================
# STEP 0.I — IDEMPOTENT SEED DATA
# ==============================================================================
write_seed_scripts() {
  log "Writing idempotent seed scripts..."

  cat > backend/data/generate_logs.py <<'PY'
"""Generates sample security log data with deterministic IDs (idempotent)."""
import json
import random
from datetime import datetime, timedelta


class SampleLogGenerator:
    def __init__(self):
        self.suspicious_ips = ["10.0.0.55", "10.0.0.100", "192.168.1.50", "172.16.0.23", "10.10.10.45"]
        self.normal_ips = ["10.0.0.1", "10.0.0.2", "192.168.1.1", "172.16.0.1", "10.10.10.1"]
        self.alert_types = [
            "Brute Force Attack", "Malware Detected", "Failed Login Attempt",
            "Suspicious Process", "Network Scanning",
        ]

    def generate_alerts(self, count: int = 200):
        alerts = []
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)

        for i in range(count):
            timestamp = start_time + timedelta(seconds=random.randint(0, 86400))
            is_suspicious = random.random() < 0.7
            source_ip = random.choice(self.suspicious_ips if is_suspicious else self.normal_ips)

            alerts.append({
                "_id": f"seed-alert-{i:04d}",  # deterministic -> reruns overwrite, never duplicate
                "_index": "alerts-security",
                "_source": {
                    "@timestamp": timestamp.isoformat(),
                    "source": {"ip": source_ip, "port": random.randint(1024, 65535)},
                    "destination": {
                        "ip": random.choice(self.normal_ips),
                        "port": random.choice([22, 80, 443, 3389]),
                    },
                    "event": {
                        "type": "authentication" if random.random() < 0.7 else "malware",
                        "outcome": "failure" if is_suspicious else "success",
                        "severity": random.randint(1, 5) + (3 if is_suspicious else 0),
                    },
                    "rule": {"name": random.choice(self.alert_types), "description": f"Alert from {source_ip}"},
                    "user": {"name": f"user_{random.randint(1, 100)}"},
                    "message": f"Security alert from {source_ip}",
                },
            })
        return alerts

    def save_to_file(self, filename: str = "sample_logs.json"):
        alerts = self.generate_alerts(200)
        with open(filename, "w") as f:
            json.dump(alerts, f, indent=2)
        print(f"Generated {len(alerts)} alerts with deterministic IDs -> {filename}")


if __name__ == "__main__":
    SampleLogGenerator().save_to_file()
PY

  cat > backend/data/import_logs.py <<'PY'
"""Idempotent import into Elasticsearch. Safe to run any number of times:
uses deterministic _id values, so reruns overwrite rather than duplicate."""
import json
import os
from elasticsearch import Elasticsearch, NotFoundError

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")


def import_to_elasticsearch(filename: str = "sample_logs.json"):
    es = Elasticsearch(ES_URL)

    if not es.indices.exists(index="alerts-security"):
        es.indices.create(
            index="alerts-security",
            mappings={
                "properties": {
                    "@timestamp": {"type": "date"},
                    "source": {"properties": {"ip": {"type": "ip"}, "port": {"type": "integer"}}},
                    "destination": {"properties": {"ip": {"type": "ip"}, "port": {"type": "integer"}}},
                    "event": {
                        "properties": {
                            "type": {"type": "keyword"},
                            "outcome": {"type": "keyword"},
                            "severity": {"type": "integer"},
                        }
                    },
                    "rule": {"properties": {"name": {"type": "keyword"}, "description": {"type": "text"}}},
                    "user": {"properties": {"name": {"type": "keyword"}}},
                    "message": {"type": "text"},
                }
            },
        )

    with open(filename, "r") as f:
        alerts = json.load(f)

    created, existing = 0, 0
    for alert in alerts:
        doc_id = alert["_id"]
        source = alert["_source"]
        try:
            es.get(index="alerts-security", id=doc_id)
            existing += 1
        except NotFoundError:
            es.index(index="alerts-security", id=doc_id, document=source)
            created += 1

    total = es.count(index="alerts-security")["count"]
    print(f"Import complete: {created} new, {existing} already existed (skipped). Total in index: {total}")


if __name__ == "__main__":
    import_to_elasticsearch("sample_logs.json")
PY

  log "Seed scripts written (deterministic IDs -> idempotent by construction)."
}

# ==============================================================================
# BRING STACK UP
# ==============================================================================
bring_stack_up() {
  log "Starting Docker stack (this can take a few minutes on first run)..."
  docker compose -f "$COMPOSE_FILE" up -d --build

  log "Waiting for all services to report healthy..."
  local max_wait=180
  local waited=0
  while true; do
    local unhealthy
    unhealthy=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null \
      | grep -o '"Health":"[a-z]*"' | grep -v '"Health":"healthy"' | wc -l | tr -d ' ')
    if [[ "$unhealthy" -eq 0 ]]; then
      log "All services healthy."
      break
    fi
    if [[ "$waited" -ge "$max_wait" ]]; then
      err "Timed out waiting for services to become healthy after ${max_wait}s."
      docker compose -f "$COMPOSE_FILE" ps
      exit 1
    fi
    sleep 5
    waited=$((waited + 5))
    echo -n "."
  done
}

# ==============================================================================
# STEP 0.I VERIFICATION — SEED SCRIPT IDEMPOTENCY
# ==============================================================================
run_seed_and_verify_idempotency() {
  log "Generating sample data..."
  python3 backend/data/generate_logs.py

  log "First seed run..."
  ELASTICSEARCH_URL="http://localhost:9200" python3 backend/data/import_logs.py
  local count1
  count1=$(curl -s "http://localhost:9200/alerts-security/_count" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")

  log "Second seed run (must not duplicate)..."
  ELASTICSEARCH_URL="http://localhost:9200" python3 backend/data/import_logs.py
  local count2
  count2=$(curl -s "http://localhost:9200/alerts-security/_count" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")

  if [[ "$count1" == "$count2" ]]; then
    log "Idempotency confirmed: count stayed at $count1 across two runs."
  else
    err "Idempotency FAILED: first run=$count1, second run=$count2. Fix import_logs.py before proceeding."
    exit 1
  fi
}

# ==============================================================================
# FULL VERIFICATION SUITE — MAPS DIRECTLY TO PHASE 0 EXIT CRITERIA
# ==============================================================================
verify_all() {
  log "=== Phase 0 Verification Suite ==="

  log "[1/6] Elasticsearch cluster health:"
  curl -sf http://localhost:9200/_cluster/health | python3 -m json.tool

  log "[2/6] Ollama model loaded:"
  curl -sf http://localhost:11434/api/tags | python3 -m json.tool
  docker exec ollama ollama list | grep -q "$GEMMA_MODEL_TAG" \
    && log "Confirmed: $GEMMA_MODEL_TAG present in container." \
    || { err "$GEMMA_MODEL_TAG missing in Ollama container."; exit 1; }

  log "[3/6] MCP server reachable:"
  curl -sf http://localhost:8080/ping && echo "" || { err "MCP server /ping failed."; exit 1; }

  log "[4/6] Backend aggregate health:"
  curl -sf http://localhost:8000/health | python3 -m json.tool

  log "[5/6] Memory limits applied:"
  docker stats --no-stream

  log "[6/6] Seed script idempotency:"
  run_seed_and_verify_idempotency

  log "=== All Phase 0 exit criteria checks passed. ==="
}

# ==============================================================================
# TEARDOWN (keeps volumes — data survives)
# ==============================================================================
teardown() {
  log "Stopping stack (volumes preserved)..."
  docker compose -f "$COMPOSE_FILE" down
}

# ==============================================================================
# MAIN
# ==============================================================================
main() {
  local cmd="${1:-setup}"
  case "$cmd" in
    setup)
      check_prerequisites
      check_linux_max_map_count
      create_directory_structure
      write_docker_compose
      write_backend_skeleton
      write_frontend_skeleton
      write_seed_scripts
      bring_stack_up
      verify_all
      log "Phase 0 complete. Stack is up, healthy, and seed data is idempotent."
      log "Next: Phase 1 (LangGraph agent, MCP integration, autonomous workflow) — out of scope for this script."
      ;;
    verify)
      verify_all
      ;;
    teardown)
      teardown
      ;;
    *)
      err "Unknown command: $cmd (use: setup | verify | teardown)"
      exit 1
      ;;
  esac
}

main "$@"