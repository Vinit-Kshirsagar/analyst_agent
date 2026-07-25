"""
Phase 0 skeleton API.
Purpose: prove Elasticsearch, Ollama, and MCP Server are reachable from the
backend container over the Docker network. No agent/LangGraph logic here —
that begins in Phase 1. CORS is enabled so the Next.js frontend (port 3000)
can call this API from the browser.
"""
import os

import httpx
from elasticsearch import Elasticsearch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Security Agent - Phase 0 Skeleton")

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

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8080")
GEMMA_MODEL_TAG = os.getenv("GEMMA_MODEL_TAG", "gemma4:e4b")


@app.get("/health")
def health():
    """Reports true reachability of each dependency, not just container state."""
    components = {}

    try:
        es = Elasticsearch(ES_URL)
        components["elasticsearch"] = {
            "status": "connected" if es.ping() else "unreachable"
        }
    except Exception as e:
        components["elasticsearch"] = {"status": "error", "detail": str(e)}

    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
        tags = [m["name"] for m in r.json().get("models", [])]
        components["ollama"] = {
            "status": "connected" if GEMMA_MODEL_TAG in tags else "model_missing",
            "models": tags,
        }
    except Exception as e:
        components["ollama"] = {"status": "error", "detail": str(e)}

    try:
        r = httpx.get(f"{MCP_SERVER_URL}/ping", timeout=5.0)
        components["mcp_server"] = {
            "status": "connected" if r.status_code == 200 else "unreachable"
        }
    except Exception as e:
        components["mcp_server"] = {"status": "error", "detail": str(e)}

    overall = (
        "healthy"
        if all(c.get("status") == "connected" for c in components.values())
        else "degraded"
    )

    return {"status": overall, "components": components}


@app.get("/debug")
def debug():
    """Placeholder debug endpoint. Metrics/tracing land in Phase 1+."""
    return {"phase": "0", "note": "Full metrics implemented in Phase 1."}
