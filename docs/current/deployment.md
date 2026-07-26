# Deployment (local Phase 0)

## Prerequisites

Ollama is **not** part of Docker Compose.

```bash
cp docker/.env.example docker/.env
```

### Option A — local host Ollama (default)

```bash
# install: https://ollama.com/download
ollama pull gemma4:e4b
ollama serve   # or use the Ollama desktop app
curl -s http://localhost:11434/api/tags   # must include gemma4:e4b
```

### Option B — remote shared Ollama (M1 / low-RAM teammates)

Some machines cannot load `gemma4:e4b` (~9.6GB). Run the model on a stronger teammate machine and point `OLLAMA_URL` at it.

| Role | Runs |
| --- | --- |
| **Ollama host** (stronger Mac) | `ollama serve` + optional Cloudflare tunnel |
| **App teammate** (e.g. M1 LangGraph/MCP work) | Compose stack only; `OLLAMA_URL` → tunnel or Tailscale IP |

**Ollama host:**

```bash
./scripts/share-ollama-tunnel.sh
# brew install cloudflared  # if needed
# share the https URL out-of-band — never commit it
```

**App teammate `docker/.env`:**

```text
OLLAMA_URL=https://XXXX.trycloudflare.com
GEMMA_MODEL_TAG=gemma4:e4b
```

Then `./scripts/dev-up.sh`.

#### Security (important)

- Ollama has **no built-in authentication**.
- Cloudflare **quick tunnels** put a public URL on the open internet for the lifetime of the process.
- Prefer **Tailscale / WireGuard** for ongoing team use (private mesh; set `OLLAMA_URL=http://100.x.y.z:11434`).
- For longer Cloudflare use: named tunnel + **Cloudflare Access** (SSO / one-time PIN).
- Stop the tunnel when the session ends; rotate URLs; do not paste tunnel URLs into git or public issues.

#### Latency

LangGraph will call the LLM many times per turn. A tunnel adds RTT. Acceptable for development; for demos prefer local Ollama on the machine presenting.

## Bring up (recommended)

```bash
./scripts/dev-up.sh
# checks Ollama + model, then compose up --build
# ./scripts/dev-up.sh --down
# ./scripts/dev-up.sh --skip-ollama-check   # emergency only
```

Manual:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

## Tear down

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env down
# keep volumes (ES data survives)
# docker compose ... down -v   # destructive
```

## Services

| Service | Image / build | Host port | Healthcheck |
| --- | --- | --- | --- |
| elasticsearch | `elasticsearch:8.11.0` | 9200 | `curl` cluster health |
| mcp-server | `mcp/elasticsearch:0.4.0` | 8080 | `pidof elasticsearch-core-mcp-server` |
| backend | build `backend/` | 8000 | `curl` `/health` |
| frontend | build `frontend/` | 3000 | (none; process up) |
| **Ollama (host)** | host install | 11434 | not managed by Compose |

## Network

- Name: `agent-network` (bridge)
- Internal URLs: `http://elasticsearch:9200`, `http://mcp-server:8080`, `http://backend:8000`
- Host Ollama from backend: `http://host.docker.internal:11434`
- Backend has `extra_hosts: host.docker.internal:host-gateway` for Linux Docker

## Volumes

| Volume / mount | Purpose |
| --- | --- |
| `elasticsearch-data` | ES persistence |
| Host `~/.ollama` | Model weights (managed by host Ollama only) |

## Environment

### `docker/.env` (local; gitignored)

Copy from `docker/.env.example`:

```text
ES_VERSION=8.11.0
MCP_IMAGE=docker.elastic.co/mcp/elasticsearch:0.4.0
GEMMA_MODEL_TAG=gemma4:e4b
OLLAMA_URL=http://host.docker.internal:11434
# or remote: OLLAMA_URL=https://XXXX.trycloudflare.com
```

### Backend container

| Variable | Example |
| --- | --- |
| `ELASTICSEARCH_URL` | `http://elasticsearch:9200` |
| `OLLAMA_URL` | `http://host.docker.internal:11434` |
| `MCP_SERVER_URL` | `http://mcp-server:8080` |
| `GEMMA_MODEL_TAG` | `gemma4:e4b` |

### Frontend container

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` (browser → host port) |
| `INTERNAL_API_URL` | `http://backend:8000` |

## Health / readiness

- Compose uses `depends_on` + `condition: service_healthy` for backend (ES, MCP) and frontend (backend).
- Ollama is **not** a Compose dependency; FastAPI `GET /health` reports Ollama reachability and whether `gemma4:e4b` is present.
- If host Ollama is down, overall status is `degraded` with `ollama.status` = `error` or `model_missing`.

## Operational notes

1. **Start host Ollama first** (with `gemma4:e4b`) before relying on full `/health`.
2. ES **yellow** on single-node is normal.
3. Do **not** run a second Ollama in Docker while the host instance owns port `11434`.
4. Seed data: index `alerts-security`, 200 docs, idempotent IDs.
5. Teammates on Linux: `host.docker.internal` is provided via Compose `extra_hosts`.

## Migrating from the old 5-service stack

If you previously ran the Ollama container:

```bash
# stop old stack
docker compose -f docker/docker-compose.yml --env-file docker/.env down

# optional: remove unused ollama image/containers
docker rm -f ollama 2>/dev/null || true
docker image rm ollama/ollama:0.32.1 2>/dev/null || true

# ensure host Ollama is up
ollama serve
ollama list   # gemma4:e4b

# bring up 4-service stack
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

## Production

Not implemented. Future: reverse proxy, TLS, read-only ES credentials, metrics (see historical hardening roadmap docs).
