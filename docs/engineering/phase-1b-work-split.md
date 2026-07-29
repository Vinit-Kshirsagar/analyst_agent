# Phase 1B — Parallel Work Split (Mayank + Vinit)

**Status:** Ready to execute  
**Last updated:** 2026-07-28  
**Full plan:** [phase-1b-plan.md](./phase-1b-plan.md)

This document divides Phase 1B so **both of you can work at the same time** with minimal blocking.  
You meet only at defined **handoff gates**.

---

## 1. Roles at a glance

| | **Mayank (Track A — Platform & LLM Host)** | **Vinit (Track B — Agent Core)** |
| --- | --- | --- |
| **Focus** | Keep model + stack + data reliable; agent-facing contracts | Build LangGraph agent + session/context + API |
| **Primary machine** | Host with `gemma4:e4b` (+ tunnel when needed) | Dev laptop (M1 OK) with remote or local Ollama |
| **Does NOT own** | LangGraph node implementation | Host GPU / Cloudflare tunnel ops |
| **Owns merge** | Infra/docs PRs; review agent PR | Feature branch `feat/phase-1b-agent` |

```text
                    PARALLEL
        ┌──────────────────────────────┐
        │                              │
   Track A (Mayank)              Track B (Vinit)
   LLM host + data +             Agent code + graph
   contracts + verification      + /debug/agent-run
        │                              │
        └──────────┬───────────────────┘
                   │
            Integration gates
            (both verify together)
```

---

## 2. Shared baseline (both do first — ~30 min)

Do this **once** before parallel coding. Either person can lead; both confirm.

### What

| # | Task | How | Done when |
| --- | --- | --- | --- |
| B0 | Pull latest `main` | `git pull` | Same commit both sides |
| B1 | Stack up | `./scripts/dev-up.sh` or compose up | ES, MCP, backend, frontend up |
| B2 | Seed data | Import into `alerts-security` if empty | `search` size=2 returns hits |
| B3 | MCP OK | `curl …/debug/mcp-tools` | `tool_count: 5` |
| B4 | Ollama OK | Local or tunnel `/api/tags` | `gemma4:e4b` listed |
| B5 | Read plan | Open this file + [phase-1b-plan.md](./phase-1b-plan.md) | Both agree on DoD |

### Impact

Unblocks both tracks. Without seed + MCP + Ollama, agent work is blind.

### Gate 0 — **START PARALLEL** only if all B0–B4 pass on at least one machine.

---

## 3. Track A — Mayank (Platform & LLM Host)

**Theme:** Make sure Vinit’s agent always has a working brain (Gemma) and working data (ES), with clear env contracts and verification scripts.

### A1 — Stable LLM host procedure (Day 1 morning)

| | |
| --- | --- |
| **What** | Documented, repeatable way to run Ollama + optional Cloudflare tunnel |
| **How** | 1. Ollama app or `ollama serve` on host<br>2. `curl http://127.0.0.1:11434/api/tags`<br>3. When Vinit needs remote model:<br>`cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost`<br>4. DM **new** URL (no trailing slash) every restart<br>5. Host’s own `docker/.env` stays `OLLAMA_URL=http://host.docker.internal:11434` |
| **Impact** | Vinit can call Planner/Observer without installing 9.6GB model |
| **Output** | Short note in Slack/team chat: “tunnel live → `https://….trycloudflare.com`” + [shared-gemma-tunnel.md](../mcp/shared-gemma-tunnel.md) already exists |

### A2 — Env contract + backend recreate checklist (Day 1)

| | |
| --- | --- |
| **What** | Single source of truth for env vars the agent will use |
| **How** | Confirm `docker/.env.example` documents:<br>`OLLAMA_URL`, `GEMMA_MODEL_TAG`, `MCP_SERVER_URL`, `ELASTICSEARCH_URL`<br>Add comment: *after any OLLAMA_URL change → force-recreate backend*<br>```bash<br>docker compose -f docker/docker-compose.yml --env-file docker/.env \<br>  up -d --force-recreate backend<br>docker compose exec backend printenv OLLAMA_URL<br>``` |
| **Impact** | Avoids “Network is unreachable” / stale env bugs |
| **Output** | Updated `docker/.env.example` if anything missing (no real tunnel URLs) |

### A3 — Seed reliability (Day 1)

| | |
| --- | --- |
| **What** | One-command or short doc path to load 200 alerts into ES |
| **How** | Fix or document import despite compose `data/` mount overlay:<br>- Host: generate + import to `localhost:9200`, **or**<br>- `docker cp` sample JSON + index via backend container (as done in Phase 1A)<br>Optional: add `scripts/seed-alerts.sh` that does the reliable path |
| **Impact** | Agent demos always have malware/severity data to find |
| **Output** | `scripts/seed-alerts.sh` **or** section in phase-1b-plan “Seed” with copy-paste commands |

