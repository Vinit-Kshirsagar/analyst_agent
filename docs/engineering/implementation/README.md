# Engineering Implementation Index

Living record of **what we built**, **who owns what**, and **what comes next**.

**Last updated:** 2026-07-28  
**Current branch (Mayank Track A):** `phase1b_A`

---

## Status at a glance

| Phase | Name | Status | Owner(s) | Doc |
| --- | --- | --- | --- | --- |
| **0** | Foundation & environment | ✅ COMPLETE | Team | [phase-0.md](./phase-0.md) |
| **1A** | MCP client + Tool Registry + shared Gemma | ✅ COMPLETE | Vinit (MCP) + Mayank (host Ollama/tunnel) | [phase-1a.md](./phase-1a.md) |
| **1B-A** | Platform track (seed, env, verify) | ✅ DONE on branch `phase1b_A` | **Mayank** | [phase-1b-a.md](./phase-1b-a.md) |
| **1B-B** | Agent track (LangGraph + agent-run) | 🔜 NEXT | **Vinit** (primary) | [../phase-1b-plan.md](../phase-1b-plan.md) · [../phase-1b-work-split.md](../phase-1b-work-split.md) |
| **2** | Chat API + SSE | ⏸ Later | Team | roadmap |
| **3** | Full chat UI | ⏸ Later | Team | roadmap |

---

## What we did till now (plain language)

### Phase 0 — “The house”

We can run a local SOC-agent **platform**:

- Elasticsearch, MCP server, FastAPI backend, Next.js frontend in Docker  
- Ollama + `gemma4:e4b` on the **host** (not in Docker)  
- Health checks so services start only when ready  
- Sample security data concept + generators  

You can open the UI, hit `/health`, and know ES / MCP / Ollama are reachable.

### Phase 1A — “Tools + shared brain”

The backend can **discover and call Elasticsearch tools** via MCP (search, list indices, etc.) without writing raw ES client code for each tool.

We also proved **remote Gemma**: teammate’s backend can use Mayank’s Ollama through Cloudflare Tunnel (`OLLAMA_URL`), so M1 machines need not host the 9.6GB model.

### Phase 1B-A (Mayank, this week) — “Reliable platform for the agent”

Before anyone builds LangGraph, the platform must be boring and reliable:

- One command to **seed 200 alerts** into ES  
- One command to **verify Gate 0** (ES, seed, MCP, backend, Ollama)  
- Clear **env rules** (recreate backend after `OLLAMA_URL` change)  
- Docs for host tunnel + volumes  

**Verified on Mayank’s machine:** `./scripts/verify-phase1b-platform.sh` → all required checks passed; `alerts-security` count = 200; MCP search returns hits; `/health` overall healthy.

---

## What we need to do next

### Immediately (before / while coding agent)

| # | Action | Who |
| --- | --- | --- |
| 1 | Merge or open PR for `phase1b_A` (scripts + docs) so Vinit has seed/verify | Mayank |
| 2 | Vinit: branch for agent (`feat/phase-1b-agent`), implement Track B | Vinit |
| 3 | When Vinit needs GPU: Mayank runs tunnel + shares URL; Vinit force-recreates backend | Both |
| 4 | Gate 1: ChatOllama works on Vinit with tunnel | Both |
| 5 | Gate 3: `POST /debug/agent-run` answers a SOC question using MCP + Gemma | Both |

### Do **not** start yet

- Full Next.js chat UI (Phase 3)  
- Production `/api/chat` + SSE product API (Phase 2) — wait until `/debug/agent-run` works  
- Rewriting MCP client  

---

## Architecture so far vs next

```text
DONE                          NEXT (1B-B)
────                          ───────────
Frontend status UI            
FastAPI /health /debug        
MCP client + ToolRegistry  →  LangGraph uses registry
MCP search → ES seed data  →  Planner/Router/Executor/Observer
Host/remote Gemma (health) →  ChatOllama inside graph
seed-alerts.sh             →  agent-run demo questions
verify-phase1b-platform.sh    

                              POST /debug/agent-run
                              Session + Context Builder
```

---

## How to re-check “we’re still good”

```bash
# from repo root, stack + Ollama up
./scripts/seed-alerts.sh                 # if count not 200
./scripts/verify-phase1b-platform.sh     # Gate 0

# MCP search (body required)
curl -s -X POST 'http://localhost:8000/debug/mcp-call?tool_name=search' \
  -H 'Content-Type: application/json' \
  -d '{"index":"alerts-security","query_body":{"query":{"match_all":{}},"size":2}}'
```

---

## Document map

| File | Contents |
| --- | --- |
| [phase-0.md](./phase-0.md) | Foundation stack, host Ollama, health, seed generators |
| [phase-1a.md](./phase-1a.md) | MCP client, ToolRegistry, debug endpoints, tunnel ops |
| [phase-1b-a.md](./phase-1b-a.md) | Mayank Track A deliverables, volumes, seed process, next handoff |
| [../phase-1b-plan.md](../phase-1b-plan.md) | Full Phase 1B technical plan |
| [../phase-1b-work-split.md](../phase-1b-work-split.md) | Parallel Mayank / Vinit checklist |
| [../phase-1b-track-a.md](../phase-1b-track-a.md) | Track A runbook (ops detail) |

---

## Team ownership (Phase 1B)

| Track | Person | Focus |
| --- | --- | --- |
| **A — Platform** | Mayank | Ollama host, tunnel, seed, env, verify scripts, docs |
| **B — Agent** | Vinit | LLM client, session, context, LangGraph, `/debug/agent-run` |
