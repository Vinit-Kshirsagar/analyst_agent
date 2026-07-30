"""
Phase 2 — Product chat API.

POST /api/chat         → full JSON answer (wraps run_agent)
POST /api/chat/stream  → SSE events for progressive UI consumption

Debug endpoint POST /debug/agent-run remains for engineers.
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.schemas import ChatRequest, ChatResponse
from app.agent.graph import run_agent
from app.deps import get_registry
from app.tools import ToolRegistry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


async def run_chat(body: ChatRequest, registry: ToolRegistry) -> ChatResponse:
    """Shared implementation for /api/chat."""
    message = (body.message or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message must not be empty")

    try:
        result = await run_agent(
            question=message,
            registry=registry,
            session_id=body.session_id,
        )
    except Exception as exc:
        logger.exception("api/chat failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution error: {exc}",
        ) from exc

    return ChatResponse(
        session_id=result["session_id"],
        answer=result.get("answer") or "",
        plan=result.get("plan") or "",
        tools_used=list(result.get("tools_used") or []),
        iterations=int(result.get("iterations") or 0),
        error=result.get("error"),
    )


def _sse(event: str, data: dict[str, Any]) -> str:
    payload = json.dumps(data, default=str)
    return f"event: {event}\ndata: {payload}\n\n"


async def chat_event_stream(
    body: ChatRequest,
    registry: ToolRegistry,
) -> AsyncIterator[str]:
    """
    SSE stream for progressive clients.

    run_agent is still a single await; we emit lifecycle events around it:
      status → tools → answer → result → done
    """
    message = (body.message or "").strip()
    if not message:
        yield _sse("error", {"detail": "message must not be empty", "status_code": 400})
        yield _sse("done", {"ok": False})
        return

    yield _sse(
        "status",
        {
            "phase": "running",
            "message": "Agent started",
            "session_id": body.session_id,
        },
    )

    try:
        result = await run_agent(
            question=message,
            registry=registry,
            session_id=body.session_id,
        )
    except Exception as exc:
        logger.exception("api/chat/stream failed: %s", exc)
        yield _sse("error", {"detail": str(exc), "status_code": 500})
        yield _sse("done", {"ok": False})
        return

    yield _sse(
        "tools",
        {
            "tools_used": list(result.get("tools_used") or []),
            "iterations": int(result.get("iterations") or 0),
            "session_id": result["session_id"],
        },
    )
    yield _sse(
        "answer",
        {
            "session_id": result["session_id"],
            "answer": result.get("answer") or "",
            "plan": result.get("plan") or "",
            "error": result.get("error"),
        },
    )
    yield _sse(
        "result",
        {
            "session_id": result["session_id"],
            "answer": result.get("answer") or "",
            "plan": result.get("plan") or "",
            "tools_used": list(result.get("tools_used") or []),
            "iterations": int(result.get("iterations") or 0),
            "error": result.get("error"),
        },
    )
    yield _sse("done", {"ok": True, "session_id": result["session_id"]})


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    registry: ToolRegistry = Depends(get_registry),
):
    """
    Product chat endpoint.

    Body: { "message": "...", "session_id": null | "uuid" }
    Returns the same core fields as /debug/agent-run (stable UI contract).
    """
    return await run_chat(body, registry)


@router.post("/chat/stream")
async def chat_stream(
    body: ChatRequest,
    registry: ToolRegistry = Depends(get_registry),
):
    """
    SSE chat endpoint for progressive UIs.

    Events: status, tools, answer, result, error, done
    Content-Type: text/event-stream
    """
    return StreamingResponse(
        chat_event_stream(body, registry),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
