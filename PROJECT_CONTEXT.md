# PROJECT_CONTEXT

Living working memory for the Autonomous Security Agent. Updated when milestones complete.

## Current implementation phase

**Phases 0 → 1.5 COMPLETE · Phases 2–3 implemented on `feat/phase-2-3-product-chat` (merge to main pending)**

## Current sprint

- Land product chat API + Agent Chat UI on `main`
- Joint team demo (seed + chat UI + Gemma)
- Plan next work: polish (Phase 4) or metrics/auth later

## What exists now (implementation)

| Component | State |
| --- | --- |
| Docker Compose 4-service stack | elasticsearch, mcp-server, backend, frontend |
| Host Ollama + `gemma4:e4b` | Via `OLLAMA_URL` (local or Cloudflare tunnel) |
| Seed `alerts-security` | ~200 docs; `./scripts/seed-alerts.sh` |
| MCP + ToolRegistry | 5 Elastic tools; debug MCP endpoints |
| LangGraph agent | planner → router → executor → observer → finalizer |
| Debug agent | `POST /debug/agent-run` |
| Product API (Phase 2) | `POST /api/chat`, `POST /api/chat/stream` |
| Chat UI (Phase 3) | Sidebar **Agent Chat** → `ChatTab` |
| Smokes | `verify-phase1b-platform.sh`, `smoke-agent-run.sh`, `smoke-chat-api.sh` |

## Recently completed

- Phase 1.5 reliability (tool_call repair, field normalize)
- Phase 2 product chat API
- Phase 3 Agent Chat UI on same product branch

## Current blockers

- Merge `feat/phase-2-3-product-chat` → `main` so whole team has API + UI
- Ensure Ollama running for demos

## Known issues

- ES single-node often **yellow** (expected)
- Sessions in-memory only (lost on backend restart)
- Agent free-form questions can still flake rarely; seed-aware questions are most reliable
- SSE is lifecycle events around one `run_agent` call (not token streaming)

## Current branch

`feat/phase-2-3-product-chat`

## Next priorities

1. Merge product chat branch to `main`; team `git pull`
2. Demo: UI Agent Chat + malware search question
3. Phase 4 polish (latency, edge cases, demo script) — see roadmap
4. Optional: richer metrics, session persistence, token streaming

## Key URLs (local)

| Surface | URL |
| --- | --- |
| Next.js UI | http://localhost:3000 |
| Agent Chat tab | Dashboard → **Agent Chat** |
| Backend health | http://localhost:8000/health |
| Product chat | `POST http://localhost:8000/api/chat` |
| Product stream | `POST http://localhost:8000/api/chat/stream` |
| Debug agent | `POST http://localhost:8000/debug/agent-run` |
| Elasticsearch | http://localhost:9200 |
| MCP ping | http://localhost:8080/ping |
| Ollama | http://localhost:11434 |

## Documentation map

- **Now + next:** [docs/engineering/implementation/CURRENT-STATE-AND-NEXT.md](./docs/engineering/implementation/CURRENT-STATE-AND-NEXT.md)
- **After 2/3 roadmap:** [docs/engineering/implementation/NEXT-AFTER-PHASE-2-3.md](./docs/engineering/implementation/NEXT-AFTER-PHASE-2-3.md)
- **Phase list:** [docs/current/roadmap.md](./docs/current/roadmap.md)
- **Phase 2/3 as-built:** [phase-2.md](./docs/engineering/implementation/phase-2.md), [phase-3.md](./docs/engineering/implementation/phase-3.md)
