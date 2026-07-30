# Phase 2 Plan — Product Chat API

**Status:** Implemented on branch `feat/phase-2-3-product-chat` (with Phase 3 UI)  
**Owner track:** Backend / product API  
**UI (Phase 3):** same branch — Agent Chat tab

Living context: [implementation/CURRENT-STATE-AND-NEXT.md](./implementation/CURRENT-STATE-AND-NEXT.md)

---

## Goal

Expose a **stable product API** for chat clients (UI), wrapping the Phase 1 `run_agent` core without requiring `/debug/*` endpoints.

---

## What / how / impact

| Deliverable | How | Impact |
| --- | --- | --- |
| `POST /api/chat` | Body `{ message, session_id? }` → `run_agent` → JSON | UI can chat without debug routes |
| `POST /api/chat/stream` | Same body → SSE events around `run_agent` | Progressive UI (status / tools / answer) |
| Schemas | `app/api/schemas.py` | Fixed contract for frontend |
| Smoke | `./scripts/smoke-chat-api.sh` | Regression bar for Phase 2 |

### SSE events (stream)

| Event | Payload (summary) |
| --- | --- |
| `status` | `{ phase, message, session_id }` — agent started |
| `tools` | `{ tools_used, iterations, session_id }` |
| `answer` | `{ session_id, answer, plan, error }` |
| `result` | Full chat response fields |
| `error` | `{ detail, status_code? }` |
| `done` | `{ ok, session_id? }` |

**Note:** Token-level streaming from Gemma is **not** required in this phase; stream wraps the existing graph completion.

---

## File map

| Path | Role |
| --- | --- |
| `backend/app/deps.py` | Shared `get_registry` (no circular imports) |
| `backend/app/api/schemas.py` | `ChatRequest` / `ChatResponse` |
| `backend/app/api/chat.py` | Routes + SSE |
| `backend/app/main.py` | Include router; lifespan sets `deps.tool_registry` |
| `scripts/smoke-chat-api.sh` | Automated checks |

---

## Contract

### Request

```json
{
  "message": "Search alerts-security for event.type malware, size 3. Be brief.",
  "session_id": null
}
```

(`message` is the product name; maps to agent `question`.)

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

Same fields as `/debug/agent-run` (debug keeps `question` field name for engineers).

---

## Verify

```bash
./scripts/verify-phase1b-platform.sh
./scripts/smoke-agent-run.sh    # Phase 1.5 still green
./scripts/smoke-chat-api.sh     # Phase 2
```

Manual:

```bash
curl -s --max-time 300 -X POST http://localhost:8000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Search alerts-security for event.type malware, size 3. Be brief."}' \
  | python3 -m json.tool

curl -sN --max-time 300 -X POST http://localhost:8000/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"message":"Search alerts-security for event.type malware, size 3. Be brief."}'
```

---

## Parallel work (other person)

While this branch is developed:

- Phase 3 **UI shell**: message list, input, call `/api/chat` (or mock JSON matching `ChatResponse`)
- Expand demo questions / seed polish  
- Do **not** rewrite `run_agent` graph unless pairing  

---

## Out of scope (later)

- Full design-system chat UI (Phase 3)  
- Token streaming from LLM  
- Auth, rate limits (Phase 5)  
