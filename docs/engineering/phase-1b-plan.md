# Phase 1B Plan — LangGraph Agent Core

**Status:** Ready to start (Phase 1A complete)  
**Audience:** Team (Mayank + Vinit)  
**Last updated:** 2026-07-28  

Related docs:

- Phase 1A MCP: [docs/mcp/setup_1.md](../mcp/setup_1.md)
- Shared Gemma tunnel: [docs/mcp/shared-gemma-tunnel.md](../mcp/shared-gemma-tunnel.md)
- Architecture: [docs/architecture/system-architecture.md](../architecture/system-architecture.md)
- Roadmap: [docs/current/roadmap.md](../current/roadmap.md)

---

## 1. Goal (one sentence)

Connect **Gemma (`gemma4:e4b` via Ollama)** to a **LangGraph** workflow that uses the existing **ToolRegistry / MCP** stack so a natural-language SOC question becomes: plan → tool call(s) → observe → final answer.

---

## 2. What Phase 1A already gave us (do not rebuild)

| Component | Location | Status |
| --- | --- | --- |
| Docker stack (ES, MCP, backend, frontend) | `docker/docker-compose.yml` | Done |
| Host / remote Ollama (`OLLAMA_URL`, `GEMMA_MODEL_TAG`) | `docker/.env` | Done |
| MCP client (streamable HTTP `/mcp`) | `backend/app/mcp/` | Done |
| ToolRegistry + debug MCP endpoints | `backend/app/tools/`, `main.py` | Done |
| Seed index `alerts-security` (200 docs) | seed scripts | Done |
| Shared remote Gemma (Cloudflare) | host tunnel + teammate env | Done |

**Verified commands (run before coding 1B):**

```bash
# from repo root — stack up, model reachable
./scripts/dev-up.sh   # or compose up after Ollama/tunnel is ready

curl -s http://localhost:8000/debug/mcp-tools | python3 -m json.tool
# expect tool_count: 5

curl -s -X POST "http://localhost:8000/debug/mcp-call?tool_name=search" \
  -H "Content-Type: application/json" \
  -d '{"index":"alerts-security","query_body":{"query":{"match_all":{}},"size":2}}' \
  | python3 -m json.tool
# expect Total results: 200 (seed first if empty)

# Ollama (local or tunnel)
curl -sS "${OLLAMA_URL:-http://127.0.0.1:11434}/api/tags" | python3 -m json.tool
```

If any of these fail, fix Phase 1A / seed / tunnel before starting the graph.

---

## 3. What Phase 1B will deliver

### In scope

1. **LLM client** — `ChatOllama` using `OLLAMA_URL` + `GEMMA_MODEL_TAG`
2. **Session Manager** — in-memory `session_id` → message history (MVP)
3. **Context Builder** — system prompt + tools + history + question
4. **LangGraph agent** — Planner → Router → Executor → Observer → Finalizer
5. **Typed AgentState** flowing through all nodes
6. **Debug API** — `POST /debug/agent-run` (prove end-to-end without full UI)
7. **Short team doc** — how to run + example questions

### Out of scope (later phases)

| Item | Phase |
| --- | --- |
| Full Next.js chat UI | Phase 3 |
| Production `/api/chat` + SSE streaming product API | Phase 2 |
| Auth, Redis queue, multi-tenant | Phase 5+ |
| New MCP servers / threat intel tools | Later |
| Rewriting MCP client / ToolRegistry | Not needed |

---

## 4. How it will work (runtime story)

Example question:

> “Show the 5 highest severity malware alerts.”

```text
Client
  │  POST /debug/agent-run  { "question": "...", "session_id": null }
  ▼
FastAPI
  │  SessionManager.get_or_create(session_id)
  │  ContextBuilder.build(question, history, tool_schemas)
  ▼
LangGraph
  │
  ├─ PLANNER (Gemma via Ollama)
  │     "Search alerts-security for malware, sort by severity, size 5"
  │
  ├─ ROUTER
  │     tool = search, args = { index, query_body }
  │
  ├─ EXECUTOR (code only — no LLM)
  │     ToolRegistry.execute("search", args)
  │       → MCP → Elasticsearch → hits
  │
  ├─ OBSERVER (Gemma)
  │     Summarize hits for the analyst
  │
  └─ FINALIZER
        answer string + metadata
  ▼
JSON response
  {
    "session_id": "...",
    "answer": "...",
    "plan": "...",
    "tools_used": ["search"],
    "tool_results_preview": "..."
  }
```

### Where compute runs

| Piece | Machine |
| --- | --- |
| Backend, ES, MCP, LangGraph | Each developer’s laptop (Docker) |
| Gemma inference (Planner / Observer) | Host with model via `OLLAMA_URL` (local `host.docker.internal` or Cloudflare tunnel) |

**Mayank (host):** keep Ollama (+ tunnel with `--http-host-header localhost` when Vinit needs remote GPU).  
**Vinit (agent owner):** implement graph; use remote `OLLAMA_URL` if local model is not available.