### A4 — Agent-facing contract smoke (Day 1–2, **no LangGraph required**)

| | |
| --- | --- |
| **What** | Prove backend can reach Ollama with the **same env** the agent will use |
| **How** | From host (and ask Vinit to run on his side):<br>```bash<br>curl -s http://localhost:8000/health \| python3 -m json.tool<br># ollama.status == connected<br>```<br>Optional small script later once Vinit adds endpoint — for now health is enough |
| **Impact** | Separates “model down” vs “graph bug” during integration |
| **Output** | Green `/health` on host; Vinit green with tunnel URL |

### A5 — Demo questions pack + acceptance checklist (Day 2)

| | |
| --- | --- |
| **What** | Fixed list of questions both will use for DoD |
| **How** | Keep/extend list in phase-1b-plan §11; add expected **signals** (not exact wording): e.g. tools_used includes `search`, answer mentions severity or IP |
| **Impact** | Same definition of “works” for both machines |
| **Output** | Shared checklist (can stay in this doc §6) |

### A6 — Integration support (when Track B reaches Gate 2)

| | |
| --- | --- |
| **What** | Keep tunnel + model warm; help debug env only |
| **How** | During Vinit’s first live agent runs: leave cloudflared open; watch `ollama ps`; recreate backend if URL changes |
| **Impact** | End-to-end works on M1 without local Gemma |
| **Output** | Successful remote agent-run observed (tools + GPU activity) |

### A7 — Docs & merge hygiene (ongoing)

| | |
| --- | --- |
| **What** | Keep living docs accurate; review Vinit’s PR for env/ops only |
| **How** | Update `TODO.md` / `PROJECT_CONTEXT.md` when gates pass; PR review focus: no secrets, recreate notes, health still valid |
| **Impact** | Team does not lose operational knowledge |

### Track A implementation (branch `phase1b_A`)

| Item | Status | Artifact |
| --- | --- | --- |
| A1 Host runbook | Done | [phase-1b-track-a.md](./phase-1b-track-a.md) |
| A2 Env contract | Done | `docker/.env.example` |
| A3 Seed script | Done | `./scripts/seed-alerts.sh` |
| A4 Platform verify | Done | `./scripts/verify-phase1b-platform.sh` |
| A5 Demo questions | Done | phase-1b-track-a.md § Demo questions |

### Track A — explicit non-goals

- Do **not** implement LangGraph nodes (unless helping debug)
- Do **not** redesign MCP client
- Do **not** build chat UI

---

## 4. Track B — Vinit (Agent Core)

**Theme:** Build the agent loop on top of existing MCP + ToolRegistry; expose `POST /debug/agent-run`.

### B1 — Branch + package skeleton (Day 1 morning)

| | |
| --- | --- |
| **What** | Empty modules so work can land without waiting on Mayank |
| **How** | Branch `feat/phase-1b-agent` from `main`<br>Create:<br>`app/agent/{__init__,llm,state,context,nodes,graph}.py`<br>`app/session/{__init__,manager}.py`<br>Stub functions with `NotImplementedError` or pass-through |
| **Impact** | Clear ownership of files; Mayank won’t conflict on same paths |
| **Output** | Skeleton committed/pushed |

### B2 — LLM client (Day 1)

| | |
| --- | --- |
| **What** | `get_chat_model()` → `ChatOllama` |
| **How** | Read `OLLAMA_URL`, `GEMMA_MODEL_TAG` from env<br>Smoke: one `ainvoke("Say hi in 5 words")` from a small script or temporary debug route<br>Works with tunnel base URL (no path suffix) |
| **Impact** | Planner/Observer can call Gemma |
| **Depends on Mayank?** | Only if using remote model — need live tunnel URL (A1) |
| **Output** | `app/agent/llm.py` working |

### B3 — Session Manager (Day 1, parallel with B2)

| | |
| --- | --- |
| **What** | In-memory sessions |
| **How** | `get_or_create(session_id) → session`<br>`append_user` / `append_assistant`<br>Restart clears memory (document it) |
| **Impact** | Follow-up questions possible |
| **Depends on Mayank?** | No |
| **Output** | `app/session/manager.py` |

### B4 — Context Builder (Day 1–2)

| | |
| --- | --- |
| **What** | Build prompt package for Planner |
| **How** | Inputs: question, history, `registry.tool_schemas()`, system rules (SOC, index `alerts-security`, exact tool arg names)<br>Output: string or message list for ChatOllama |
| **Impact** | Model knows tools + data constraints |
| **Depends on Mayank?** | No (uses existing ToolRegistry API) |
| **Output** | `app/agent/context.py` |

