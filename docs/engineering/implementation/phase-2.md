# Phase 2 Implementation: Product Chat API

**Status:** Implemented on branch `feat/phase-2-3-product-chat` (with Phase 3 UI)  
**Depends on:** Phase 1 + 1.5 (`run_agent`, MCP, seed, Ollama)  
**Plan:** [phase-2-plan.md](../phase-2-plan.md) · UI: [phase-3.md](./phase-3.md)

---

## 1. Why Phase 2

Phase 1 exposed the agent only as:

```text
POST /debug/agent-run   { "question": "..." }
```

That is fine for engineers. A product UI needs a **stable public contract**:

```text
POST /api/chat          { "message": "..." }
POST /api/chat/stream   same body → Server-Sent Events
```

Phase 2 **does not rewrite** LangGraph. It **wraps** the same `run_agent()` used by debug.

---

## 2. What we built

| Endpoint | Purpose |
| --- | --- |
| `POST /api/chat` | Full JSON answer for UI clients |
| `POST /api/chat/stream` | SSE lifecycle events for progressive UI |
| `GET /debug` | Now reports `phase: "2"` and lists chat APIs |

### Request (both chat endpoints)

```json
{
  "message": "Search alerts-security for event.type malware, size 3. Be brief.",
  "session_id": null
}
```

| Field | Meaning |
| --- | --- |
| `message` | User text (product name). Internally mapped to agent `question`. |
| `session_id` | Optional; multi-turn (same as agent-run). |

### Response (`/api/chat`)

```json
{
  "session_id": "uuid",
  "answer": "...",
  "plan": "...",
  "tools_used": ["search"],
  "iterations": 1,
  "error": null
}
```

Same core fields as `/debug/agent-run` so the UI can ignore debug routes.

### SSE events (`/api/chat/stream`)

| Event | When |
| --- | --- |
| `status` | Agent started |
| `tools` | After run — tools used / iterations |
| `answer` | Answer + plan + error |
| `result` | Full payload (same as JSON chat) |
| `error` | Failure |
| `done` | Stream finished (`ok: true/false`) |

**Note:** Streaming is **lifecycle** streaming around one `run_agent` call, not token-by-token LLM streaming (that can come later).

---

## 3. Where code lives (for the agent-track owner)

| Path | Role |
| --- | --- |
| `backend/app/deps.py` | Shared `tool_registry` + `get_registry()` (avoids circular imports) |
| `backend/app/api/schemas.py` | `ChatRequest`, `ChatResponse` |
| `backend/app/api/chat.py` | Routes + SSE helper |
| `backend/app/api/__init__.py` | Exports chat router |
| `backend/app/main.py` | Lifespan sets `deps.tool_registry`; `include_router(chat_router)` |
| `scripts/smoke-chat-api.sh` | Automated Phase 2 checks |
| `docs/engineering/phase-2-plan.md` | Plan / contract |

### Unchanged (you can keep working here)

- `backend/app/agent/*` — graph, planner, tools (not rewritten for Phase 2)
- `backend/app/session/*` — sessions still used via `run_agent`
- `POST /debug/agent-run` — still works for debugging

---

## 4. How it works

```text
UI / curl
   │
   ├─ POST /api/chat ──────────────┐
   │                               ▼
   └─ POST /api/chat/stream ──► run_agent(question=message, registry, session_id)
                                       │
                                       ▼
                                 LangGraph + MCP + ES + Gemma
                                       │
                                       ▼
                              ChatResponse / SSE events
```

**Impact**

- Frontend has a real product API.  
- Debug endpoints stay for engineers.  
- No need to change agent graph to start Phase 3 UI.  
- Same limitations as Phase 1 (Ollama latency, seed-only data, in-memory sessions).

---

## 5. How to verify

### Prerequisites

```bash
# Branch
git checkout feat/phase-2-chat-api

# Ollama with gemma4:e4b + Docker stack
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build

./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh   # optional but recommended
```

### One-command Phase 2 smoke

```bash
./scripts/smoke-chat-api.sh
```

Expect:

- empty `message` → 400/422  
- `/api/chat` → `error: null`, answer non-empty (often `tools_used: ["search"]`)  
- `/api/chat/stream` → SSE events include `status`, `result`, `done`  

### Manual checks

```bash
# JSON chat
curl -s --max-time 300 -X POST http://localhost:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Search alerts-security for event.type malware, size 3. Be brief."}' \
  | python3 -m json.tool

# SSE stream (watch events)
curl -sN --max-time 300 -X POST http://localhost:8000/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"message":"Search alerts-security for event.type malware, size 3. Be brief."}'

# Debug still works
curl -s http://localhost:8000/debug | python3 -m json.tool
# should show phase 2 and chat API paths
```

### Multi-turn

```bash
# 1) first message — copy session_id from response
# 2) second message with same session_id
curl -s --max-time 300 -X POST http://localhost:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Only high severity ones","session_id":"PASTE-UUID"}' \
  | python3 -m json.tool
```

---

## 6. Parallel work (UI track)

While this API is reviewed/merged:

- Build chat UI against **`ChatResponse`** shape  
- Call `POST /api/chat` (or mock the same JSON)  
- Later switch stream client to `/api/chat/stream`  
- Prefer **not** editing `app/api/chat.py` without coordinating  

---

## 7. What is still Phase 3+

- Full Next.js chat UX (history pane, streaming tokens, design system)  
- Token-level Gemma streaming inside the graph  
- Auth, rate limits, production hosting  

---

## 8. One-line summary

> Phase 2 adds **`/api/chat` and `/api/chat/stream`** as a product wrapper around Phase 1 `run_agent`, so the UI can talk to the agent without using debug endpoints.
