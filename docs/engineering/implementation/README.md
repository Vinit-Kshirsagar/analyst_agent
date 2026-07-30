# Engineering Implementation Index

**Last updated:** 2026-07-30  
**Product branch:** `feat/phase-2-3-product-chat`

## Start here

| Doc | Purpose |
| --- | --- |
| **[CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md)** | What we have + limits |
| **[NEXT-AFTER-PHASE-2-3.md](./NEXT-AFTER-PHASE-2-3.md)** | **What to do next** (merge, demo, Phase 4–5) |
| [../../current/roadmap.md](../../current/roadmap.md) | Short phase checklist |

---

## Status at a glance

| Phase | Name | Status | Doc |
| --- | --- | --- | --- |
| **0** | Foundation | ✅ | [phase-0.md](./phase-0.md) |
| **1A** | MCP + tools | ✅ | [phase-1a.md](./phase-1a.md) |
| **1B** | Agent + agent-run | ✅ | [phase-1b-track-b.md](./phase-1b-track-b.md), [phase-1b-a.md](./phase-1b-a.md) |
| **1.5** | Reliability | ✅ | [phase-1.5.md](./phase-1.5.md) |
| **2** | `/api/chat` + SSE | ✅ on product branch | [phase-2.md](./phase-2.md) |
| **3** | Agent Chat UI | ✅ on product branch | [phase-3.md](./phase-3.md) |
| **4** | Polish | 🔜 after merge/demo | [NEXT-AFTER-PHASE-2-3.md](./NEXT-AFTER-PHASE-2-3.md) |
| **5** | Production | ⏸ later | roadmap |

---

## Quick verify

```bash
./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh
./scripts/smoke-agent-run.sh
./scripts/smoke-chat-api.sh
# UI: http://localhost:3000 → Agent Chat
```

---

## Document map

| File | Contents |
| --- | --- |
| [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md) | Current + limits |
| [NEXT-AFTER-PHASE-2-3.md](./NEXT-AFTER-PHASE-2-3.md) | Next roadmap after 2/3 |
| [phase-0.md](./phase-0.md) … [phase-3.md](./phase-3.md) | As-built per phase |
| [phase-1.5.md](./phase-1.5.md) | Reliability write-up |
| [../phase-2-plan.md](../phase-2-plan.md) | Phase 2 plan/contract |
