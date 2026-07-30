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

## Phase 2 — API & integration ✅ on branch `feat/phase-2-3-product-chat`

**Branch:** `feat/phase-2-3-product-chat` (Phases 2 + 3 together)  
**Plan:** [phase-2-plan.md](../engineering/phase-2-plan.md) · as-built [implementation/phase-2.md](../engineering/implementation/phase-2.md)

- `POST /api/chat` — product JSON chat (wraps `run_agent`)
- `POST /api/chat/stream` — SSE lifecycle events
- Smoke: `./scripts/smoke-chat-api.sh`

**Impact:** Stable client contract for the UI.

---

## Phase 3 — UI & UX ✅ on same branch

**As-built:** [implementation/phase-3.md](../engineering/implementation/phase-3.md)

- Next.js **Agent Chat** tab (`ChatTab.tsx`)
- Calls `/api/chat` (optional Stream → `/api/chat/stream`)
- Session id + clear; shows tools_used

**Impact:** Analyst can use the product without curl.

**Verify:** open http://localhost:3000 → Agent Chat → ask a seed-aware question.

---

## Phase 4 — Optimization & polish 🔜 NEXT (after merge)

**Plan:** [NEXT-AFTER-PHASE-2-3.md](../engineering/implementation/NEXT-AFTER-PHASE-2-3.md)

- Latency / timeout UX, better loading via SSE steps
- Demo question chips, seed fixtures, recorded walkthrough
- Edge cases (Ollama/MCP down banners in chat)

---

## Phase 5 — Production hardening (post-MVP)

- Auth, guardrails, evaluation harness, expanded tools  
  (see [production-hardening-review.md](../planning/production-hardening-review.md))
- Session persistence, deploy/TLS/secrets

---

## Future vision

- Multi-source MCP tools, long-term memory, multi-tenant SOC features

---

## Parallel work (now)

| Track | Focus |
| --- | --- |
| **Ship** | Merge `feat/phase-2-3-product-chat` → `main`, team pull, joint demo |
| **Platform** | Ollama/tunnel, seed, smokes stay green |
| **Product polish** | Phase 4 UX/demo (after merge) |