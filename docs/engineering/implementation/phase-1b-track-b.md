# Phase 1B — Track B (Agent Core) Implementation Log

**Author:** Vinit (Track B Lead) & AI Pair  
**Branch:** `feat/phase-1b-agent`  
**Started:** 2026-07-28  

This document logs the step-by-step progress, technical decisions, implementation details, and verification steps for **Track B (Agent Core)** during Phase 1B.

---

## Progress Overview

| Task | Description | Status | Commit |
| --- | --- | --- | --- |
| **B0** | Shared baseline check (ES, MCP, Gemma health) | ✅ Verified | — |
| **B1** | Branch setup & package skeleton | ✅ Completed | `a9f616e` |
| **B2** | LLM Client (`ChatOllama` factory) | ✅ Completed | `29d8079` |
| **B3** | Session Manager (In-memory history) | ✅ Completed | Uncommitted |
| **B4** | Context Builder (Prompt assembly) | ⏳ Next | — |
| **B5** | AgentState + LangGraph skeleton | ⬜ Pending | — |
| **B6** | Live ToolRegistry Executor | ⬜ Pending | — |
| **B7** | Endpoint `POST /debug/agent-run` | ⬜ Pending | — |
| **B8** | Hardening & Gate 3 verification | ⬜ Pending | — |

---

## Detailed Task Log

### Task B0 — Baseline Verification
- **What:** Verified Docker stack services (Elasticsearch, MCP server, backend, frontend) and confirmed Ollama/tunnel availability.
- **How:** Checked running containers, `alerts-security` seed data, `/debug/mcp-tools` endpoint, and host/remote Ollama tags.

### Task B1 — Branch Setup & Package Skeleton
- **What:** Created working branch `feat/phase-1b-agent` and set up clean, un-blocking package skeletons for `app/agent` and `app/session`.
- **How:**
  1. Created git feature branch `feat/phase-1b-agent` off `main`.
  2. Created package structures and stub files:
     - `backend/app/agent/__init__.py`: Public package exports (`get_chat_model`, `AgentState`, `ContextBuilder`, `run_agent`).
     - `backend/app/agent/llm.py`: Stub function `get_chat_model()` raising `NotImplementedError("B2")`.
     - `backend/app/agent/state.py`: Defined `AgentState` `TypedDict` containing all execution fields and set `MAX_TOOL_ITERATIONS = 3`.
     - `backend/app/agent/context.py`: Stub `ContextBuilder` class raising `NotImplementedError("B4")`.
     - `backend/app/agent/nodes.py`: Stub node functions (`planner`, `router`, `executor`, `observer`, `finalizer`) raising `NotImplementedError("B5")`.
     - `backend/app/agent/graph.py`: Stub `run_agent()` entry point raising `NotImplementedError("B5")`.
     - `backend/app/session/__init__.py`: Re-exports `SessionManager`.
     - `backend/app/session/manager.py`: Stub `SessionManager` class with multi-turn history methods raising `NotImplementedError("B3")`.
  3. Committed skeleton changes (`a9f616e`).

### Task B2 — LLM Client (`ChatOllama` Factory)
- **What:** Implemented `get_chat_model()` in `backend/app/agent/llm.py` — a factory that returns a `ChatOllama` instance configured from environment variables.
- **How:**
  1. Reads `OLLAMA_URL` (defaults to `http://host.docker.internal:11434`) and `GEMMA_MODEL_TAG` (defaults to `gemma4:e4b`) from env.
  2. Strips trailing slashes from the URL to avoid double-slash issues.
  3. Uses `temperature=0.2` (low for deterministic SOC-analyst answers) and `timeout=120s` (generous for Cloudflare tunnel latency).
  4. Returns a `ChatOllama` instance ready for `ainvoke()` / `astream()`.
- **Design decisions:**
  - Kept defaults identical to `main.py` so the agent module and health checks read the same env vars.
  - `temperature` and `timeout` are kwargs so callers can override per-node if needed (e.g. Planner vs Observer).
- **Verification:**
  - Ran inside Docker container — confirmed `ChatOllama` object creation with correct `base_url`, `model`, `temperature`.
  - Ran live `ainvoke("Say hi in exactly 5 words")` via Cloudflare tunnel — received `AIMessage` with content `"Hello there, how are you doing?"`.
  - Smoke test **PASSED** on tunnel URL.
### Task B3 — Session Manager (In-Memory History)
- **What:** Implemented `SessionManager` in `backend/app/session/manager.py` — an in-memory session store for multi-turn conversation tracking.
- **How:**
  1. Internal `_sessions` dict mapping `session_id` → session object (`id`, `created_at` in ISO 8601, `messages` list).
  2. `get_or_create(session_id=None)`: Retrieves an existing session or generates a new UUID v4 session ID if `session_id` is `None` or not found.
  3. `append_user(session_id, message)` and `append_assistant(session_id, message)`: Defensively retrieve or create session and append `{"role": "user"|"assistant", "content": message}`.
  4. `get_history(session_id)`: Returns a shallow copy of the message list or an empty list `[]` if unknown.
  5. `active_session_count()`: Observability helper returning total active session count.
- **Design decisions:**
  - Dict mutations are thread-safe on FastAPI's single async event loop (no lock overhead needed for MVP).
  - Explicitly documented MVP limitation: all sessions reset on backend restart.
- **Verification:**
  - Ran unit smoke test inside backend container:
    - Session auto-creation with UUID v4 verified.
    - Appended user and assistant messages verified in order.
    - Session resumption using `session_id` verified (same object instance returned).
    - Unknown `session_id` query verified to return `[]` without raising errors.
  - Smoke test **PASSED**.

---

