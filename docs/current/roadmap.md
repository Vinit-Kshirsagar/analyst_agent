# Roadmap

Living phase list. Deep “what we have / limits / next” →  
**[docs/engineering/implementation/CURRENT-STATE-AND-NEXT.md](../engineering/implementation/CURRENT-STATE-AND-NEXT.md)**

---

## Phase 0 — Foundation ✅ COMPLETE

**Status:** Implemented and verified (2026-07-25)

- Docker Compose 4-service stack (ES, MCP, backend, frontend)
- Host Ollama + `gemma4:e4b` via `host.docker.internal`
- Healthchecks + memory limits + pinned images
- FastAPI `/health` + `/debug`
- Next.js status / landing UI
- Seed generators for `alerts-security`

---

## Phase 1A — MCP tools ✅ COMPLETE

**Status:** Implemented and verified (2026-07-27+)

- MCP client (streamable HTTP) + Tool Registry
- Debug: `GET /debug/mcp-tools`, `POST /debug/mcp-call`
- Shared remote `gemma4:e4b` via Cloudflare tunnel (optional)

Docs: [implementation/phase-1a.md](../engineering/implementation/phase-1a.md)

---

## Phase 1B — Agent core ✅ COMPLETE

**Status:** Implemented and verified (2026-07-30)

- Platform: `scripts/seed-alerts.sh`, `scripts/verify-phase1b-platform.sh`
- Session Manager + Context Builder + ChatOllama
- LangGraph: Planner → Router → Executor → Observer → Finalizer
- `POST /debug/agent-run`

Docs: [phase-1b-track-b.md](../engineering/implementation/phase-1b-track-b.md), [phase-1b-a.md](../engineering/implementation/phase-1b-a.md)

---

## Phase 1.5 — Agent reliability ✅ COMPLETE

**Status:** 2026-07-30 — `./scripts/smoke-agent-run.sh` green  

Full write-up: [implementation/phase-1.5.md](../engineering/implementation/phase-1.5.md)

- Hardened TOOL_CALL JSON extract/repair (`app/agent/tool_call.py`)
- Search-arg normalize (`severity: "high"` → `event.severity` range; `event.category` → `event.type`)
- System prompt documents real seed schema + query examples
- Smoke: malware fields, free-form high-severity malware, match_all, empty → 400

### Remaining Phase 1 limitations (ok for Phase 2)

- Sessions still in-memory only  
- No product `/api/chat` or chat UI yet  
- Extreme model garbage can still fail occasionally  

Details: [CURRENT-STATE-AND-NEXT.md](../engineering/implementation/CURRENT-STATE-AND-NEXT.md)

---

## Phase 2 — API & integration 🔜 NEXT

- `POST /api/chat` and `/api/chat/stream` (SSE)
- Observability metrics (latency, tools_used)
- Enrich `/health` / `/debug` as needed

**Impact:** Stable client contract for the UI.

---

## Phase 3 — UI & UX

- Full Next.js chat UI
- SSE streaming display
- Design system applied

**Impact:** Analyst can use the product without curl.

---

## Phase 4 — Optimization & polish

- Latency, edge cases, docs, demo script

---

## Phase 5 — Production hardening (post-MVP)

- Auth, guardrails, evaluation harness, expanded tools  
  (see [production-hardening-review.md](../planning/production-hardening-review.md))

---

## Future vision

- Multi-source MCP tools, long-term memory, multi-tenant SOC features

---

## Parallel work (now)

| Track | Focus |
| --- | --- |
| **Platform / host** | Ollama + tunnel, seed, verify, smoke scripts, demo pack |
| **Agent / product** | Reliability (1.5) → chat API (2) → chat UI (3) |

Do **not** start large UI work until Phase 1.5 demo questions pass reliably.
