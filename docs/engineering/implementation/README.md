# Engineering Implementation Index

**Last updated:** 2026-07-30

## Start here

### [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md)

**Single page for the whole team:**

1. What we have now  
2. Limitations  
3. What to work on next  
4. How next phases work and what impact they have  
5. Parallel tracks  
6. How to re-verify  

Short phase list: [docs/current/roadmap.md](../../current/roadmap.md)

---

## Status at a glance

| Phase | Name | Status | Doc |
| --- | --- | --- | --- |
| **0** | Foundation & environment | ✅ COMPLETE | [phase-0.md](./phase-0.md) |
| **1A** | MCP client + Tool Registry + shared Gemma | ✅ COMPLETE | [phase-1a.md](./phase-1a.md) |
| **1B-A** | Platform seed / verify | ✅ COMPLETE | [phase-1b-a.md](./phase-1b-a.md) |
| **1B-B** | LangGraph agent + `/debug/agent-run` | ✅ COMPLETE | [phase-1b-track-b.md](./phase-1b-track-b.md) |
| **1.5** | Agent reliability | ✅ COMPLETE | [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md) |
| **2** | Chat API + SSE | 🔜 NEXT | roadmap |
| **3** | Full chat UI | ⏸ After 2 | roadmap |
| **4–5** | Polish / production | ⏸ Later | roadmap |

---

## What we built (plain language)

### Phase 0 — “The house”

Docker: Elasticsearch, MCP, FastAPI, Next.js. Host Ollama. Health checks. Seed scripts.

### Phase 1A — “Tools”

Backend discovers Elastic tools over MCP and can search `alerts-security` via debug APIs. Optional shared Gemma over Cloudflare tunnel.

### Phase 1B — “Agent brain”

Natural language → LangGraph → Gemma may call MCP search → answer.  
Entry point: `POST /debug/agent-run`.  
Platform helpers: `./scripts/seed-alerts.sh`, `./scripts/verify-phase1b-platform.sh`.

---

## What is still limited

- Flaky tool JSON / wrong ES field names on free-form questions  
- No product `/api/chat` or full chat UI  
- Sessions only in memory  
- Synthetic seed data only  

Full list → [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md) §3

---

## What to do next

1. **Phase 2** — `/api/chat` (+ SSE stream)  
2. **Phase 3** — Next.js chat UI  
3. After Phase 2/3 ship, write a phase plan doc the same way as Phase 1B  

Parallel split → [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md)

---

## Document map

| File | Contents |
| --- | --- |
| **[CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md)** | **Current + limits + next roadmap** |
| [phase-0.md](./phase-0.md) | Foundation as-built |
| [phase-1a.md](./phase-1a.md) | MCP as-built |
| [phase-1b-a.md](./phase-1b-a.md) | Platform track as-built |
| [phase-1b-track-b.md](./phase-1b-track-b.md) | Agent B1–B8 log |
| [../phase-1b-plan.md](../phase-1b-plan.md) | Original 1B plan |
| [../phase-1b-work-split.md](../phase-1b-work-split.md) | Historical A/B parallel split |
| [../phase-1b-track-a.md](../phase-1b-track-a.md) | Platform ops runbook |

---

## Quick verify

```bash
./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh
./scripts/smoke-agent-run.sh
```
