# Current State, Limitations & Next-Phase Roadmap

**Last updated:** 2026-07-30  
**Audience:** Whole team  
**Source of truth for:** “What do we have? What’s broken/limited? What do we build next? How do we split work?”

**Phase 1 + 1.5 status:** COMPLETE (smoke-agent-run.sh green on fixed demos).

Related deep dives:

| Doc | Use when |
| --- | --- |
| [phase-0.md](./phase-0.md) | Foundation stack details |
| [phase-1a.md](./phase-1a.md) | MCP + ToolRegistry details |
| [phase-1b-a.md](./phase-1b-a.md) | Platform seed/verify track |
| [phase-1b-track-b.md](./phase-1b-track-b.md) | Agent B1–B8 implementation log |
| [../phase-1b-plan.md](../phase-1b-plan.md) | Original 1B design |
| [../../current/roadmap.md](../../current/roadmap.md) | Short phase list (kept in sync with this file) |

---

## 1. Where we are (one screen)

```text
✅ Phase 0   Foundation (Docker ES/MCP/backend/frontend, host Ollama, health)
✅ Phase 1A  MCP client + ToolRegistry + debug tool APIs + shared Gemma tunnel
✅ Phase 1B  Platform seed/verify + LangGraph agent + POST /debug/agent-run
✅ Phase 1.5 Agent reliability (JSON repair, field normalize, smoke script)

🔜 Phase 2   Product chat API + streaming (SSE)
⏸ Phase 3   Full chat UI in Next.js
⏸ Phase 4   Polish / latency / demo
⏸ Phase 5   Auth, multi-tenant, production hardening
```

**In plain language:**  
We can run the stack, load 200 fake security alerts, search them via MCP, and ask natural-language questions through `/debug/agent-run` so Gemma calls search and summarizes — including free-form “high severity malware” after Phase 1.5 fixes. We do **not** yet have a product chat API or full chat UI (Phase 2–3).

---

## 2. What we currently have (working)

### 2.1 Platform

| Capability | How it shows up |
| --- | --- |
| 4 Docker services | `elasticsearch`, `mcp-server`, `backend`, `frontend` |
| Host LLM | Ollama + model `gemma4:e4b` via `OLLAMA_URL` |
| Health | `GET /health` → ES + Ollama + MCP |
| Seed data | Index `alerts-security`, ~200 docs (`./scripts/seed-alerts.sh`) |
| Gate 0 check | `./scripts/verify-phase1b-platform.sh` |
| Optional remote LLM | Cloudflare tunnel to host Ollama (`--http-host-header localhost`) |

### 2.2 Tools (MCP)

| Capability | How it shows up |
| --- | --- |
| 5 Elastic tools | `search`, `list_indices`, `get_mappings`, `esql`, `get_shards` |
| List tools | `GET /debug/mcp-tools` |
| Manual tool call | `POST /debug/mcp-call?tool_name=…` + JSON body |
| Smoke test | `backend/scripts/test_mcp.py` |

### 2.3 Agent (Phase 1B)

| Capability | How it shows up |
| --- | --- |
| LLM factory | `app/agent/llm.py` → ChatOllama |
| Sessions (memory only) | `app/session/manager.py` |
| Prompt assembly | `app/agent/context.py` |
| LangGraph loop | planner → router → executor → observer → finalizer |
| Debug agent API | `POST /debug/agent-run` `{ "question", "session_id?" }` |

**Proven E2E (when phrasing is good):**

```bash
curl -s --max-time 300 -X POST http://localhost:8000/debug/agent-run \
  -H 'Content-Type: application/json' \
  -d '{"question":"Search alerts-security for event.type malware, size 3, show source.ip and event.severity. Be brief."}' \
  | python3 -m json.tool
# Expect: tools_used includes "search", error null, non-empty answer
```

---

## 3. Limitations (honest list)

These are **known**, not surprises. Plan next work against them.

