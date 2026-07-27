# MCP Integration Setup & Architecture Guide (Setup 1)

This document provides a comprehensive guide to the **Model Context Protocol (MCP) integration** built for the Autonomous Security Agent backend. It covers what was built, how the architecture works, directory structure, problems encountered, and how they were resolved.

---

## 1. Executive Summary

In Phase 1 of the Autonomous Security Agent, we connected the **FastAPI Python backend** to the **Elasticsearch MCP Server** (`docker.elastic.co/mcp/elasticsearch:0.4.0`) running inside Docker Compose on port `8080`. 

The integration allows the backend to:
1. **Dynamically discover** all search and analysis tools exposed by the Elastic MCP server.
2. **Convert MCP tool schemas** into standard LangChain `BaseTool` objects.
3. **Register and execute tools** dynamically on behalf of the LangGraph agent.
4. **Expose verification & debug endpoints** (`GET /debug/mcp-tools`, `POST /debug/mcp-call`) and a standalone smoke test script (`test_mcp.py`).

---

## 2. Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FastAPI Backend Container (:8000)                                                │
│                                                                                 │
│  [ FastAPI Lifespan ] ──(Startup)──► [ MCPClient (app/mcp/client.py) ]          │
│                                              │                                  │
│                                              ▼ (Streamable HTTP /mcp)           │
│                                      [ ToolRegistry (app/tools/registry.py) ] │
│                                              │                                  │
│  [ /debug/mcp-tools ] ◄──────────────────────┤ (Exposes 5 Discovered Tools)     │
│  [ /debug/mcp-call  ] ───────────────────────► [ Execute Tool ]                  │
└──────────────────────────────────────────────┼──────────────────────────────────┘
                                               │
                                               ▼ JSON-RPC 2.0 over Streamable HTTP
┌──────────────────────────────────────────────┴──────────────────────────────────┐
│ mcp-server Container (:8080)                                                    │
│ (docker.elastic.co/mcp/elasticsearch:0.4.0)                                     │
└──────────────────────────────────────────────┬──────────────────────────────────┘
                                               │
                                               ▼ Elasticsearch Query DSL
┌──────────────────────────────────────────────┴──────────────────────────────────┐
│ elasticsearch Container (:9200)                                                 │
│ Index: alerts-security (Seeded logs)                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Transport Protocol
- **Server:** Elastic MCP Server (`v0.4.0`)
- **Transport:** **MCP Streamable HTTP** (endpoint: `http://mcp-server:8080/mcp`)
- **Protocol:** JSON-RPC 2.0 specification over HTTP streamable connection
- **Library:** `langchain-mcp-adapters` (`v0.1.0+`) with `mcp` Python SDK (`v1.1.0+`)

---

## 3. Directory & File Structure

The backend code is organized into modular packages under `backend/app/`:

```text
backend/app/
├── mcp/                      # Model Context Protocol Client & Transport
│   ├── __init__.py           # Package exports (MCPClient, lifespan helpers)
│   ├── client.py             # MCPClient manager & singleton hooks
│   └── transport.py          # Streamable HTTP transport configuration
│
├── tools/                    # Tool Catalog & Registry
│   ├── __init__.py           # Package exports (ToolRegistry)
│   └── registry.py           # ToolRegistry class & schema extractor
│
└── main.py                   # FastAPI app & lifespan connection manager

backend/scripts/
└── test_mcp.py               # Standalone MCP smoke-test script
```

---

## 4. Component Details

### 4.1 Transport Configuration (`app/mcp/transport.py`)
Configures the endpoint URL (`http://mcp-server:8080/mcp`) and specifies the `streamable_http` transport type for `MultiServerMCPClient`.

### 4.2 MCP Client (`app/mcp/client.py`)
- Manages the lifecycle of the `MultiServerMCPClient`.
- Implements `connect()`, `disconnect()`, `get_tools()`, `call_tool()`, and `list_tool_schemas()`.
- Provides process-wide startup/shutdown hooks (`start_global_client`, `stop_global_client`) tied to FastAPI's lifespan.

### 4.3 Tool Registry (`app/tools/registry.py`)
- Holds a named catalog of discovered `BaseTool` instances.
- Extracts JSON input schemas for LLM prompt injection.
- Tracks execution metrics (call counts per tool).
- Provides `execute(tool_name, arguments)` method.

