"""
Backend API — Phase 1B agent + Phase 2 product chat.

Integrates:
  - App lifespan that starts/stops the global MCPClient session (from app.mcp)
  - ToolRegistry (from app.tools)
  - GET /health            → real dependency checks (ES, Ollama, MCP ping)
  - GET /debug             → phase info + tool registry metrics
  - GET /debug/mcp-tools   → list all MCP-discovered tools + schemas
  - POST /debug/mcp-call   → test execute an MCP tool
  - POST /debug/agent-run  → run full LangGraph agent for a question
  - POST /api/chat         → product chat JSON (Phase 2)
  - POST /api/chat/stream  → product chat SSE (Phase 2)

Ollama runs on the HOST (host.docker.internal:11434).
ES and MCP run in Docker on the agent-network.
"""
import logging
import os
from contextlib import asynccontextmanager

import httpx
from elasticsearch import Elasticsearch
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.mcp import (
    get_mcp_client,
    start_global_client,
    stop_global_client,
    MCPClient,
)
from app.tools import ToolRegistry
from app.agent.graph import run_agent
from app import deps
from app.deps import get_registry
from app.api.chat import router as chat_router

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434")
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8080")
GEMMA_MODEL_TAG = os.getenv("GEMMA_MODEL_TAG", "gemma4:e4b")


# ---------------------------------------------------------------------------
# Lifespan — manages the global MCP client session
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: open the MCP client session + build the tool registry.
    Shutdown: cleanly close the MCP session.
    """
    try:
        await start_global_client()
        client = await get_mcp_client()
        deps.tool_registry = await ToolRegistry.from_mcp_client(client)
        logger.info("Tool registry ready: %s", deps.tool_registry.list_names())
    except Exception as exc:
        deps.tool_registry = None
        logger.warning(
            "Startup: MCP client failed to connect (%s). "
            "Tool endpoints will be unavailable until MCP is healthy.",
            exc,
        )

    yield  # application runs here

    await stop_global_client()
    deps.tool_registry = None
    logger.info("MCP session closed — shutdown complete.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Security Agent — Phase 2 (Chat API)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Product chat routes (Phase 2)
app.include_router(chat_router)


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    """
    Real reachability check for all dependencies.
    """
    components: dict = {}

    # Elasticsearch
    try:
        es = Elasticsearch(ES_URL)
        components["elasticsearch"] = {
            "status": "connected" if es.ping() else "unreachable"
        }
    except Exception as e:
        components["elasticsearch"] = {"status": "error", "detail": str(e)}

    # Ollama (host)
    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
        tags = [m["name"] for m in r.json().get("models", [])]
        components["ollama"] = {
            "status": "connected" if GEMMA_MODEL_TAG in tags else "model_missing",
            "models": tags,
        }
    except Exception as e:
        components["ollama"] = {"status": "error", "detail": str(e)}

    # MCP server (HTTP ping)
    try:
        r = httpx.get(f"{MCP_SERVER_URL}/ping", timeout=5.0)
        components["mcp_server"] = {
            "status": "connected" if r.status_code == 200 else "unreachable",
            "tool_registry": (
                deps.tool_registry.list_names()
                if deps.tool_registry
                else "not_initialised"
            ),
        }
    except Exception as e:
        components["mcp_server"] = {"status": "error", "detail": str(e)}

    overall = (
        "healthy"
        if all(c.get("status") == "connected" for c in components.values())
        else "degraded"
    )
    return {"status": overall, "components": components}


# ---------------------------------------------------------------------------
# Debug endpoints
# ---------------------------------------------------------------------------
@app.get("/debug")
async def debug():
    """Phase info and live tool registry metrics."""
    return {
        "phase": "2",
        "mcp_server_url": MCP_SERVER_URL,
        "apis": {
            "chat": "POST /api/chat",
            "chat_stream": "POST /api/chat/stream",
            "agent_run_debug": "POST /debug/agent-run",
        },
        "tool_registry": (
            {
                "tools": deps.tool_registry.list_names(),
                "call_counts": deps.tool_registry.call_counts(),
            }
            if deps.tool_registry
            else "not_initialised"
        ),
    }


@app.get("/debug/mcp-tools")
async def debug_mcp_tools(registry: ToolRegistry = Depends(get_registry)):
    """
    List all tools exposed by the Elastic MCP Server, with their JSON schemas.
    """
    return {
        "tool_count": len(registry.list_names()),
        "tools": registry.tool_schemas(),
    }


@app.post("/debug/mcp-call")
async def debug_mcp_call(
    tool_name: str,
    arguments: dict,
    registry: ToolRegistry = Depends(get_registry),
):
    """
    Execute a named MCP tool with arbitrary arguments.
    """
    try:
        result = await registry.execute(tool_name, arguments)
        return {"tool": tool_name, "result": result}
    except KeyError as e:
        return {"error": str(e), "available_tools": registry.list_names()}
    except Exception as e:
        logger.exception("Tool execution failed: %s", e)
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Agent endpoint — Phase 1B
# ---------------------------------------------------------------------------
class AgentRunRequest(BaseModel):
    """Request body for POST /debug/agent-run."""
    question: str
    session_id: str | None = None


class AgentRunResponse(BaseModel):
    """Response body for POST /debug/agent-run."""
    session_id: str
    answer: str
    plan: str
    tools_used: list[str]
    iterations: int
    error: str | None = None


@app.post("/debug/agent-run", response_model=AgentRunResponse)
async def debug_agent_run(
    body: AgentRunRequest,
    registry: ToolRegistry = Depends(get_registry),
):
    """
    Run the full LangGraph agent for a natural-language SOC question.

    Returns the agent's answer, execution plan, tools used, and any errors.
    Supports multi-turn via optional session_id.
    """
    # Validate question
    if not body.question or not body.question.strip():
        raise HTTPException(status_code=400, detail="question must not be empty")

    try:
        result = await run_agent(
            question=body.question.strip(),
            registry=registry,
            session_id=body.session_id,
        )
        return AgentRunResponse(**result)
    except Exception as exc:
        logger.exception("agent-run failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution error: {exc}",
        )