| # | Limitation | Impact today |
| --- | --- | --- |
| L1 | **Tool-call JSON can still fail on extreme outputs** | Mitigated in 1.5 (brace repair, balanced extract); rare model garbage still possible |
| L2 | **Model may invent fields** | Mitigated in 1.5 (prompt schema + normalize `severity:"high"` → range, `event.category` → `event.type`) |
| L3 | **Sessions are in-memory only** | Lost on backend restart; no multi-user isolation |
| L4 | **No product chat API** | Only `/debug/agent-run`; not meant as public contract |
| L5 | **No chat UI** | Frontend is status/landing, not analyst chat |
| L6 | **No streaming** | Full answer only after the whole graph finishes (can be slow) |
| L7 | **Single local demo index** | Only synthetic `alerts-security`; not real production logs |
| L8 | **Remote Gemma via quick tunnel** | URL changes every restart; unauthenticated; host must stay online |
| L9 | **Agent quality ≠ platform quality** | Platform can be 100% green while agent answers are wrong/empty |
| L10 | **No auth / tenancy / audit** | Fine for local team demo; not production |

### Seed field cheat-sheet (for prompts & demos)

| Field | Real values in seed data |
| --- | --- |
| Index | `alerts-security` |
| `event.type` | `malware` \| `authentication` |
| `event.severity` | Integer (e.g. 1–8), **not** `"high"` |
| `event.outcome` | `success` \| `failure` |
| `source.ip` / `destination.ip` | IPs |
| `rule.name` | e.g. Brute Force, Malware Detected, … |

---

## 4. Areas we need to work on (priority order)

| Priority | Area | Why |
| --- | --- | --- |
| **P0** | Agent reliability (parse + field schema in prompts) | Without this, demos and UI will look broken |
| **P1** | Product API (`/api/chat`, optional stream) | Clean contract for frontend |
| **P1** | Smoke scripts for agent-run | One command = “Phase 1 still green” |
| **P2** | Chat UI | Analyst-facing product |
| **P2** | Better seed / fixtures | Guaranteed malware + high severity samples |
| **P3** | Observability (latency, tools_used metrics) | Debug production-like failures |
| **P3** | Session persistence | Multi-turn survives restart |
| **Later** | Auth, real data sources, multi-tenant | Phase 5 |

---

## 5. Next-phase roadmap (what / how / what happens)

### Phase 1.5 — Agent reliability ✅ DONE (2026-07-30)

**What shipped**

- `backend/app/agent/tool_call.py` — balanced JSON extract, trailing-comma/brace repair, search-arg normalize  
- `context.py` — system prompt locked to real seed fields + example queries  
- `nodes.py` router uses hardened extract + normalize  
- `scripts/smoke-agent-run.sh` — fixed demos must pass  

**Verify**

```bash
./scripts/smoke-agent-run.sh
# expects ALL CHECKS PASSED (3 agent questions + empty-question 400)
```

---

### Phase 2 — API & integration 🔜 NEXT

**What**

- `POST /api/chat` → same core as `run_agent`, stable response schema.  
- `POST /api/chat/stream` (SSE) → progressive tokens and/or step events (planning / tool / answer).  
- Optional: richer `/health` or `/debug` with last agent metrics.

**How (parallel)**

| Track | Work |
| --- | --- |
| **Backend** | New routes wrapping `run_agent`; SSE generator; request validation |
| **Platform / host** | Load-test latency; document timeouts for tunnel vs local Ollama |
| **Frontend (light)** | Tiny fetch client or Storybook-less page to hit `/api/chat` (optional) |

**If we do this**

- UI and other clients have a real contract.  
- Debug endpoint can stay for engineers.  
- Streaming improves perceived speed.

**Impact**

- Unblocks Phase 3 cleanly.  
- Still no full design-system chat unless Phase 3 is done.

---

### Phase 3 — Chat UI

**What**

- Next.js chat: message list, input, loading state, errors.  
- Wire to `/api/chat` or stream.  
- Show optional “tools used” / step status for trust.

**How (parallel)**

| Track | Work |
| --- | --- |
| **Frontend** | Chat components, SSE client, state |
| **Backend** | Small API fixes from UI feedback; CORS already allows `:3000` |
| **Platform** | Demo script: seed → ask 3 questions → screenshot checklist |

