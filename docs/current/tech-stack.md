# Tech stack (as implemented)

## Languages & runtimes

| Tech | Version / pin | Role |
| --- | --- | --- |
| Python | 3.11 (backend image) | FastAPI, seed scripts |
| Node.js | 20 (frontend image) | Next.js |
| TypeScript | 5.5 | Frontend |

## Frontend

| Tech | Version | Role |
| --- | --- | --- |
| Next.js | 14.2.5 (App Router) | UI |
| React | 18.3.1 | Components |

## Backend

| Tech | Version | Role |
| --- | --- | --- |
| FastAPI | 0.104.1 | API |
| Uvicorn | 0.24.0 | ASGI |
| Pydantic | 2.5.0 | Models |
| httpx | 0.25.2 | Health probes |
| elasticsearch (py) | 8.11.0 | Seed + health ping |

## Agent / AI (planned Phase 1+; not in code yet)

| Tech | Notes |
| --- | --- |
| LangChain / LangGraph | Phase 1 |
| langchain-mcp-adapters | Phase 1 |
| Ollama | **Live** — host install (not Docker) |
| Model | **Live** — `gemma4:e4b` (each teammate pulls once) |

## Data & MCP

| Tech | Version | Role |
| --- | --- | --- |
| Elasticsearch | 8.11.0 | Log store |
| Elastic MCP Server | 0.4.0 (`docker.elastic.co/mcp/elasticsearch`) | MCP HTTP `:8080` |

## Infrastructure

| Tech | Role |
| --- | --- |
| Docker / Compose | Orchestration |
| Bridge network `agent-network` | Service DNS |

## Runtime requirements

- Docker with Compose plugin
- Host Ollama with `gemma4:e4b` pulled and running on `:11434`
- ~16GB host RAM recommended (ES in Docker + Ollama on host)
