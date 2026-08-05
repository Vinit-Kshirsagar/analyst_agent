# Phase 1B Implementation & Architectural Guide — Autonomous Security Agent

**Author:** Vinit (Track B Lead) & AI Assistant  
**Date:** 2026-07-29  
**Status:** Completed (Tasks B0 – B8 fully implemented, hardened, and verified)  
**Target Repository:** `analyst_agent`  
**Working Branch:** `feat/phase-1b-agent`  

---

## Executive Summary

Phase 1B transitions the Autonomous Security Agent from a foundational container stack (Phase 0/1A) into an operational, natural-language-driven Security Operations Center (SOC) assistant. 

The core achievement of Phase 1B is connecting host/remote **Gemma LLM inference (`gemma4:e4b`)** to a structured **LangGraph StateGraph execution loop**, using an **Elastic Model Context Protocol (MCP)** tool discovery and execution pipeline over live **Elasticsearch (`alerts-security`)** data.

Work was split into two parallel tracks to avoid developer contention:
- **Track A (Mayank — Platform & Host):** LLM host stability, Cloudflare tunnel infrastructure, environment contract alignment, Elasticsearch seed data reliability.
- **Track B (Vinit — Agent Core):** LangGraph agent architecture, typed state management, ChatOllama factory, in-memory multi-turn session management, context & system prompt assembly, tool execution nodes, API endpoints, error hardening, and response synthesis.

---

## 1. Overall Phase 1B Architecture & Data Flow

```text
                  +-------------------------------------------------+
                  |                ANALYST / CLIENT                 |
                  +-------------------------------------------------+
                                           |
                                           | POST /debug/agent-run
                                           v
+-----------------------------------------------------------------------------------+
| FASTAPI BACKEND CONTAINER                                                         |
|                                                                                   |
|  +------------------------+      +---------------------------------------------+  |
|  |     SessionManager     |      |               ContextBuilder                |  |
|  |  (In-Memory History)   |      | (System Prompt + MCP Schemas + History)     |  |
|  +------------------------+      +---------------------------------------------+  |
|               |                                         |                         |
|               +--------------------+--------------------+                         |
|                                    |                                              |
|                                    v                                              |
|  +-----------------------------------------------------------------------------+  |
|  |                           LANGGRAPH STATEGRAPH                              |  |
|  |                                                                             |  |
|  |   [START]                                                                   |  |
|  |      |                                                                      |  |
|  |      v                                                                      |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | 1. PLANNER (LLM Node)                                                 |  |  |
|  |  |    Sends full prompt package to Gemma. Generates execution plan or     |  |  |
|  |  |    TOOL_CALL directive: TOOL_CALL: {"tool": "...", "arguments": {...}} |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |      |                                                                      |  |
|  |      v                                                                      |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  | 2. ROUTER (Rules Node)                                                |  |  |
|  |  |    Regex-parses TOOL_CALL; validates tool against ToolRegistry.        |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |      |                                                                      |  |
|  |      +----------------------------------+                                   |  |
|  |      | (tool_name set)                  | (tool_name is None)               |  |
|  |      v                                  v                                   |  |
|  |  +-----------------------+     +-----------------------------------------+  |  |
|  |  | 3. EXECUTOR (Code)    |     | 5. FINALIZER (Template)                 |  |  |
|  |  |    Calls ToolRegistry |     |    Formats answer, handles fallback,    |  |  |
|  |  |    with 6k char cap   |     |    clears transient state.               |  |  |
|  |  +-----------------------+     +-----------------------------------------+  |  |
|  |      |                                  ^                                   |  |
|  |      v                                  |                                   |  |
|  |  +-----------------------+              |                                   |  |
|  |  | 4. OBSERVER (LLM)     |--------------+ (Single-call MVP route)           |  |  |
|  |  |    Summarizes tool    |                                                  |  |
|  |  |    results for SOC    |                                                  |  |  |
|  |  +-----------------------+                                                  |  |  |
|  |                                                                             |  |
|  +-----------------------------------------------------------------------------+  |
|                                    |                                              |
+------------------------------------+----------------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
+-------------------------------+           +-----------------------------------+
| ELASTIC MCP SERVER CONTAINER  |           | OLLAMA HOST / TUNNEL              |
|                               |           |                                   |
| - Tool Discovery              |           | - `gemma4:e4b` model              |
| - JSON Schema Export          |           | - Low temp (0.2), 120s timeout    |
| - Elasticsearch Client        |           | - Local or Cloudflare Tunnel      |
+-------------------------------+           +-----------------------------------+
           |
           v
+-------------------------------+
| ELASTICSEARCH CONTAINER       |
|                               |
| - `alerts-security` index     |
| - 200 seeded security logs    |
+-------------------------------+
```