---

## 5. Target file layout

Build on existing packages; do not mix agent logic into `mcp/` or `tools/`.

```text
backend/app/
├── main.py                 # add POST /debug/agent-run; wire agent
├── mcp/                    # KEEP as-is (Phase 1A)
├── tools/                  # KEEP as-is (Phase 1A)
├── session/                # NEW
│   ├── __init__.py
│   └── manager.py          # SessionManager
└── agent/                  # NEW
    ├── __init__.py
    ├── llm.py              # ChatOllama factory
    ├── state.py            # AgentState TypedDict / dataclass
    ├── context.py          # ContextBuilder
    ├── nodes.py            # planner, router, executor, observer, finalizer
    └── graph.py            # compile StateGraph, export run_agent()
```

Dependencies already listed in `backend/requirements.txt`:

- `langgraph`, `langchain`, `langchain-ollama`, `langchain-mcp-adapters`

Pin only if installs break; prefer versions already resolving in the backend image.

---

## 6. AgentState (minimum schema)

Every node reads/writes a shared state object:

```python
# conceptual — implement in state.py
class AgentState(TypedDict, total=False):
    session_id: str
    question: str
    messages: list          # chat history for this run / session
    context: str            # assembled prompt package or system block
    plan: str               # planner output
    tool_name: str | None
    tool_args: dict | None
    tool_result: str | None
    tools_used: list[str]
    observations: str       # observer notes
    answer: str             # final user-facing text
    error: str | None
    iteration: int          # guard against infinite tool loops
```

**Hard limits (required):**

- `MAX_TOOL_ITERATIONS = 3` (stop looping after 3 tool rounds)
- Prefer index `alerts-security` in system prompt
- Unknown tool names → error path, do not call MCP

---

## 7. Node responsibilities

| Node | Uses LLM? | Responsibility |
| --- | --- | --- |
| **Planner** | Yes (Gemma) | Turn question + context into a short plan / next action |
| **Router** | Prefer rules + structured parse | Choose `tool_name` + `tool_args` **or** `none` if answerable without tools |
| **Executor** | No | `await registry.execute(tool_name, tool_args)`; append to `tools_used` |
| **Observer** | Yes (Gemma) | Interpret tool JSON/text into analyst-facing notes |
| **Finalizer** | Optional short LLM or template | Produce `answer`; clear errors |

**Router tip:** Validate `tool_name` against `registry.list_names()`. Elastic tools expect exact arg names (`query_body`, `index_pattern`, not free-form aliases).

**Executor tip:** Tool results may be LangChain content blocks (list of text parts) — stringify/truncate before sending to Observer (e.g. first 4–8k chars).

---

## 8. API contract (Phase 1B)

### `POST /debug/agent-run`

**Request:**

```json
{
  "question": "Show high severity malware alerts (top 5)",
  "session_id": null
}
```

**Response (200):**

```json
{
  "session_id": "uuid-or-id",
  "answer": "…",
  "plan": "…",
  "tools_used": ["search"],
  "iterations": 1,
  "error": null
}
```

**Errors:**

- `503` if ToolRegistry / MCP not initialised
- `400` if `question` empty
- Graph internal failures → `answer` or `error` field with safe message (do not leak stack traces to client)

Keep existing endpoints unchanged:

- `GET /health`, `GET /debug`, `GET /debug/mcp-tools`, `POST /debug/mcp-call`

---

## 9. Implementation steps (checklist)

Work in order. Check off as you merge.

### Step 0 — Baseline (both)

- [ ] Stack healthy: ES + MCP + backend
- [ ] Seed `alerts-security` has documents
- [ ] `OLLAMA_URL` works (`/api/tags` + optional `/api/generate`)
- [ ] After any `.env` change: **recreate backend**  
  `docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --force-recreate backend`

### Step 1 — LLM client (Vinit)

- [ ] Add `app/agent/llm.py` → `get_chat_model()` from env
- [ ] Smoke test from backend process (one short invoke)
- [ ] Confirm works with **local** and **tunnel** `OLLAMA_URL`

### Step 2 — Session Manager (Vinit)

- [ ] `app/session/manager.py` — get_or_create, append_user, append_assistant
- [ ] In-memory store is fine for MVP (document that restart clears sessions)

### Step 3 — Context Builder (Vinit)

- [ ] System prompt: SOC analyst assistant; use tools for live data; index `alerts-security`
- [ ] Inject `registry.tool_schemas()` (names, descriptions, required fields)
- [ ] Inject short history + current question

### Step 4 — Graph skeleton (Vinit)

- [ ] `state.py`, `nodes.py`, `graph.py`
- [ ] Edges: Planner → Router → (Executor → Observer → Router?) → Finalizer
- [ ] Enforce `MAX_TOOL_ITERATIONS`
- [ ] Unit/smoke with **mocked** registry first (optional but recommended)

### Step 5 — Live ToolRegistry (Vinit)

- [ ] Executor uses process-global registry from lifespan (same as debug MCP)
- [ ] Demo path prioritises `search` / `list_indices`
- [ ] End-to-end on real seed data

