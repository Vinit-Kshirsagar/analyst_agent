# API (as implemented)

Base URL (local): `http://localhost:8000`

CORS allowed origins: `http://localhost:3000`, `http://127.0.0.1:3000`

## GET `/health`

Reports real dependency reachability (not only container state).

### Response `200`

```json
{
  "status": "healthy",
  "components": {
    "elasticsearch": { "status": "connected" },
    "ollama": {
      "status": "connected",
      "models": ["gemma4:e4b"]
    },
    "mcp_server": { "status": "connected" }
  }
}
```

| Field | Meaning |
| --- | --- |
| `status` | `healthy` if every component is `connected`; else `degraded` |
| `ollama.status` | `connected` \| `model_missing` \| `error` |
| `elasticsearch.status` | `connected` \| `unreachable` \| `error` |
| `mcp_server.status` | `connected` \| `unreachable` \| `error` |

## GET `/debug`

Phase 0 placeholder.

```json
{
  "phase": "0",
  "note": "Full metrics implemented in Phase 1."
}
```

## Not implemented yet

| Endpoint | Planned phase |
| --- | --- |
| `POST /api/chat` | Phase 2 |
| `POST /api/chat/stream` (SSE) | Phase 2 |
| Auth | Post-MVP |

## External services (not FastAPI)

| Endpoint | Service |
| --- | --- |
| `GET http://localhost:8080/ping` | MCP → body `Ready` |
| `GET http://localhost:9200/_cluster/health` | Elasticsearch |
| `GET http://localhost:11434/api/tags` | Ollama |

## Version history

| Date | Change |
| --- | --- |
| 2026-07-25 | Phase 0: `/health`, `/debug` shipped |
