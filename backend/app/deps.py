"""Shared FastAPI dependencies (avoids circular imports between main and api)."""
from fastapi import HTTPException

from app.tools import ToolRegistry

# Set by main.lifespan on startup
tool_registry: ToolRegistry | None = None


async def get_registry() -> ToolRegistry:
    if tool_registry is None:
        raise HTTPException(
            status_code=503,
            detail="ToolRegistry not available — MCP server connection failed at startup. "
            "Check that the MCP server is healthy and restart the backend.",
        )
    return tool_registry