**If we do this**

- Analyst-style demo without curl.  
- Product starts to look real.

**Impact**

- Depends heavily on Phase 1.5 reliability.  
- Does not add new SOC data sources by itself.

---

### Phase 4 — Polish

**What:** Faster cold start, better prompts, edge cases, recorded demo, docs cleanup.  
**If we do this:** Stable demos for stakeholders; less flakiness under tunnel latency.

### Phase 5 — Production hardening

**What:** Auth, guardrails, eval harness, real indices, secrets, multi-tenant.  
**If we do this:** Path toward real deployment — not required for MVP demo.

---

## 6. Recommended parallel split (next 1–2 weeks)

```text
                    NOW (after Phase 1 merge)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     Track Platform                    Track Agent / Product
     - Ollama + tunnel on demand       - Tool JSON parse + prompt fields
     - seed + verify after pulls       - smoke-agent-run.sh (shared)
     - demo question pack              - then /api/chat (+ stream)
     - optional better seed fixtures   - then chat UI
```

| Do together | Do not do yet |
| --- | --- |
| Reliability + smoke scripts | Big UI redesign before tools are stable |
| Chat API once agent-run is ~stable | Auth / multi-tenant |
| Keep docs in this file updated | Rebuilding MCP from scratch |

---

## 7. Definition of done per milestone

### Phase 1 (current) — ship bar

- [x] Stack healthy  
- [x] Seed 200 + MCP search  
- [x] `/debug/agent-run` exists and can call `search` with a good question  
- [ ] Free-form questions usually succeed (target after Phase 1.5)  
- [ ] Full code on `main` for whole team  

### Phase 1.5 done when

- Fixed demo set (3 questions) passes **3/3** with `error: null` and useful `tools_used` most runs.  
- Documented known failure modes still remaining.

### Phase 2 done when

- `/api/chat` returns same quality as agent-run.  
- Optional stream works in a minimal client.

### Phase 3 done when

- User can chat in the browser without curl.

---

## 8. How the system works (simple diagram)

```text
Analyst question
       │
       ▼
 FastAPI  POST /debug/agent-run   (later: /api/chat)
       │
       ├─ SessionManager (history)
       ├─ ContextBuilder (rules + tools + question)
       ▼
 LangGraph
   Planner (Gemma) → Router → Executor ──► ToolRegistry ──► MCP ──► Elasticsearch
                      │              ▲
                      └─ Observer (Gemma) / Finalizer
       │
       ▼
 JSON { answer, plan, tools_used, session_id, error }
```

| Piece | Lives where |
| --- | --- |
| ES + MCP + backend + frontend | Docker |
| Gemma weights | Host Ollama (or remote tunnel) |
| Seed alerts | ES volume `elasticsearch-data` |

---

## 9. Verify current build anytime

```bash
# Platform
./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh
curl -s http://localhost:8000/health | python3 -m json.tool

# MCP
curl -s http://localhost:8000/debug/mcp-tools | python3 -c \
  'import json,sys; d=json.load(sys.stdin); print(d["tool_count"])'

# Agent (field-aware question)
curl -s --max-time 300 -X POST http://localhost:8000/debug/agent-run \
  -H 'Content-Type: application/json' \
  -d '{"question":"Search alerts-security for event.type malware, size 3, show source.ip and event.severity. Be brief."}' \
  | python3 -m json.tool
```

---

## 10. One-line answers

| Question | Answer |
| --- | --- |
| Is Phase 1 real? | **Yes** — architecture verified; quality still needs hardening |
| What’s missing in docs before? | Single **current + limits + next** page (this file) |
| What should we build next? | **Phase 1.5 reliability**, then **Phase 2 API**, then **Phase 3 UI** |
| Can we split work? | **Yes** — platform vs agent/product tracks above |
| What if we jump to UI first? | UI will look broken whenever tool JSON/fields fail |

**Keep this file updated** when a phase completes or a major limitation is fixed.