---

## 2. Parallel Work Division (Track A vs Track B)

To maintain clean separation of concerns and avoid git conflicts:

| Feature Dimension | Track A — Mayank (Platform & Host) | Track B — Vinit (Agent Core) |
| --- | --- | --- |
| **Primary Domain** | LLM Host, Tunnels, ES Seed, Docker Env | LangGraph Agent, Session, Context, API |
| **Code Locations** | `docker/`, `scripts/`, `docs/mcp/` | `backend/app/agent/`, `backend/app/session/`, `backend/app/main.py` |
| **Key Deliverables**| `share-ollama-tunnel.sh`, seed scripts, `.env` | `llm.py`, `state.py`, `context.py`, `nodes.py`, `graph.py`, `manager.py`, `main.py` route |
| **LLM Responsibility**| Model availability & host GPU load | Node prompt engineering & parsing |

---

## 3. Deep-Dive: Track B Implementation Details (Task by Task)

### Task B0 — Baseline Environment Verification
- **Objective:** Ensure all foundational dependencies are healthy prior to graph development.
- **Verification Steps:**
  - Stack initialization via `./scripts/dev-up.sh`.
  - Elasticsearch reachability on `http://localhost:9200`.
  - Elastic MCP Server ping on `http://localhost:8080/ping` (`tool_count: 5`).
  - Seed dataset verification (`alerts-security` index containing 200 documents).
  - Host/Remote Ollama model check (`gemma4:e4b` present).

---

### Task B1 — Branch Setup & Package Architecture
- **Objective:** Establish isolated workspace and clean python package modularity.
- **Git Branch:** `feat/phase-1b-agent` (branched from `main`).
- **Files Created:**
  - `backend/app/agent/__init__.py`: Package entry re-exporting key primitives.
  - `backend/app/agent/llm.py`: ChatOllama client factory stub.
  - `backend/app/agent/state.py`: TypedDict state definition & guards.
  - `backend/app/agent/context.py`: ContextBuilder stub.
  - `backend/app/agent/nodes.py`: Node functions stubs (`planner`, `router`, `executor`, `observer`, `finalizer`).
  - `backend/app/agent/graph.py`: StateGraph compilation stub.
  - `backend/app/session/__init__.py`: Session package init.
  - `backend/app/session/manager.py`: SessionManager stub.

---

### Task B2 — LLM Client Factory (`backend/app/agent/llm.py`)
- **Objective:** Provide a centralized `ChatOllama` factory configured for SOC security tasks and remote tunnel resiliency.
- **Implementation:**
  - Reads `OLLAMA_URL` (defaults to `http://host.docker.internal:11434`) and `GEMMA_MODEL_TAG` (defaults to `gemma4:e4b`).
  - Strips trailing slashes to prevent invalid request paths.
  - Applies `temperature=0.2` for deterministic, factual security outputs.
  - Applies `timeout=120` seconds to withstand network latency over Cloudflare tunnels.
- **Verification:** Live invocation test inside Docker backend container against remote Cloudflare tunnel:
  ```python
  model = get_chat_model()
  res = await model.ainvoke("Say hi in exactly 5 words.")
  # Output: AIMessage(content="Hello there, how are you doing?")
  ```

---

### Task B3 — In-Memory Session Manager (`backend/app/session/manager.py`)
- **Objective:** Track multi-turn conversation history across user interactions.
- **Implementation:**
  - `SessionManager` class maintaining an in-memory dictionary `_sessions`.
  - `get_or_create(session_id=None)`: Returns an existing session or generates a new UUID v4 string if absent.
  - `append_user(session_id, message)` & `append_assistant(session_id, message)`: Defensively appends structured message objects `{"role": "user"|"assistant", "content": "..."}`.
  - `get_history(session_id)`: Returns a copy of the message history.
