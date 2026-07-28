# Phase 0 Implementation: Foundation & Environment Setup

**Status:** ✅ COMPLETE  
**Completion Date:** 2026-07-25  
**Index:** [README.md](./README.md)

---

## 1. Overview

Phase 0 established the infrastructure foundation for the Autonomous Security Agent. The primary objective was to provision a resilient, reproducible, healthcheck-gated local developer environment so subsequent phases could focus entirely on agent reasoning and UI features without infrastructure drift.

### What Phase 0 means in one line

> “We can start the full local stack, check health, and have a place to put security data — no agent yet.”

---

## 2. Implemented Architecture & Services

The system is orchestrated via Docker Compose (`docker/docker-compose.yml`) using fixed image versions and memory limits connected over a shared bridge network (`agent-network`).

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Docker Compose Stack (project: analyst_agent)                            │
│                                                                          │
│  ┌──────────────────────┐    ┌──────────────────────┐                   │
│  │ elasticsearch:8.11.0 │    │ mcp-server:0.4.0     │                   │
│  │ Port 9200 (4GB Limit)│    │ Port 8080 (HTTP mode)│                   │
│  └──────────▲───────────┘    └──────────▲───────────┘                   │
│             │                           │                                │
│  ┌──────────┴───────────────────────────┴───────────┐                    │
│  │ backend (FastAPI / Python 3.11)                  │                    │
│  │ Port 8000 (Healthchecks ES, MCP, Ollama)         │                    │
│  └──────────▲───────────────────────────────────────┘                    │
│             │                                                            │
│  ┌──────────┴───────────────────────────────────────┐                    │
│  │ frontend (Next.js 14 App Router)                 │                    │
│  │ Port 3000 (Status Page UI)                       │                    │
│  └──────────────────────────────────────────────────┘                    │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ (host.docker.internal:11434)
┌──────────────────────────────▼───────────────────────────────────────────┐
│ Host Machine Ollama Runtime                                              │
│ Pinned Model: gemma4:e4b                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Details

| Service | Image / Base | Port | Description & Configuration |
| --- | --- | --- | --- |
| **Elasticsearch** | `docker.elastic.co/elasticsearch/elasticsearch:8.11.0` | `9200` | Single-node security-disabled datastore (`xpack.security.enabled=false`). Bounded to 4GB RAM (`ES_JAVA_OPTS=-Xms2g -Xmx2g`). Healthcheck via `curl -sf http://localhost:9200/_cluster/health`. |
| **MCP Server** | `docker.elastic.co/mcp/elasticsearch:0.4.0` | `8080` | Official Elastic MCP image operating in HTTP mode (`ES_URL=http://elasticsearch:9200`). Healthchecked using `pidof elasticsearch-core-mcp-server` to accommodate the Wolfi base image. |
| **Backend** | `backend/Dockerfile` (Python 3.11) | `8000` | FastAPI skeleton exposing `GET /health` and `GET /debug`. CORS configured for `http://localhost:3000`. Startup gated on `elasticsearch` and `mcp-server` health. |
| **Frontend** | `frontend/Dockerfile` (Node 20 Alpine / Next.js 14) | `3000` | Status dashboard fetching health metrics from backend `/health`. Gated on `backend` health. |
| **Host Ollama** | Host process (`ollama serve`) | `11434` | Runs host-native Ollama for `gemma4:e4b`. Accessible from Docker containers via `host.docker.internal:11434` (with `extra_hosts` enabled for Linux compatibility). |

---

## 3. Key Achievements & Deliverables

1. **Health-Gated Compose Startup:**
   - Replaced simple process creation with `depends_on: condition: service_healthy` across all dependent services to prevent connection refusal during cold starts.

2. **Host-Native Ollama Offloading:**
   - Removed the heavy Ollama container from Docker Compose to reduce RAM consumption (~10GB savings) and eliminate duplicate ~9.6GB model downloads by binding directly to host Ollama.

3. **FastAPI Health & Debug API:**
   - Implemented `GET /health` in `backend/app/main.py` to perform active TCP/HTTP connectivity checks against Elasticsearch (`GET /_cluster/health`), MCP Server (`GET /ping`), and Ollama (`GET /api/tags`).

4. **Next.js Status UI:**
   - Created status dashboard in `frontend/app/page.tsx` displaying real-time health indicators for all stack components.

5. **Idempotent Security Log Seeding:**
   - Built `backend/data/generate_logs.py` and `import_logs.py`.
   - Seeded 200 synthetic security alerts into Elasticsearch index `alerts-security`.
   - Used deterministic document IDs (`seed-alert-0001` through `seed-alert-0200`), guaranteeing idempotency on re-import.

6. **Dev Automation Script:**
   - Created `./scripts/dev-up.sh` preflight script that verifies prerequisites, checks Ollama model readiness, and orchestrates `docker compose up -d --build`.

---

## 4. Key Architectural Decisions (ADRs)

* **Docker Compose Orchestration:** Single local orchestration path ensuring identical network resolution (`elasticsearch:9200`, `mcp-server:8080`) across team environments.
* **Pinned Version Strategy:** Explicit pins for ES (`8.11.0`), MCP (`0.4.0`), and model (`gemma4:e4b`) to prevent version drift.
* **Wolfi Process Healthcheck:** MCP server healthcheck adapted to use `pidof` due to missing `curl` inside Wolfi container image.
* **Host Ollama with `host.docker.internal`:** Decoupled LLM execution from Docker containers for performance and hardware efficiency.

---

## 5. What Phase 0 deliberately did **not** include

- LangGraph / multi-step agent  
- MCP **client** in Python (server container only)  
- Chat API or full chat UI  
- Production auth  

Those start in Phase 1A / 1B.

---

## 6. How to re-verify Phase 0 surface

```bash
./scripts/dev-up.sh   # or compose up
curl -s http://localhost:8000/health | python3 -m json.tool
curl -s http://localhost:8080/ping
open http://localhost:3000
```

Seed + platform Gate 0 today also use Track A scripts (see [phase-1b-a.md](./phase-1b-a.md)).
