# TODO

Engineering backlog. Completed work is moved, never deleted.

## Backlog

### Phase 4 — polish
- [ ] Performance: agent latency, cold-start, tunnel timeouts
- [ ] Edge cases: empty ES, Ollama down UX in chat UI
- [ ] Demo script / recorded walkthrough
- [ ] Optional token-level streaming from Gemma (beyond lifecycle SSE)

### Phase 5 — production later
- [ ] Auth / multi-tenant
- [ ] Guardrails and evaluation harness
- [ ] Expanded tools / real log sources beyond seed

### Optional / debt
- [ ] Enrich `/health` and `/debug` with agent latency metrics
- [ ] Persist sessions (Redis/DB) instead of in-memory only
- [ ] Frontend Docker healthcheck
- [ ] CI smoke: compose up + health + smoke-chat-api
- [ ] Compose profile `full` with Ollama container for CI without host Ollama
- [ ] Historical `docs/engineering/phase-0-setup-script.md` still describes old Ollama-in-Docker

## Current Sprint

- [x] Phase 0 foundation stack
- [x] Host Ollama + remote tunnel path
- [x] Phase 1A MCP + ToolRegistry
- [x] Phase 1B agent + `/debug/agent-run`
- [x] Phase 1.5 tool-call reliability + `smoke-agent-run.sh`
- [x] Phase 2 `/api/chat` + `/api/chat/stream` + `smoke-chat-api.sh`
- [x] Phase 3 Agent Chat UI tab
- [ ] Merge `feat/phase-2-3-product-chat` → `main`
- [ ] Team pull + joint demo (UI + API + seed)

## In Progress

- Branch: `feat/phase-2-3-product-chat` (Phases 2 + 3 product surface)

## Completed

### Phase 0 — Foundation (2026-07-25)
- [x] Docker Compose stack (ES, MCP, backend, frontend)
- [x] Healthchecks, pinned images, seed generators
- [x] Host Ollama (removed from Compose)

### Phase 1A — MCP (2026-07-27)
- [x] MCP client + ToolRegistry + debug MCP endpoints
- [x] Shared remote Gemma via Cloudflare tunnel

### Phase 1B + 1.5 — Agent (2026-07-28 … 07-30)
- [x] SessionManager, ContextBuilder, LangGraph, `/debug/agent-run`
- [x] Platform scripts: `seed-alerts.sh`, `verify-phase1b-platform.sh`
- [x] Tool-call repair + field normalize + `smoke-agent-run.sh`

### Phase 2 + 3 — Product chat (2026-07-30)
- [x] `POST /api/chat`, `POST /api/chat/stream`
- [x] `scripts/smoke-chat-api.sh`
- [x] Next.js Agent Chat tab (`ChatTab.tsx`)
- [x] Docs: phase-2 / phase-3 as-built + plan

## Bugs

- (none open) Agent free-form questions can still fail rarely; prefer seed-aware phrasing or rely on 1.5 normalize

## Future Improvements

- Smaller quantized model option for low-RAM demos
- CI smoke pipeline