---

## 5. Discovered Tools Overview

The Elastic MCP Server automatically registers **5 core tools**:

| Tool Name | Purpose | Required Arguments |
| --- | --- | --- |
| **`search`** | Execute Elasticsearch query DSL | `index` (str), `query_body` (dict) |
| **`get_mappings`** | Fetch field mappings for an index | `index` (str) |
| **`list_indices`** | List available ES indices | `index_pattern` (str) |
| **`esql`** | Execute an ES\|QL query | `query` (str) |
| **`get_shards`** | Get cluster shard details | `index` (optional str) |

---

## 6. Problems Encountered & Resolutions

### Problem 1: `langchain-mcp-adapters` API Breaking Change
- **Symptom:** `TypeError / ValueError: MultiServerMCPClient cannot be used as a context manager`.
- **Root Cause:** In version `0.1.0+`, `MultiServerMCPClient` removed async context manager support (`async with MultiServerMCPClient`).
- **Resolution:** Updated `MCPClient` to instantiate `MultiServerMCPClient(config)` directly and call `await client.get_tools()` without a context manager block.

### Problem 2: Transport Protocol Mismatch (`/sse` vs `/mcp`)
- **Symptom:** Connection attempts to `http://mcp-server:8080/sse` failed with `404 Not Found`, and GET requests to `/mcp` returned `406 Not Acceptable: Client must accept text/event-stream`.
- **Root Cause:** Elastic MCP Server v0.4.0 uses **MCP Streamable HTTP** protocol on path `/mcp`, not the legacy `/sse` path.
- **Resolution:** Configured `transport: "streamable_http"` and set endpoint URL to `http://mcp-server:8080/mcp` in `app/mcp/transport.py`.

### Problem 3: Tool Input Schema Extraction Failure
- **Symptom:** `/debug/mcp-tools` returned empty `input_schema: {}` for all tools.
- **Root Cause:** Tools created by `langchain-mcp-adapters` return raw JSON Schema `dict` objects under `args_schema` instead of Pydantic model classes (`.model_json_schema()`).
- **Resolution:** Updated `list_tool_schemas()` in `MCPClient` and `ToolRegistry` to check `isinstance(tool.args_schema, dict)` and return the dict directly.

### Problem 4: Python Package Dependency Conflicts
- **Symptom:** `pip` reported incompatible dependency constraints between `fastapi==0.104.1` and `anyio 4.x` / `starlette 1.x` required by modern `mcp` SDK packages.
- **Resolution:** Relaxed pins in `backend/requirements.txt`:
  ```text
  fastapi>=0.111.0
  uvicorn[standard]>=0.29.0
  httpx>=0.27.0
  mcp>=1.1.0
  langchain-mcp-adapters>=0.1.0
  ```

### Problem 5: Tool Parameter Name Validation
- **Symptom:** Executing `search` with `{"query": ...}` threw `missing field query_body`, and `list_indices` threw `missing field index_pattern`.
- **Root Cause:** Elastic MCP Server expects specific schema field names (`query_body` for `search`, `index_pattern` for `list_indices`).
- **Resolution:** Updated the parameter mapping in `test_mcp.py` and documented exact field requirements in `ToolRegistry`.

---

## 7. How to Verify & Test

### 7.1 Verify Discovered Tools via Endpoint
```bash
curl -s http://localhost:8000/debug/mcp-tools | python3 -m json.tool
```

### 7.2 Execute Tool via Test Endpoint
```bash
curl -s -X POST "http://localhost:8000/debug/mcp-call?tool_name=search" \
     -H "Content-Type: application/json" \
     -d '{"index": "alerts-security", "query_body": {"query": {"match_all": {}}, "size": 2}}'
```

### 7.3 Run Standalone Smoke Test
```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env \
  exec backend python /app/scripts/test_mcp.py
```

---

## 8. Summary & Next Steps

The MCP client and tool registry infrastructure is fully operational, verified against live Elasticsearch seeded data, and modularly structured under `backend/app/mcp/` and `backend/app/tools/`. 

This completes the MCP integration prerequisite for Phase 1. The agent workflow layer can now consume `ToolRegistry` tools directly in the LangGraph state machine.
