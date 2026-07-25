# Autonomous Security Agent

Local-first AI assistant for SOC analysts: natural language over security logs via **FastAPI**, **LangGraph** (Phase 1+), **MCP**, **Elasticsearch**, and **Ollama (`gemma4:e4b`)**. UI: **Next.js**.

> **Current milestone:** Phase 0 (foundation) is implemented and verified. Agent chat is not built yet.

## Quick start

### Prerequisites

- Docker Desktop / Engine + Compose plugin
- Git, Python 3.11+ (for host-side seed scripts if desired)
- Optional: host Ollama with `gemma4:e4b` already pulled (recommended)
- 16GB+ RAM recommended; raise Docker Desktop memory if possible

### Run the stack

```bash
# from repo root
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

If host Ollama is running, quit it first (port `11434` / model dir conflict). Compose mounts `${HOME}/.ollama` into the Ollama container.

### Verify Phase 0

```bash
curl -s http://localhost:8000/health | python3 -m json.tool   # expect "healthy"
curl -s http://localhost:8080/ping                            # expect Ready
curl -s http://localhost:11434/api/tags                       # expect gemma4:e4b
open http://localhost:3000                                    # Next.js status page
```

### Seed sample security data (idempotent)

```bash
# via backend container (has elasticsearch Python client)
docker compose -f docker/docker-compose.yml --env-file docker/.env exec backend \
  python -c "print('use backend/data scripts or re-run known seed')"
```

Host-side (if `elasticsearch` is installed for your Python):

```bash
python3 backend/data/generate_logs.py
ELASTICSEARCH_URL=http://localhost:9200 python3 backend/data/import_logs.py
# run import twice — document count must stay the same
```

Index: **`alerts-security`**, IDs: **`seed-alert-0000`…**

## Ports

| Service | Port |
| --- | --- |
| Next.js frontend | 3000 |
| FastAPI backend | 8000 |
| MCP server | 8080 |
| Elasticsearch | 9200 |
| Ollama | 11434 |

## Folder overview

```text
backend/          FastAPI app + seed scripts
frontend/         Next.js App Router (status page in Phase 0)
docker/           docker-compose.yml + .env pins
docs/             Grouped docs (see docs/README.md)
PROJECT_CONTEXT.md
TODO.md
DECISIONS.md
```

## Documentation

Start at **[docs/README.md](./docs/README.md)** (index of all groups).

| File | Purpose |
| --- | --- |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Current phase, blockers, next steps |
| [TODO.md](./TODO.md) | Backlog and completed work |
| [DECISIONS.md](./DECISIONS.md) | Architecture decisions (ADR) |
| [docs/current/architecture.md](./docs/current/architecture.md) | System as built |
| [docs/current/deployment.md](./docs/current/deployment.md) | Compose, healthchecks, volumes |
| [docs/current/api.md](./docs/current/api.md) | Implemented API endpoints |
| [docs/current/roadmap.md](./docs/current/roadmap.md) | Phases 0–5 status |

Docs are grouped: `current/`, `product/`, `architecture/`, `design/`, `engineering/`, `planning/`, `archive/`.

## Demo (Phase 0)

1. Stack up and healthy
2. Open http://localhost:3000 → **Check backend health**
3. Confirm ES has 200 seeded alerts

## Next

Phase 1: MCP client + LangGraph agent workflow (no full chat UI yet).
