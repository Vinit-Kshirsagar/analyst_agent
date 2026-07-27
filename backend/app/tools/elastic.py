"""
Elasticsearch Tool Helpers — Phase 1

Provides metadata, index default names, and helper utilities for Elasticsearch
operations exposed via MCP tools.
"""

INDEX_ALERTS_SECURITY = "alerts-security"

# Recognized Elasticsearch tools exposed by Elastic MCP Server v0.4.0
ELASTIC_SEARCH_TOOLS = [
    "search",
    "get_mappings",
    "list_indices",
    "esql",
    "get_shards",
]
