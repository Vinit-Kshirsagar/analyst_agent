"""
MCP Client — Phase 1
Connects to the Elastic MCP Server (Streamable HTTP :8080/mcp) using the
official langchain-mcp-adapters library.

Transport: The Elastic MCP Server v0.4.0 uses MCP Streamable HTTP protocol
  at the /mcp endpoint (NOT the legacy /sse path).
  langchain-mcp-adapters transport key: "streamable_http"

API note (langchain-mcp-adapters >= 0.1.0):
  MultiServerMCPClient is NOT a context manager. Use:
    client = MultiServerMCPClient({...})
    tools = await client.get_tools()

Responsibilities:
  - Discover available MCP tools (with JSON schemas)
  - Convert them into LangChain BaseTool objects for the Tool Registry
  - Execute individual tool calls
  - Expose a module-level singleton for FastAPI lifespan management
"""
import logging
import os
from typing import Any

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.mcp.transport import get_mcp_server_config, MCP_SERVER_URL

logger = logging.getLogger(__name__)


class MCPClient:
    """
    Wrapper around langchain-mcp-adapters MultiServerMCPClient.

    Connects to the Elastic MCP server over Streamable HTTP transport.
    Tool schemas and LangChain BaseTool objects are cached after the
    first call to connect().
    """

    def __init__(self, server_url: str | None = None) -> None:
        self.server_url = server_url or os.getenv("MCP_SERVER_URL", MCP_SERVER_URL)
        self._tools: list[BaseTool] | None = None

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """
        Initialise the MCP client and fetch all available tools.
        """
        config = get_mcp_server_config(self.server_url)
        logger.info("MCPClient: connecting to %s", self.server_url)

        client = MultiServerMCPClient(config)
        self._tools = await client.get_tools()
        logger.info(
            "MCPClient: connected — %d tool(s) discovered: %s",
            len(self._tools),
            [t.name for t in self._tools],
        )

    async def disconnect(self) -> None:
        """Release tool references."""
        self._tools = None
        logger.info("MCPClient: disconnected")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_tools(self) -> list[BaseTool]:
        """Return all discovered MCP tools as LangChain BaseTool objects."""
        if self._tools is None:
            raise RuntimeError("MCPClient is not connected. Call connect() first.")
        return list(self._tools)

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """
        Execute a single MCP tool by name with the given arguments.

        Returns the raw output from the tool.
        Raises ValueError if the tool is not found.
        """
        if self._tools is None:
            raise RuntimeError("MCPClient is not connected. Call connect() first.")

        tool_map = {t.name: t for t in self._tools}
        if tool_name not in tool_map:
            raise ValueError(
                f"Tool '{tool_name}' not found. "
                f"Available: {list(tool_map.keys())}"
            )

        tool = tool_map[tool_name]
        logger.debug("MCPClient: calling tool '%s' with %s", tool_name, arguments)
        result = await tool.ainvoke(arguments)
        logger.debug("MCPClient: '%s' returned %s", tool_name, str(result)[:200])
        return result

    async def list_tool_schemas(self) -> list[dict[str, Any]]:
        """
        Return a JSON-serialisable list of tool schemas.
        Useful for the /debug/mcp-tools endpoint and for LLM prompt context.
        """
        tools = await self.get_tools()
        schemas: list[dict[str, Any]] = []
        for t in tools:
            schema: dict[str, Any] = {
                "name": t.name,
                "description": t.description,
            }
            if hasattr(t, "args_schema") and t.args_schema is not None:
                # Elastic MCP tools return a raw JSON Schema dict (not a Pydantic class)
                if isinstance(t.args_schema, dict):
                    schema["input_schema"] = t.args_schema
                else:
                    try:
                        schema["input_schema"] = t.args_schema.model_json_schema()
                    except Exception:
                        schema["input_schema"] = {}
            schemas.append(schema)
        return schemas


# ---------------------------------------------------------------------------
# Module-level singleton — used by FastAPI lifespan
# ---------------------------------------------------------------------------
_global_client: MCPClient | None = None


async def get_mcp_client() -> MCPClient:
    """FastAPI dependency — returns the process-level MCPClient."""
    if _global_client is None or _global_client._tools is None:
        raise RuntimeError(
            "Global MCP client is not initialised. "
            "Ensure start_global_client() is called in the app lifespan."
        )
    return _global_client


async def start_global_client() -> None:
    """Open the persistent MCP session at app startup."""
    global _global_client
    _global_client = MCPClient()
    await _global_client.connect()
    logger.info("Global MCPClient started.")


async def stop_global_client() -> None:
    """Close the MCP session at app shutdown."""
    global _global_client
    if _global_client is not None:
        await _global_client.disconnect()
        _global_client = None
        logger.info("Global MCPClient stopped.")
