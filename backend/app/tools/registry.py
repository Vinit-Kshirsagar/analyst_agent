"""
Tool Registry — Phase 1
Builds and caches a registry of LangChain BaseTool objects sourced from the
MCP server. Serves as the single source-of-truth for:

  - Tool discovery (what can the agent call?)
  - Tool schema extraction (what parameters does each tool accept?)
  - Tool execution (invoke a tool by name)

The registry is intentionally decoupled from MCPClient so the LangGraph
agent can reference tools without holding a raw client reference.

Usage:
    registry = await ToolRegistry.from_mcp_client(mcp_client)
    tools = registry.get_all_tools()
    result = await registry.execute("search", {"index": "alerts-security", "query_body": {...}})
"""
import logging
from typing import Any

from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Catalog of available agent tools sourced from the MCP server.

    Responsibilities:
      - Hold a named map of BaseTool objects
      - Provide lookup by name or by category
      - Delegate async execution to the underlying BaseTool
      - Track basic call counts for observability
    """

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}
        self._call_counts: dict[str, int] = {}

    # ------------------------------------------------------------------
    # Factory
    # ------------------------------------------------------------------

    @classmethod
    async def from_mcp_client(cls, mcp_client) -> "ToolRegistry":
        """
        Build a ToolRegistry from an already-connected MCPClient.

        Args:
            mcp_client: A connected MCPClient instance.

        Returns:
            Populated ToolRegistry.
        """
        registry = cls()
        tools: list[BaseTool] = await mcp_client.get_tools()
        for tool in tools:
            registry.register(tool)
        logger.info(
            "ToolRegistry: registered %d tool(s): %s",
            len(tools),
            list(registry._tools.keys()),
        )
        return registry

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(self, tool: BaseTool) -> None:
        """Add a single tool to the registry."""
        self._tools[tool.name] = tool
        self._call_counts[tool.name] = 0
        logger.debug("ToolRegistry: registered '%s'", tool.name)

    # ------------------------------------------------------------------
    # Lookup
    # ------------------------------------------------------------------

    def get_all_tools(self) -> list[BaseTool]:
        """Return all registered tools as a flat list (for LangGraph agent)."""
        return list(self._tools.values())

    def get_tool(self, name: str) -> BaseTool:
        """
        Return a specific tool by name.

        Raises:
            KeyError: if the tool is not registered.
        """
        if name not in self._tools:
            raise KeyError(
                f"Tool '{name}' not in registry. "
                f"Available: {list(self._tools.keys())}"
            )
        return self._tools[name]

    def list_names(self) -> list[str]:
        """Return all registered tool names."""
        return list(self._tools.keys())

    def tool_schemas(self) -> list[dict[str, Any]]:
        """
        Return JSON-serialisable schemas for all tools.
        Used by Context Builder to inject tool descriptions into LLM prompts.
        """
        schemas = []
        for name, tool in self._tools.items():
            schema: dict[str, Any] = {
                "name": name,
                "description": tool.description,
                "call_count": self._call_counts.get(name, 0),
            }
            if hasattr(tool, "args_schema") and tool.args_schema is not None:
                # Elastic MCP tools return a raw JSON Schema dict (not a Pydantic class)
                if isinstance(tool.args_schema, dict):
                    schema["input_schema"] = tool.args_schema
                else:
                    try:
                        schema["input_schema"] = tool.args_schema.model_json_schema()
                    except Exception:
                        schema["input_schema"] = {}
            schemas.append(schema)
        return schemas

    # ------------------------------------------------------------------
    # Execution
    # ------------------------------------------------------------------

    async def execute(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """
        Invoke a tool by name with the given arguments.

        Increments the call counter for observability.

        Args:
            tool_name:  Name of the registered tool.
            arguments:  Dict of parameters matching the tool's input schema.

        Returns:
            Raw tool output (str or dict depending on the MCP tool).

        Raises:
            KeyError: if the tool is not registered.
        """
        tool = self.get_tool(tool_name)
        self._call_counts[tool_name] = self._call_counts.get(tool_name, 0) + 1
        logger.info(
            "ToolRegistry: executing '%s' (call #%d) with args: %s",
            tool_name,
            self._call_counts[tool_name],
            str(arguments)[:200],
        )
        result = await tool.ainvoke(arguments)
        logger.debug("ToolRegistry: '%s' result: %s", tool_name, str(result)[:300])
        return result

    # ------------------------------------------------------------------
    # Metrics
    # ------------------------------------------------------------------

    def call_counts(self) -> dict[str, int]:
        """Return a copy of per-tool invocation counters."""
        return dict(self._call_counts)

    def __repr__(self) -> str:
        return (
            f"ToolRegistry("
            f"tools={list(self._tools.keys())}, "
            f"calls={self._call_counts})"
        )