### Step 6 — FastAPI wire-up (Vinit)

- [ ] `POST /debug/agent-run`
- [ ] Request/response models (Pydantic)
- [ ] Logging: session_id, tools_used, duration (no secrets)

### Step 7 — Team verification (both)

- [ ] Mayank: Ollama up; tunnel if Vinit remote
- [ ] Vinit: `OLLAMA_URL` = tunnel or local; recreate backend
- [ ] Shared curl demo questions (section 11)
- [ ] Update `TODO.md` / `PROJECT_CONTEXT.md` when done

### Step 8 — Definition of done

Phase 1B is **complete** when all are true:

1. [ ] `POST /debug/agent-run` accepts a natural-language SOC question  
2. [ ] Agent invokes at least one MCP tool when the question needs data  
3. [ ] Final answer reflects **real** seed fields (e.g. severity, event type, IP)  
4. [ ] Works with `OLLAMA_URL` pointing at host **or** Cloudflare tunnel  
5. [ ] Max-iteration guard prevents infinite loops  
6. [ ] No dependency on Next.js chat UI  

---

## 10. Ownership

| Area | Owner | Notes |
| --- | --- | --- |
| LangGraph, session, context, `/debug/agent-run` | **Vinit** | Primary Phase 1B implementer |
| Ollama + Cloudflare tunnel availability | **Mayank** | Host GPU / model |
| Seed data, compose health, shared docs | **Both** | Unblock demos |
| Prompt / tool-calling tuning | **Both** | Gemma + latency over tunnel |

### Git workflow suggestion

1. Branch: `feat/phase-1b-agent` (from latest `main`)
2. Small PRs preferred: (1) llm+session+context (2) graph (3) agent-run endpoint
3. Do not commit real tunnel URLs or `docker/.env`
4. Keep `docker/.env.example` updated if new env vars appear (none expected beyond existing)

---

## 11. Demo questions (after implementation)

```bash
# 1) Needs search tool
curl -s -X POST http://localhost:8000/debug/agent-run \
  -H "Content-Type: application/json" \
  -d '{"question":"Show high severity malware alerts (top 5)"}' \
  | python3 -m json.tool

# 2) Index awareness
curl -s -X POST http://localhost:8000/debug/agent-run \
  -H "Content-Type: application/json" \
  -d '{"question":"What indices are available? Use list_indices with pattern *."}' \
  | python3 -m json.tool

# 3) Multi-turn (same session_id from previous response)
curl -s -X POST http://localhost:8000/debug/agent-run \
  -H "Content-Type: application/json" \
  -d '{"question":"Only those with severity greater than 7","session_id":"PASTE_ID"}' \
  | python3 -m json.tool
```

On the host during inference:

```bash
ollama ps
# may show gemma4:e4b on GPU while Planner/Observer run
```

---

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Gemma produces invalid tool JSON | Strict Router validation; retry once; fall back to safe error answer |
| Tunnel latency (multi-step) | Max 3 tool iterations; keep model warm on host; shorter prompts |
| Empty Elasticsearch | Always seed before demo; document import path |
| Stale `OLLAMA_URL` in container | Recreate backend after env change (`printenv OLLAMA_URL` to verify) |
| Infinite agent loop | `MAX_TOOL_ITERATIONS` + graph conditional edges |
| Tool result too large for context | Truncate tool output before Observer |

---

## 13. Remote Gemma reminder (teammate)

```bash
# Host
cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost
# share https://….trycloudflare.com (no trailing slash)

# Teammate docker/.env
OLLAMA_URL=https://….trycloudflare.com
GEMMA_MODEL_TAG=gemma4:e4b

docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --force-recreate backend
curl -s http://localhost:8000/health | python3 -m json.tool
```

Full write-up: [shared-gemma-tunnel.md](../mcp/shared-gemma-tunnel.md).

---

## 14. After Phase 1B (preview only)

| Phase | Focus |
| --- | --- |
| **2** | `/api/chat`, `/api/chat/stream` (SSE), richer `/health` metrics |
| **3** | Next.js chat UI consuming chat/stream APIs |
| **4** | Latency polish, edge cases, demo scripts |
| **5** | Auth, hardening, eval harness |

Do **not** start Phase 2 UI until `/debug/agent-run` is reliable.

---

## 15. Quick reference — success picture

```text
BEFORE (now)
  Human → curl MCP search with hand-written JSON
  Human → curl Ollama generate for "hello"
  No automatic plan / tool / answer loop

AFTER Phase 1B
  Human → POST /debug/agent-run { question }
  Backend → Gemma plans → MCP search → Gemma explains → answer
  Optional session_id for follow-up questions
```

---

## 16. Sign-off

| Role | Name | Ready to start? |
| --- | --- | --- |
| Host / infra | Mayank | |
| Agent / graph | Vinit | |

When both check baseline (section 9 Step 0), begin Step 1 on branch `feat/phase-1b-agent`.
