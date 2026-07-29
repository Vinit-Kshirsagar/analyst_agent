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
| **B3** | Session Manager (In-memory history) | ✅ Completed | `0bc92ce` |
| **B4** | Context Builder (Prompt assembly) | ✅ Completed | — |
| **B5** | AgentState + LangGraph skeleton | ✅ Completed | — |
| **B6** | Live ToolRegistry Executor | ✅ Completed | — |
| **B7** | Endpoint `POST /debug/agent-run` | ⏳ Next | — |
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

### Task B4 — Context Builder (Prompt Assembly)
- **What:** Implemented `ContextBuilder` in `backend/app/agent/context.py` — assembles the full prompt message list for the Planner node from system prompt, tool schemas, conversation history, and current question.
- **How:**
  1. **System prompt template**: Defines the SOC analyst assistant role, specifies primary index `alerts-security`, lists expected document fields, and includes strict `TOOL_CALL` JSON format rules.
  2. **`_format_tool_descriptions()`**: Iterates `registry.tool_schemas()` and renders each tool with name, description, required arguments (with types and descriptions), and optional arguments.
  3. **`build(question, history)`**: Constructs a message list `[system, ...history_messages, user_question]` ready for `ChatOllama.ainvoke()`.
  4. **`_trim_history()`**: Keeps only the last 10 messages to avoid exceeding the model's context window.
- **Design decisions:**
  - Used a `TOOL_CALL: {"tool": ..., "arguments": ...}` text format instead of LangChain's native tool binding — Gemma via Ollama doesn't reliably support structured tool-calling, so explicit text parsing in the Router node (B5) will be more robust.
  - History trimming set to 10 messages (5 exchanges) — sufficient for multi-turn follow-ups without bloating the prompt.
  - System prompt explicitly instructs the model to use exact argument names (`index`, `query_body`, `index_pattern`) to reduce parsing failures.
- **Verification:**
  - Ran inside Docker container with live MCP tool schemas (5 tools: `list_indices`, `get_mappings`, `esql`, `get_shards`, `search`).
  - Verified message list structure: `['system', 'user', 'assistant', 'user']` (4 messages with 2-message history).
  - Verified full system prompt renders all tool names, descriptions, required/optional arguments correctly.
  - Smoke test **PASSED**.

### Task B5 — AgentState + LangGraph Graph Skeleton
- **What:** Implemented all 5 graph node factories in `nodes.py`, wired the full LangGraph `StateGraph` in `graph.py`, and cleaned up `state.py` field groupings.
- **How:**
  1. **`state.py`**: Grouped `AgentState` fields by owning node (Input, Planner, Router, Executor, Observer, Finalizer, Control). Removed "stub" note.
  2. **`nodes.py`** — 5 node factory functions using dependency injection:
     - `make_planner(llm, context_builder)`: Calls `ContextBuilder.build()` then `llm.ainvoke()`. Returns `plan` text.
     - `make_router(registry)`: Regex-parses `TOOL_CALL: {"tool": ..., "arguments": ...}` from plan. Validates tool name against `registry.list_names()`. Returns `tool_name`/`tool_args` or `None`.
     - `make_executor(registry)`: Calls `registry.execute(tool_name, tool_args)`. Stringifies and truncates results (6000 char cap). Increments `iteration` counter and appends to `tools_used`.
     - `make_observer(llm)`: Sends tool results + question to Gemma with a focused summarization prompt. Returns `observations`.
     - `make_finalizer()`: Assembles final `answer` from observations (tool path) or cleaned plan text (direct path). Handles error fallback.
  3. **`graph.py`** — `StateGraph` wiring:
     - Topology: `START → planner → router → [conditional: executor or finalizer] → executor → observer → [conditional: router loop or finalizer] → END`
     - `_route_after_router()`: Routes to executor if `tool_name` is set, otherwise finalizer.
     - `_route_after_observer()`: For MVP, goes to finalizer after first tool call. Max iteration guard present.
     - `run_agent()`: Entry point integrating `SessionManager`, graph compilation, timing, and structured result dict.
  4. **Module-level `SessionManager`** instance lives for the process lifetime in `graph.py`.
- **Design decisions:**
  - Used **factory pattern** for nodes (`make_planner(llm, ctx)` returns async function) — LangGraph nodes only accept `state`, so closures bind dependencies cleanly.
  - Tool result truncation at 6000 chars protects Observer's context window from large ES responses.
  - For MVP, Observer routes directly to Finalizer (single tool call per question). Multi-step chaining is a one-line change in `_route_after_observer()`.
  - Graph is recompiled per `run_agent()` call — acceptable for debug endpoint; can cache in Phase 2 if needed.
- **Verification:**
  - Graph compiled successfully: `CompiledStateGraph` with nodes `['__start__', 'planner', 'router', 'executor', 'observer', 'finalizer', '__end__']`.
  - End-to-end `run_agent()` executed with tunnel offline — error handling caught LLM failure cleanly, returned structured JSON with error field populated (no crash).
  - Smoke test **PASSED** (graph compilation + graceful error handling).
  - Full live LLM test deferred until tunnel is back online.

### Task B6 — Live ToolRegistry Executor
- **What:** Verified the Executor node (already implemented in B5's `make_executor()`) works end-to-end with real MCP tools against live Elasticsearch data.
- **How:** Ran direct executor node tests inside the Docker backend container (no LLM/Ollama needed):
  1. **`search` tool**: Queried `alerts-security` with `match_all` + `size: 2`. Returned 200 total hits, 2 docs with full fields (`@timestamp`, `destination.ip`, `event.severity`, `event.type`, `rule.name`, etc.).
  2. **`list_indices` tool**: Called with `index_pattern: *`. Returned `alerts-security` index with `docs.count: 200`.
  3. **No tool_name**: Executor correctly skipped execution and returned `tool_result: None`.
  4. **Truncation**: Fetched 50 docs (large result). Output was 6016 chars ending in `... [truncated]` — confirms the 6000 char cap works.
  5. **Error handling**: Searched a nonexistent index (`nonexistent-index`). Executor caught the 404 error and returned `"Tool execution error: HTTP status client error (404 Not Found)"` without crashing.
- **Design decisions:**
  - No new code was written — B6 is a **verification-only** task confirming B5’s executor implementation works with real MCP/ES infrastructure.
  - `tools_used` accumulates correctly across multiple executor calls within the same state (e.g. `['search', 'list_indices']`).
  - `iteration` counter increments correctly (0 → 1 → 2).
- **Verification:**
  - All 5 test scenarios **PASSED** inside Docker backend container.
  - Live ES data (200 seed alerts) queried successfully via MCP.
  - No Ollama tunnel required.

---
