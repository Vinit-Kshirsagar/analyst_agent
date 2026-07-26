# TODO

Engineering backlog. Completed work is moved, never deleted.

## Backlog

- [ ] Phase 1: MCP client connection to `mcp-server:8080`
- [ ] Phase 1: Tool Registry over MCP-discovered tools
- [ ] Phase 1: Context Builder + Session Manager
- [ ] Phase 1: LangGraph graph (Planner → Router → Executor → Observer → Finalizer)
- [ ] Phase 1: Integrate `gemma4:e4b` via host Ollama for plan/observe
- [ ] Phase 2: `/api/chat` and `/api/chat/stream` (SSE)
- [ ] Phase 2: Enrich `/health` and `/debug` with metrics
- [ ] Phase 3: Full Next.js chat UI (messages, SSE client, design system)
- [ ] Phase 4: Performance, edge cases, demo polish
- [ ] Initial git commit of Phase 0 baseline
- [ ] Optional: `.env.example` for docker pins without committing local-only overrides
- [ ] Optional: Compose profile `full` with Ollama container for CI machines without host Ollama

## Current Sprint

- [x] Phase 0 foundation stack
- [x] Living documentation (project-documentation skill)
- [x] Host-only Ollama (remove Ollama container from Compose)
- [x] `scripts/dev-up.sh` Ollama preflight + compose
- [x] Un-ignore project markdown / docs for private team git
- [x] Remote Ollama path for M1 teammate (tunnel script + docs)
- [ ] Start Phase 1 agent core

## In Progress

- (none)

## Completed

### Phase 0 — Foundation (2026-07-25)

- [x] Docker Compose 5 services on `agent-network` (later reduced to 4; see below)
- [x] Pinned images: ES 8.11.0, MCP 0.4.0
- [x] Healthchecks + `depends_on: service_healthy`
- [x] ES mem_limit 4g / JVM heap 2g
- [x] Backend skeleton: FastAPI `/health`, `/debug`, CORS
- [x] Next.js skeleton: status page calling `/health`
- [x] Idempotent seed: `alerts-security`, 200 docs, `seed-alert-####`
- [x] MCP healthcheck without curl (`pidof`)
- [x] Phase 0 verification suite passed
- [x] Reorganized `docs/` into grouped folders with content-based names

### Host Ollama migration (2026-07-26)

- [x] Remove `ollama` service and unused `ollama-data` volume from Compose
- [x] Backend `OLLAMA_URL=http://host.docker.internal:11434` + Linux `extra_hosts`
- [x] Update README / deployment / architecture / tech-stack / DECISIONS

## Bugs

- (none open)

## Technical Debt

- Seed import from host needs `elasticsearch` pip package (or run via backend container)
- Frontend has no Docker healthcheck (process up only)
- Historical `docs/engineering/phase-0-setup-script.md` still describes old Ollama-in-Docker compose (superseded by `docs/current/deployment.md`)

## Future Improvements

- Smaller quantized model option for low-RAM demos
- CI smoke: compose up + health endpoints (with host or profile Ollama)
