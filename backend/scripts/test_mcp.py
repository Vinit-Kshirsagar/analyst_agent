#!/usr/bin/env python3
"""
test_mcp.py — standalone MCP connection smoke-test (Phase 1)

Run from the repo root (host, against localhost:8080):
    MCP_SERVER_URL=http://localhost:8080 python backend/scripts/test_mcp.py

Or inside the backend container:
    docker compose -f docker/docker-compose.yml --env-file docker/.env \
      exec backend python /app/scripts/test_mcp.py
"""
import asyncio
import os
import sys

# Make backend app importable when run from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.mcp import MCPClient
from app.tools import ToolRegistry


async def main() -> None:
    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8080")
    os.environ["MCP_SERVER_URL"] = mcp_url

    print(f"\n{'='*60}")
    print(f" MCP Smoke Test")
    print(f" MCP server : {mcp_url}")
    print(f"{'='*60}\n")

    client = MCPClient()

    # ------------------------------------------------------------------ #
    # 1. Connect + discover tools
    # ------------------------------------------------------------------ #
    print("[ 1 ] Connecting & discovering tools...")
    try:
        await client.connect()
    except Exception as exc:
        print(f"  ✗  Connection failed: {exc}")
        print("      Is the MCP server running? Check: docker ps")
        return

    schemas = await client.list_tool_schemas()
    if not schemas:
        print("  ✗  No tools returned from MCP server.")
        return

    print(f"  ✓  {len(schemas)} tool(s) discovered:\n")
    for s in schemas:
        print(f"     [{s['name']}]")
        print(f"       {s['description'][:90].rstrip()}")
        if s.get('input_schema') and s['input_schema'].get('properties'):
            required = s['input_schema'].get('required', [])
            for field, fdef in s['input_schema']['properties'].items():
                req_mark = '*' if field in required else ''
                print(f"         {field}{req_mark}: {fdef.get('description', fdef.get('type', ''))}")
        print()

    # ------------------------------------------------------------------ #
    # 2. Build tool registry
    # ------------------------------------------------------------------ #
    print("[ 2 ] Building ToolRegistry...")
    registry = await ToolRegistry.from_mcp_client(client)
    print(f"  ✓  Registered: {registry.list_names()}\n")

    # ------------------------------------------------------------------ #
    # 3. Execute a search tool against alerts-security
    # ------------------------------------------------------------------ #
    print("[ 3 ] Searching 'alerts-security' (match_all, size=3)...")

    search_tool = next(
        (n for n in registry.list_names() if "search" in n.lower()), None
    )

    if search_tool is None:
        print("  ✗  No 'search' tool found.")
        await client.disconnect()
        return

    print(f"  Using tool: '{search_tool}'")
    try:
        result = await registry.execute(
            search_tool,
            {
                "index": "alerts-security",
                "query_body": {"query": {"match_all": {}}, "size": 3},
            },
        )
        print(f"  ✓  Result (first 600 chars):\n")
        print(f"     {str(result)[:600]}")
    except Exception as exc:
        print(f"  ✗  Tool execution failed: {exc}")

    # ------------------------------------------------------------------ #
    # 4. Cleanup
    # ------------------------------------------------------------------ #
    await client.disconnect()

    print(f"\n{'='*60}")
    print(" ✓  Smoke test complete — MCP layer is wired correctly.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
