# Autonomous Security Agent

Local-first AI assistant for SOC analysts: natural language over security logs via **FastAPI**, **LangGraph** (Phase 1+), **MCP**, **Elasticsearch**, and **host Ollama (`gemma4:e4b`)**. UI: **Next.js**.

> **Current milestone:** Phase 0 (foundation) is implemented and verified. Agent chat is not built yet.

## Quick start

### Prerequisites

- Docker Desktop / Engine + Compose plugin
- Git, Python 3.11+ (for host-side seed scripts if desired)
- **LLM access** — either:
  - **Local:** host Ollama + `gemma4:e4b` (machines that can run it), or
  - **Remote:** teammate-shared Ollama URL (for M1 / low-RAM laptops — see below)
- 16GB+ RAM recommended if running Ollama locally; raise Docker Desktop memory if possible

### 1. Env file (once)

```bash
cp docker/.env.example docker/.env
# edit docker/.env if you use a remote OLLAMA_URL
```

### 2a. Local Ollama (default — machines that can run `gemma4:e4b`)

```bash
# Install: https://ollama.com/download  (or brew install ollama)
ollama pull gemma4:e4b
ollama serve   # or open the Ollama app
```

### 2b. Start stack (recommended — checks Ollama first)

```bash
# from repo root
./scripts/dev-up.sh
```

This script:

1. Ensures `docker/.env` exists  
2. Probes Ollama (`localhost` for host-gateway URL, or your remote `OLLAMA_URL`)  
3. Confirms model tag `gemma4:e4b`  
4. Runs Compose: **Elasticsearch**, **MCP**, **backend**, **frontend**

Manual equivalent:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

### 2c. Remote shared Ollama (M1 / low-RAM teammate)

If a teammate cannot run `gemma4:e4b` locally (e.g. M1 memory limits), use a stronger machine as the Ollama host:

**On the host machine (has the model):**

```bash
ollama serve
./scripts/share-ollama-tunnel.sh   # needs: brew install cloudflared
# copy the https://….trycloudflare.com URL → share privately (Slack/DM only)
```

**On the M1 / consumer machine:**

```bash
cp docker/.env.example docker/.env
# set in docker/.env:
#   OLLAMA_URL=https://XXXX.trycloudflare.com
./scripts/dev-up.sh
```

They still run **ES + MCP + backend + frontend** locally (needed for LangChain / LangGraph / MCP work). Only the LLM API is remote.

> **Security:** quick tunnels expose Ollama with **no auth**. Use only for short pair sessions, or prefer **Tailscale**. Never commit tunnel URLs. Details: [docs/current/deployment.md](./docs/current/deployment.md).

### Verify Phase 0

```bash
curl -s http://localhost:8000/health | python3 -m json.tool      # expect "healthy" (includes ollama)
curl -s http://localhost:8080/ping                               # expect Ready
open http://localhost:3000                                       # Next.js status page
```

If `/health` shows `ollama` as `error` or `model_missing`, fix local Ollama or the remote `OLLAMA_URL`.

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

| Service | Port | Where it runs |
| --- | --- | --- |
| Next.js frontend | 3000 | Docker |
| FastAPI backend | 8000 | Docker |
| MCP server | 8080 | Docker |
| Elasticsearch | 9200 | Docker |
| Ollama | 11434 | **Host** |

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

1. Host Ollama up with `gemma4:e4b`
2. Stack up and healthy
3. Open http://localhost:3000 → **Check backend health**
4. Confirm ES has 200 seeded alerts

## Next

Phase 1: MCP client + LangGraph agent workflow (no full chat UI yet).
