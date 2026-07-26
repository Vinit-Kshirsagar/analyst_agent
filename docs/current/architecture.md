# Architecture (as implemented)

Implementation-aligned. Target product layers beyond Phase 0 are noted as **planned**.

## System overview (Phase 0 live)

```text
Next.js (:3000)  status page only          [Docker]
    │  REST (GET /health)
    ▼
FastAPI (:8000)  skeleton                  [Docker]
    GET /health  → real checks for ES, Ollama, MCP
    GET /debug   → phase placeholder
    │
    ├─► Elasticsearch (:9200)              [Docker]  index alerts-security
    ├─► MCP Server (:8080)                 [Docker]  official Elastic image, HTTP
    └─► Host Ollama (:11434)               [HOST]    gemma4:e4b via host.docker.internal
```

## Target product stack (Phase 1+)

```text
Next.js
  REST + SSE
FastAPI
  Context Builder + Session Manager
  LangGraph: Planner → Router → Executor → Observer → Finalizer
    Tool Registry
      MCP Client
        MCP Server
          Elasticsearch
```

Ollama/`gemma4:e4b` remains the local LLM side path.

## Folder structure (repo)

```text
backend/
  app/main.py           # Phase 0 API
  data/generate_logs.py
  data/import_logs.py
  Dockerfile
  requirements.txt
frontend/
  app/page.tsx          # Phase 0 status UI
  app/layout.tsx
  Dockerfile
  package.json
docker/
  docker-compose.yml
  .env                  # version pins
docs/
  current/              # living implementation docs
  product|architecture|design|engineering|planning|archive/
```

## Component hierarchy (now)

| Layer | Implementation status |
| --- | --- |
| UI | Next.js status page — **done** |
| API | FastAPI health/debug — **done** |
| Session / Context / LangGraph | **not built** (Phase 1) |
| Tool Registry / MCP Client | **not built** (Phase 1) |
| MCP Server | Elastic container — **done** |
| Elasticsearch + seed | **done** |
| Ollama model serve | **done** |

## Data flow (Phase 0)

1. Browser opens Next.js status page
2. User clicks **Check backend health**
3. Browser `fetch` → `http://localhost:8000/health`
4. Backend pings ES, lists Ollama tags, GETs MCP `/ping`
5. JSON returned to UI

## Data flow (planned chat)

1. Next.js POST `/api/chat` or SSE `/api/chat/stream`
2. Session Manager + Context Builder
3. LangGraph plan/route/execute/observe
4. MCP tools → Elasticsearch
5. Streamed response to UI

## Infrastructure

- Network: `agent-network` (bridge) — 4 Docker services
- Volumes: `elasticsearch-data` (named)
- Ollama on host; backend `OLLAMA_URL=http://host.docker.internal:11434`
- Health-gated `depends_on` for backend (ES + MCP) and frontend (backend)

## Design decisions

See [DECISIONS.md](../../DECISIONS.md).
