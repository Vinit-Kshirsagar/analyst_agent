"""
MCP Transport Configuration — Phase 1

Configures the transport settings for connecting to the Elastic MCP Server.
Elastic MCP Server v0.4.0 uses Streamable HTTP protocol over the /mcp endpoint.
"""
import os
from typing import Any

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp-server:8080")
DEFAULT_SERVER_NAME = "elasticsearch"


def get_mcp_server_config(
    server_url: str | None = None,
    server_name: str = DEFAULT_SERVER_NAME,
) -> dict[str, Any]:
    """
    Returns the server configuration dict for langchain-mcp-adapters MultiServerMCPClient.
    
    Elastic MCP Server v0.4.0 uses Streamable HTTP transport on path `/mcp`.
    """
    base_url = server_url or os.getenv("MCP_SERVER_URL", MCP_SERVER_URL)
    mcp_endpoint = f"{base_url.rstrip('/')}/mcp"

    return {
        server_name: {
            "url": mcp_endpoint,
            "transport": "streamable_http",
        }
    }
