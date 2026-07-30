# Current State, Limitations & Next-Phase Roadmap

**Last updated:** 2026-07-30  
**Audience:** Whole team  
**Product branch:** `feat/phase-2-3-product-chat`

**After Phase 2/3 next steps:** [NEXT-AFTER-PHASE-2-3.md](./NEXT-AFTER-PHASE-2-3.md)

---

## 1. Where we are (one screen)

```text
✅ Phase 0    Foundation (Docker ES/MCP/backend/frontend, host Ollama, health)
✅ Phase 1A   MCP client + ToolRegistry + debug tool APIs + shared Gemma tunnel
✅ Phase 1B   Platform seed/verify + LangGraph agent + POST /debug/agent-run
✅ Phase 1.5  Agent reliability (JSON repair, field normalize, smoke-agent-run)
✅ Phase 2    POST /api/chat + /api/chat/stream (+ smoke-chat-api)
✅ Phase 3    Agent Chat UI tab (Next.js)

🔜 Merge product branch → main + team demo
⏸ Phase 4    Polish / latency / demo quality
⏸ Phase 5    Auth, multi-tenant, production hardening
```

**In plain language:**  
You can seed alerts, verify the platform, call the product chat API, and use the **Agent Chat** tab in the browser. The brain is still local Gemma + MCP search over seed data.

---

## 2. What we currently have (working)

### Platform
- 4 Docker services; host Ollama `gemma4:e4b`
- `./scripts/seed-alerts.sh`, `./scripts/verify-phase1b-platform.sh`

### Tools
- 5 MCP tools; `/debug/mcp-tools`, `/debug/mcp-call`

### Agent
- LangGraph + `/debug/agent-run`
- Phase 1.5 tool-call harden + `./scripts/smoke-agent-run.sh`

### Product (2 + 3)
- `POST /api/chat`, `POST /api/chat/stream`
- `./scripts/smoke-chat-api.sh`
- UI: **Agent Chat** → `ChatTab.tsx`

---

## 3. Limitations (honest)

| Limitation | Impact |
| --- | --- |
| Sessions in-memory only | Lost on backend restart |
| Seed data only | Not real production logs |
| Free-form agent questions can still flake rarely | Prefer seed-aware demos; 1.5 helps a lot |
| SSE is lifecycle (not token streaming) | UI waits for full agent run |
| No auth | Local team only |
| Product branch may not be on `main` yet | Merge required for whole team |

---

## 4. How the product path works

```text
Browser Agent Chat
    → POST /api/chat { message, session_id }
    → run_agent (LangGraph)
    → Gemma plan → MCP search → ES alerts-security
    → answer JSON → UI message bubble
```

---

## 5. Verify anytime

```bash
./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh
./scripts/smoke-agent-run.sh
./scripts/smoke-chat-api.sh
open http://localhost:3000   # Agent Chat tab
```

---

## 6. Next work

See **[NEXT-AFTER-PHASE-2-3.md](./NEXT-AFTER-PHASE-2-3.md)** for merge, demo, Phase 4 polish, and Phase 5 production path.
