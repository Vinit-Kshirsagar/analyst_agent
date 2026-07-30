# Phase 3 Implementation: Agent Chat UI

**Status:** Implemented on branch `feat/phase-2-3-product-chat` (with Phase 2 API)  
**Depends on:** Phase 2 `POST /api/chat` (+ optional `/api/chat/stream`)

---

## 1. Why

Phase 2 gave a product API. Analysts still needed curl. Phase 3 adds an in-app **Agent Chat** tab so questions go through the UI.

---

## 2. What we built

| Piece | Detail |
| --- | --- |
| **Agent Chat tab** | Sidebar → “Agent Chat” |
| **Component** | `frontend/app/components/tabs/ChatTab.tsx` |
| **Wiring** | `Sidebar.tsx` (`chat` tab), `page.tsx` renders `ChatTab` |
| **API** | Default: `POST /api/chat` with `{ message, session_id }` |
| **Optional stream** | Toggle “Stream” → `POST /api/chat/stream` (SSE `result` event) |
| **Session** | Keeps `session_id` for multi-turn; Clear resets session |

---

## 3. How it works

```text
Browser (Agent Chat tab)
    │  POST /api/chat  { message, session_id }
    ▼
Backend Phase 2
    │  run_agent(...)
    ▼
LangGraph + MCP + ES + Gemma
    │
    ▼
ChatResponse → shown as assistant message
```

---

## 4. How to verify

```bash
# Branch with Phase 2 + 3
git checkout feat/phase-2-3-product-chat

# Backend + Ollama + seed
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
./scripts/seed-alerts.sh
./scripts/smoke-chat-api.sh   # API still green

# UI
open http://localhost:3000
# Enter dashboard → sidebar "Agent Chat"
# Ask: Search alerts-security for event.type malware, size 3. Be brief.
```

Expect: user bubble, loading state, assistant answer; optional “tools: search”.

---

## 5. Parallel note

- This branch holds **Phase 2 API + Phase 3 UI** together for one product surface.
- Other track can review API contract, expand smokes, or host Gemma — avoid editing `ChatTab.tsx` without coordinating.

---

## 6. Out of scope (later polish)

- Full design-system redesign  
- Token-level LLM streaming  
- Auth / multi-user  
- Message search / export  

---

## 7. One-line summary

> Phase 3 adds the **Agent Chat** tab that calls **`/api/chat`** so users can talk to the SOC agent without curl.