- **Architectural Note:** Session state is held in-memory for MVP simplicity. Re-starting the FastAPI container resets sessions.

---

### Task B4 — Context Builder & System Prompt (`backend/app/agent/context.py`)
- **Objective:** Construct a rich, structured prompt context for Gemma, injecting live MCP tool descriptions, SOC rules, and conversation history.
- **Implementation:**
  - **SOC System Prompt:** Instructs Gemma on its role as a SOC assistant, specifies primary target index `alerts-security`, and enforces strict JSON formatting for tool invocations:
    ```text
    TOOL_CALL: {"tool": "<tool_name>", "arguments": {<args>}}
    ```
  - **Schema Formatter (`_format_tool_descriptions`)**: Dynamically parses JSON Schema from MCP tool definitions into human-readable text detailing required and optional parameters with type signatures.
  - **History Window (`_trim_history`)**: Limits history to the last 10 messages (5 turns) to protect the model's context window.
- **Verification:** Verified formatted system prompt rendering all 5 MCP tools (`list_indices`, `get_mappings`, `esql`, `get_shards`, `search`).

---

### Task B5 — LangGraph StateGraph Core (`state.py`, `nodes.py`, `graph.py`)
- **Objective:** Construct the typed state object, node logic, and state graph transitions.

#### 1. `AgentState` Schema (`backend/app/agent/state.py`)
```python
class AgentState(TypedDict, total=False):
    session_id: str
    question: str
    messages: list          # Chat history
    plan: str               # Planner raw output
    tool_name: str | None   # Target tool name
    tool_args: dict | None  # Target tool parameters
    tool_result: str | None # Raw tool response
    tools_used: list[str]   # Accumulator of invoked tools
    observations: str       # Observer synthesized analysis
    answer: str             # Final analyst-facing text
    error: str | None       # Guard error state
    iteration: int          # Loop iteration counter
```
*Guard Constraint:* `MAX_TOOL_ITERATIONS = 3`.

#### 2. Node Factories (`backend/app/agent/nodes.py`)
- **`make_planner(llm, context_builder)`**: Assembles context and calls Gemma to produce an investigation plan or `TOOL_CALL`.
- **`make_router(registry)`**: Parses `TOOL_CALL` via regex `r'TOOL_CALL:\s*(\{.*\})'`. Validates tool name against `registry.list_names()`.
- **`make_executor(registry)`**: Executes the requested tool via `registry.execute()`. Converts response to text and truncates to 6,000 characters to prevent prompt bloat.
- **`make_observer(llm)`**: Directs Gemma to interpret tool outputs specifically against security fields (severity, IPs, rules).
- **`make_finalizer()`**: Extracts final answer from observations or direct plan output, removing raw `TOOL_CALL` strings.

#### 3. Graph Routing & Compilation (`backend/app/agent/graph.py`)
- Configured state graph edges:
  - `planner` -> `router`
  - `router` -> conditional: `executor` (if `tool_name` present) OR `finalizer` (if no tool needed)
  - `executor` -> `observer`
  - `observer` -> conditional: `finalizer` (MVP single-tool route) or `router` (if iteration < `MAX_TOOL_ITERATIONS`)
- Exposed `run_agent(question, registry, session_id)` async execution function.

---

### Task B6 — Live ToolRegistry Executor Verification
- **Objective:** Verify execution of real MCP tools against live Elasticsearch containers without relying on LLM availability.
- **Verification Results:**
  1. **`search` Tool:** Executed query against `alerts-security`. Successfully retrieved seeded alert logs with fields (`destination.ip`, `event.severity`, `rule.name`).
  2. **`list_indices` Tool:** Successfully listed `alerts-security` index with `docs.count: 200`.
  3. **Output Truncation:** Executed query returning 50 documents (> 15,000 characters). Truncated cleanly to 6,016 characters ending in `... [truncated]`.
  4. **Error Handling:** Executed query against non-existent index. Caught HTTP 404 cleanly and set state `tool_result: "Tool execution error: HTTP 404"`.