### B5 — AgentState + graph skeleton (Day 2)

| | |
| --- | --- |
| **What** | Typed state + LangGraph wiring with max iterations |
| **How** | See [phase-1b-plan.md](./phase-1b-plan.md) §6–7<br>Nodes: planner → router → executor → observer → finalizer<br>`MAX_TOOL_ITERATIONS = 3`<br>Mock executor first (return fake hits) to test graph without ES |
| **Impact** | Agent control flow exists independent of prompt quality |
| **Depends on Mayank?** | No for mock path |
| **Output** | `state.py`, `nodes.py`, `graph.py` compile and run mock |

### B6 — Live Executor via ToolRegistry (Day 2–3)

| | |
| --- | --- |
| **What** | Real MCP tool calls from Executor |
| **How** | Inject registry from FastAPI lifespan (same as `/debug/mcp-call`)<br>Validate tool name ∈ `registry.list_names()`<br>Truncate large tool results before Observer |
| **Impact** | Answers use real `alerts-security` data |
| **Depends on Mayank?** | Soft: seed must exist (A3) |
| **Output** | End-to-end graph with real `search` |

### B7 — `POST /debug/agent-run` (Day 3)

| | |
| --- | --- |
| **What** | Public proof endpoint for Phase 1B |
| **How** | Pydantic body: `question`, optional `session_id`<br>Call `run_agent(...)`<br>Return `session_id`, `answer`, `plan`, `tools_used`, `error` |
| **Impact** | Both can demo with one curl; Phase 2 UI can wait |
| **Depends on Mayank?** | Soft: Ollama up for full answer quality |
| **Output** | Endpoint in `main.py` + short usage in PR description |

### B8 — Hardening pass (Day 3–4)

| | |
| --- | --- |
| **What** | Failure modes |
| **How** | Empty question → 400<br>MCP down → clear error<br>Bad tool JSON from model → safe message + no crash<br>Log duration + tools_used |
| **Impact** | Integration day is not firefighting |
| **Output** | Stable endpoint under bad input |

### Track B — explicit non-goals

- Do **not** build Next.js chat UI  
- Do **not** add production `/api/chat` SSE (Phase 2) unless both agree after DoD  
- Do **not** change MCP transport without pairing with Mayank  

---

## 5. Parallel calendar (suggested 3–4 days)

```text
        Day 1                          Day 2                         Day 3
┌─────────────────────┐    ┌─────────────────────────┐    ┌──────────────────────────┐
│ BOTH: Gate 0        │    │                         │    │                          │
│ baseline B0–B4      │    │                         │    │                          │
├──────────┬──────────┤    ├──────────┬──────────────┤    ├──────────┬───────────────┤
│ Mayank   │ Vinit    │    │ Mayank   │ Vinit        │    │ Mayank   │ Vinit         │
│ A1 tunnel│ B1 branch│    │ A3 seed  │ B4 context   │    │ A6 live  │ B6 live tools │
│ A2 env   │ B2 LLM   │    │ A4 health│ B5 graph     │    │ support  │ B7 agent-run  │
│          │ B3 sess  │    │ A5 demos │ mock graph   │    │ A7 docs  │ B8 harden     │
└──────────┴──────────┘    └──────────┴──────────────┘    └──────────┴───────────────┘
        │                            │                              │
     Gate 1                       Gate 2                         Gate 3
  LLM reachable              mock graph OK                  agent-run DoD
  from both machines         + seed ready                   together
```

Adjust days if part-time; **order of gates** matters more than calendar dates.

---

## 6. Integration gates (must sync)

### Gate 1 — “Brain online” (end of Day 1)

| Check | Owner runs | Pass criteria |
| --- | --- | --- |
| Host Ollama | Mayank | `/api/tags` has gemma4:e4b |
| Tunnel (if remote) | Mayank → Vinit | Vinit curl tunnel `/api/tags` OK |
| Backend health ollama | Both | `ollama.status == connected` |
| LLM module | Vinit | One successful ChatOllama invoke |

**Impact if skip:** Graph merges will fail for “model” reasons, not code reasons.

### Gate 2 — “Graph + data ready” (end of Day 2)

| Check | Owner | Pass criteria |
| --- | --- | --- |
| Seed | Mayank | 200 docs in `alerts-security` |
| MCP search | Either | `/debug/mcp-call` search works |
| Mock or live graph | Vinit | Graph finishes without hang; iteration cap works |

**Impact if skip:** Live tool step blocked.

### Gate 3 — “Phase 1B done” (Day 3–4)

Both run:

```bash
curl -s -X POST http://localhost:8000/debug/agent-run \
  -H "Content-Type: application/json" \
  -d '{"question":"Show high severity malware alerts (top 5)"}' \
  | python3 -m json.tool
```

