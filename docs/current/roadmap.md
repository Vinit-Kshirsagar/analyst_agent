# Roadmap

## Phase 0 — Foundation ✅ COMPLETE

**Status:** Implemented and verified (2026-07-25)

- Docker Compose 4-service stack (ES, MCP, backend, frontend)
- Host Ollama + `gemma4:e4b` via `host.docker.internal`
- Healthchecks + memory limits + pinned images
- FastAPI `/health` + `/debug`
- Next.js status page
- MCP server HTTP
- Idempotent seed → `alerts-security` (200 docs)

## Phase 1 — Core agent workflow

### Phase 1A ✅ COMPLETE

- MCP client + Tool Registry
- Debug MCP endpoints + smoke test
- Shared remote `gemma4:e4b` via host Ollama / Cloudflare tunnel

### Phase 1B 🔜 NEXT

Plan: [docs/engineering/phase-1b-plan.md](../engineering/phase-1b-plan.md)

- Context Builder + Session Manager
- LangGraph: Planner → Router → Executor → Observer → Finalizer
- Gemma via Ollama (`ChatOllama`) for plan/observe
- `POST /debug/agent-run` end-to-end proof

## Phase 2 — API & integration

- Extend FastAPI: `/api/chat`, `/api/chat/stream` (SSE)
- Observability metrics
- Enrich `/health` and `/debug`

## Phase 3 — UI & UX

- Full Next.js chat UI
- SSE streaming display
- Design system applied

## Phase 4 — Optimization & polish

- Latency, edge cases, docs, demo

## Phase 5 — Production hardening (post-MVP)

- Auth, guardrails, evaluation harness, expanded tools (see historical CDR doc)

## Future vision

- Multi-source MCP tools, long-term memory, multi-tenant SOC features
