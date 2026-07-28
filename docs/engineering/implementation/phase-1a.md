# Phase 1A Implementation: MCP Client & Tool Registry

**Status:** ✅ COMPLETE  
**Completion Date:** 2026-07-27  
**Index:** [README.md](./README.md)  
**Primary implementer (MCP):** Vinit · **Host / tunnel ops:** Mayank

---

## 1. Overview

Phase 1A implemented the **client-side Model Context Protocol (MCP) integration** within the FastAPI backend (`backend/app/mcp/`) and constructed a dynamic **Tool Registry** (`backend/app/tools/`). Additionally, Phase 1A introduced support for a shared remote Ollama setup over Cloudflare Tunnel for team members with hardware limitations.

### What Phase 1A means in one line

> “The backend can discover Elastic tools and run searches against seeded ES data; Gemma can be shared over a tunnel for teammates.”

---

## 2. Implemented Architecture & Data Flow

Phase 1A connects the FastAPI application directly to the Elastic MCP Server running on port `8080` over the **MCP Streamable HTTP** transport protocol.

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

---

## 3. Package & Code Structure

The MCP integration and tool catalog were added under `backend/app/`:

```text
backend/app/
├── mcp/                      # Model Context Protocol Client & Transport
│   ├── __init__.py           # Package exports (MCPClient, lifespan hooks)
│   ├── client.py             # Client manager & connection singleton
│   └── transport.py          # Streamable HTTP transport configuration
│
├── tools/                    # Dynamic Tool Catalog & Registry
│   ├── __init__.py           # Package exports (ToolRegistry)
│   └── registry.py           # ToolRegistry class & schema adapter
│
└── main.py                   # Lifespan startup/shutdown integration

backend/scripts/
└── test_mcp.py               # Standalone MCP smoke-test script
```

---

## 4. Key Achievements & Features

### 4.1 MCP Client Package (`app/mcp/`)
* **Protocol & Endpoint:** Configured to use `Streamable HTTP` over `http://mcp-server:8080/mcp`.
* **Adapters & SDK Compatibility:** Implemented using `langchain-mcp-adapters` (`>=0.1.0`) and Python `mcp` (`>=1.1.0`).
* **Lifecycle Management:** Added startup/shutdown hooks (`start_global_client`, `stop_global_client`) bound to FastAPI's `lifespan` manager for clean connection pooling.

### 4.2 Dynamic Tool Registry (`app/tools/`)
* **Tool Discovery:** Automatically discovers tools exposed by the Elastic MCP server upon backend startup.
* **LangChain Integration:** Converts raw MCP tool schemas into standard LangChain `BaseTool` instances for use inside LangGraph.
* **Discovered Elastic Tools (5 Core Tools):**
  1. `search`: Executes Elasticsearch Query DSL (`index`, `query_body`).
  2. `get_mappings`: Fetches index field mapping structure (`index`).
  3. `list_indices`: Returns available indices matching a pattern (`index_pattern`).
  4. `esql`: Executes ES|QL query strings (`query`).
  5. `get_shards`: Retrieves cluster shard allocation details (`index`).
* **Schema Adapter Fix:** Updated schema extraction to properly handle raw dict JSON schemas under `args_schema`.

### 4.3 Verification Endpoints & Smoke Tests
* **`GET /debug/mcp-tools`**: Returns all registered MCP tools and their full input JSON schemas.
* **`POST /debug/mcp-call`**: Endpoint allowing manual invocation of any registered MCP tool over HTTP.
* **`backend/scripts/test_mcp.py`**: Standalone command-line verification script.

### 4.4 Shared Remote Gemma via Cloudflare Tunnel
* **Objective:** Enable team members on machines unable to run `gemma4:e4b` locally (e.g. M1 Macs) to use the host's GPU/Ollama instance.
* **Tunnel Command:** Host runs `cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost`.
* **Operational Fix:** Documented container recreation requirement (`docker compose up -d --force-recreate backend`) to refresh container environment variables when `OLLAMA_URL` changes in `docker/.env`.

---

## 5. Technical Issues Resolved During Phase 1A

1. **`MultiServerMCPClient` API Update:**
   - Fixed `TypeError` caused by removal of async context manager support in `langchain-mcp-adapters v0.1.0+` by directly instantiating client and calling `await client.get_tools()`.
2. **Transport Path Alignment:**
   - Corrected transport endpoint path from legacy `/sse` to `/mcp` (Streamable HTTP specification).
3. **Pydantic / Dict Schema Extraction:**
   - Fixed empty input schema resolution by accommodating dict-based `args_schema` structures.
4. **Dependency Pin Relaxation:**
   - Upgraded `fastapi` dependency constraint in `requirements.txt` to `>=0.111.0` to resolve Starlette/AnyIO conflicts with the `mcp` Python SDK.
5. **Stale container env for remote Ollama:**
   - Updating `docker/.env` alone left backend on old `OLLAMA_URL`; fixed by documenting `--force-recreate backend` and later Track A env contract.

---

## 6. What Phase 1A deliberately did **not** include

- LangGraph Planner → Finalizer loop  
- Session Manager / Context Builder  
- `POST /debug/agent-run` or product chat API  
- Automatic natural-language → tool selection (still manual `/debug/mcp-call`)

That is **Phase 1B** (agent). Platform hardening for 1B is [phase-1b-a.md](./phase-1b-a.md).

---

## 7. How to re-verify Phase 1A surface

```bash
curl -s http://localhost:8000/debug/mcp-tools | python3 -m json.tool
# tool_count: 5

curl -s -X POST 'http://localhost:8000/debug/mcp-call?tool_name=search' \
  -H 'Content-Type: application/json' \
  -d '{"index":"alerts-security","query_body":{"query":{"match_all":{}},"size":2}}'
# Total results: 200 (after seed)
```

---

## 8. Related

- Detailed MCP write-up: [../mcp/setup_1.md](../../mcp/setup_1.md)  
- Shared Gemma tunnel: [../mcp/shared-gemma-tunnel.md](../../mcp/shared-gemma-tunnel.md)