| Criteria | Pass |
| --- | --- |
| HTTP 200 | Yes |
| `tools_used` includes a real tool when needed | e.g. `search` |
| `answer` non-empty and references data-ish content | severity / malware / IP |
| Host `ollama ps` shows activity during run (optional) | GPU load |
| Second call with `session_id` accepted | No crash |

**Impact:** Phase 1B closed → can plan Phase 2 API/UI.

---

## 7. What each person does day-by-day (copy this)

### Mayank — Track A checklist

- [ ] **A0** Gate 0 baseline with Vinit  
- [ ] **A1** Ollama + tunnel procedure; share URL when he codes  
- [ ] **A2** Env recreate checklist / `.env.example` notes  
- [ ] **A3** Reliable seed path (script or documented commands)  
- [ ] **A4** Confirm `/health` ollama connected on host  
- [ ] **A5** Agree demo questions with Vinit  
- [ ] **A6** Stay online for Gate 3 remote test  
- [ ] **A7** Docs + review PR (ops/env only)  

### Vinit — Track B checklist

- [ ] **B0** Gate 0 baseline with Mayank  
- [ ] **B1** Branch + `app/agent/*` + `app/session/*` skeleton  
- [ ] **B2** `llm.py` + ChatOllama smoke  
- [ ] **B3** SessionManager  
- [ ] **B4** ContextBuilder  
- [ ] **B5** AgentState + graph (mock executor OK)  
- [ ] **B6** Live ToolRegistry executor  
- [ ] **B7** `POST /debug/agent-run`  
- [ ] **B8** Error handling + PR  

---

## 8. File ownership (avoid git conflicts)

| Path | Owner | Other person |
| --- | --- | --- |
| `backend/app/agent/**` | **Vinit** | Review only |
| `backend/app/session/**` | **Vinit** | Review only |
| `backend/app/main.py` (agent-run only) | **Vinit** | Mayank review |
| `backend/app/mcp/**`, `backend/app/tools/**` | **Freeze** unless bugfix agreed | Pair for bugs |
| `docker/.env.example`, `scripts/seed-*.sh` | **Mayank** | Vinit consumes |
| `docs/engineering/phase-1b-*.md` | **Either** | Prefer one PR for doc nits |
| `docker/.env` (local) | **Each machine** | Never commit |

If both must touch `main.py`, Vinit owns the agent route; Mayank does not refactor health in the same PR.

---

## 9. Communication protocol

| Event | Who → Whom | Message |
| --- | --- | --- |
| Tunnel restarted | Mayank → Vinit | New `OLLAMA_URL=https://…` (force-recreate backend) |
| Seed reloaded | Mayank → Vinit | “alerts-security ready, 200 docs” |
| Gate 1/2/3 ready | Owner → other | “Gate N pass on my machine” + paste short curl output |
| Blocker | Anyone | Tag: `BLOCKED:` reason + need (env / seed / review) |
| PR open | Vinit → Mayank | Link + how to test agent-run |

**Do not** commit Cloudflare URLs. Share in chat only.

---

## 10. Impact summary (why this split works)

| If only Vinit works | If only Mayank works | If both in parallel |
| --- | --- | --- |
| Agent code without stable remote model / seed flakiness | Stable infra but no agent | Agent + reliable Gemma + data |
| M1 blocked on 9.6GB model | No LangGraph progress | Phase 1B finishes faster |
| Debug mixed “is it Ollama or graph?” | No product path | Clear gates separate failures |

**End state after both tracks + Gate 3:**

```text
Analyst question
  → POST /debug/agent-run
  → LangGraph (Vinit’s code)
  → MCP tools → local ES (each laptop)
  → Gemma plan/observe (Mayank’s host via OLLAMA_URL)
  → JSON answer
```

---

## 11. Definition of done (team)

Phase 1B is complete when **Gate 3** passes on:

1. Mayank’s machine (local Ollama), and  
2. Vinit’s machine (tunnel Ollama),  

using the same agent code from `feat/phase-1b-agent` (merged or merge-ready).

Then update:

- [ ] `TODO.md` — Phase 1b items checked  
- [ ] `PROJECT_CONTEXT.md` — current phase note  
- [ ] `docs/current/roadmap.md` — 1B complete  

---

## 12. Start message (paste to teammate)

```text
Phase 1B parallel split:
docs/engineering/phase-1b-work-split.md
Full plan: docs/engineering/phase-1b-plan.md

You (Vinit) = Track B agent/graph/agent-run
Me (Mayank) = Track A Ollama/tunnel/seed/env

Today:
1) Both finish Gate 0 baseline
2) You start B1–B3 (branch, llm, session)
3) I start A1–A3 (tunnel, env notes, seed)

Sync at Gate 1 when ChatOllama + /health ollama both work.
```