---

### Task B7 — Public API Endpoint (`POST /debug/agent-run`)
- **Objective:** Expose the agent pipeline as an HTTP POST endpoint for client and debug verification.
- **Implementation in `backend/app/main.py`:**
  - Request Model: `AgentRunRequest(question: str, session_id: str | None)`
  - Response Model: `AgentRunResponse(session_id: str, answer: str, plan: str, tools_used: list[str], iterations: int, error: str | None)`
  - Input Guard: Rejects empty or whitespace-only questions with HTTP 400 (`question must not be empty`).
  - Execution: Involves FastAPI dependency injection (`Depends(get_registry)`) and calls `run_agent()`.
- **Verification:**
  - `POST /debug/agent-run` with `{"question": ""}` -> HTTP 400 (`PASSED`).
  - `POST /debug/agent-run` with `{"question": "Show high severity malware alerts"}` -> HTTP 200 (`PASSED`).

---

### Task B8 — System Hardening & Edge Case Resilience
- **Objective:** Ensure the end-to-end agent application gracefully handles network drops, invalid model JSON, empty responses, and timeouts without crashing.
- **Implementation & Protections:**
  1. **MCP Startup Failure Guard (`main.py`)**: Replaced unhandled `RuntimeError` in `get_registry()` with FastAPI `HTTPException(status_code=503, detail="ToolRegistry not available...")`.
  2. **Planner Empty LLM Output Guard (`nodes.py`)**: Catches `None` or empty string outputs from Gemma and sets a safe error string instead of proceeding with empty plans.
  3. **300s Execution Timeout Guard (`graph.py`)**: Wrapped graph `ainvoke` with `asyncio.wait_for(timeout=300)` to prevent hung model connections from blocking FastAPI workers.
  4. **Malformed JSON Recovery (`nodes.py`)**: Router node catches `JSONDecodeError` on malformed model `TOOL_CALL` strings and passes readable diagnostic messages to the Finalizer.
- **Hardening Test Suite Verification:**
  - Empty Question -> HTTP 400 (`PASSED`)
  - Missing Body Fields / Invalid JSON -> HTTP 422 (`PASSED`)
  - Malformed Model JSON -> HTTP 200 with clean error explanation (`PASSED`)
  - Unreachable MCP -> HTTP 503 (`PASSED`)
  - Existing `/health` & `/debug/mcp-tools` -> HTTP 200 (`PASSED`)

---

## 4. Complete File Inventory (Phase 1B Track B)

| Relative Path | Status | Role |
| --- | --- | --- |
| `backend/app/agent/__init__.py` | Complete | Package exports |
| `backend/app/agent/llm.py` | Complete | `ChatOllama` factory |
| `backend/app/agent/state.py` | Complete | `AgentState` schema & limits |
| `backend/app/agent/context.py` | Complete | Prompt & system context builder |
| `backend/app/agent/nodes.py` | Complete | 5 LangGraph node factories |
| `backend/app/agent/graph.py` | Complete | StateGraph compilation & `run_agent()` |
| `backend/app/session/__init__.py` | Complete | Session package exports |
| `backend/app/session/manager.py` | Complete | In-memory session manager |
| `backend/app/main.py` | Complete | FastAPI routes (`POST /debug/agent-run`) & 503 guard |
| `docs/engineering/implementation/phase-1b-track-b.md` | Complete | Living implementation log |

---

## 5. Phase 1B Definition of Done (DoD) Verification

Track B is 100% complete and fully verified. The agent pipeline satisfies all Phase 1B criteria:

1. ✅ `POST /debug/agent-run` accepts natural-language SOC questions.
2. ✅ System prompt dynamically injects live Elastic MCP tool schemas.
3. ✅ Router correctly extracts and validates `TOOL_CALL` directives.
4. ✅ Executor queries real `alerts-security` indices over MCP and enforces a 6,000 character context cap.
5. ✅ Observer node summarizes structured log hits for analysts.
6. ✅ Multi-turn conversation tracking is supported via `session_id`.
7. ✅ System is hardened against timeouts, missing fields, malformed LLM outputs, and MCP outages.
