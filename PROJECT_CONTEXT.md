# PROJECT_CONTEXT

Living working memory for the Autonomous Security Agent. Updated when milestones complete.

## Current implementation phase

**Phase 0 — Foundation & Environment Setup: COMPLETE (verified)**

## Current sprint

- Host Ollama + optional remote share for M1 teammate (LangGraph/MCP owner)
- Prepare Phase 1: LangGraph agent + MCP client + tool registry

## What exists now (implementation)

| Component | State |
| --- | --- |
| Docker Compose 4-service stack | Running: elasticsearch, mcp-server, backend, frontend |
| Backend FastAPI skeleton | `/health`, `/debug` only; CORS for Next.js `:3000` |
| Next.js frontend skeleton | Status page at `:3000` (no chat UI) |
| Official Elastic MCP | HTTP `:8080`, `/ping` → `Ready` |
| Ollama + `gemma4:e4b` | **Host process**; backend uses `host.docker.internal:11434` |
| Seed data | Index `alerts-security`, 200 docs, deterministic IDs `seed-alert-####` |

## Recently completed

- Project scaffolding: `docker/`, `backend/`, `frontend/`, seed scripts
- Healthcheck-gated compose (fix for “container started ≠ app ready”)
- MCP healthcheck fixed (image has no `curl`; use `pidof`)
- Ollama removed from Compose; host Ollama + `host.docker.internal` (team-friendly)
- `scripts/dev-up.sh` preflight; remote `OLLAMA_URL` + optional Cloudflare share script
- Project markdown/`docs/` trackable in git (removed blanket `*.md` ignore)
- Phase 0 verification: all services healthy; backend `/health` overall `healthy`

## Current blockers

None for Phase 0.

## Known issues

- ES cluster often **yellow** on single-node (replica unassigned) — expected locally
- Backend `/health` is `degraded` if host Ollama is stopped or `gemma4:e4b` missing
- Docker Desktop RAM may cap containers below compose `mem_limit` values if VM memory is low
- Git: repo has **no commits yet** (all files untracked)

## Current branch

`main` (no commits)

## Next priorities

1. Phase 1: MCP client, Tool Registry, Context Builder, LangGraph (Planner → Router → Executor → Observer → Finalizer)
2. Wire agent invocation paths on backend (still no full product chat UI until Phase 3)
3. First git commit of Phase 0 baseline

## Key URLs (local)

| Surface | URL |
| --- | --- |
| Next.js status UI | http://localhost:3000 |
| Backend health | http://localhost:8000/health |
| Backend debug | http://localhost:8000/debug |
| Elasticsearch | http://localhost:9200 |
| MCP ping | http://localhost:8080/ping |
| Ollama API | http://localhost:11434 |

## Documentation map

- **Index:** [docs/README.md](./docs/README.md)
- **Living (as built):** [docs/current/](./docs/current/)
- **Product PRD:** [docs/product/requirements.md](./docs/product/requirements.md)
- **Design architecture:** [docs/architecture/system-architecture.md](./docs/architecture/system-architecture.md)
- **Phase plans / setup script:** [docs/engineering/](./docs/engineering/)
- **Future / hardening:** [docs/planning/](./docs/planning/)
- **Historical all-in-one PRD:** [docs/archive/full-prd-technical-design-v2.md](./docs/archive/full-prd-technical-design-v2.md)
