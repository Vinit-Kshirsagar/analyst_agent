**5\. Implementation Roadmap**

**5.1 Phase 0: Foundation (Day 1\)**

***Objective***

Provision the full local infrastructure stack — Docker services, healthchecks, memory limits, pinned versions, skeleton backend/frontend, and idempotent seed data — so later phases can focus on agent logic rather than environment wiring.

***Why This Phase Exists***

A solid foundation ensures all components work correctly before adding complexity. Phase 0 is **infrastructure only**: it does **not** implement agent logic, LangGraph nodes, or MCP client code (those begin in Phase 1). Without health-gated services, pinned model versions, and idempotent seed data, debugging integration issues becomes extremely difficult.

***Scope Boundary***

| In scope (Phase 0) | Out of scope (Phase 1+) |
| :---- | :---- |
| **Docker Compose stack (5 services)** | **LangGraph agent / nodes** |
| **Elasticsearch, Ollama, official MCP image** | **MCP client + tool calling** |
| **Backend skeleton: `/health`, `/debug` only** | **`/chat`, `/chat/stream` endpoints** |
| **Frontend skeleton: status page only** | **Full chat UI** |
| **Idempotent sample log seed into `alerts-security`** | **Context Builder, Tool Registry, observability metrics** |

***Implementation Approach***

Use the hardened setup script (`phase0_setup.sh` / `docs/engineering/phase-0-setup-script.md`) or equivalent steps:

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **0.A** | **Check prerequisites** | **Docker, Docker Compose plugin, Git, Python 3.11+** |
| **0.A2** | **Linux host kernel (if needed)** | **`vm.max_map_count >= 262144` (skipped on macOS)** |
| **0.B** | **Create directory structure** | **`docker/`, `backend/app/`, `backend/data/`, `frontend/`, `data/`** |
| **0.C** | **Write Docker Compose** | **`docker/docker-compose.yml` — 5 services, healthchecks, mem limits, shared `agent-network`** |
| **0.D** | **Write backend skeleton** | **FastAPI `/health` + `/debug` only (dependency reachability checks)** |
| **0.E** | **Write frontend skeleton** | **Next.js status page that calls backend `/health` via REST** |
| **0.F** | **Write seed scripts** | **`backend/data/generate_logs.py` + `import_logs.py` (deterministic `_id`s)** |
| **0.G** | **Bring stack up** | **`docker compose -f docker/docker-compose.yml up -d --build`** |
| **0.H** | **Verify exit criteria** | **`./phase0_setup.sh verify` (ES, Ollama model, MCP `/ping`, backend health, seed idempotency)** |

***Docker services (this phase)***

| Service | Image / Build | Port | Notes |
| :---- | :---- | :---- | :---- |
| **elasticsearch** | **`docker.elastic.co/elasticsearch/elasticsearch:8.11.0`** | **9200** | **single-node, security off, `mem_limit: 4g`, cluster healthcheck** |
| **ollama** | **`ollama/ollama:0.32.1`** | **11434** | **pinned for `gemma4:e4b` support; healthcheck requires model present; `mem_limit: 10g`** |
| **mcp-server** | **`docker.elastic.co/mcp/elasticsearch:0.4.0`** | **8080** | **official Elastic MCP image, HTTP mode, healthcheck `GET /ping`, `ES_URL=http://elasticsearch:9200`** |
| **backend** | **build `backend/Dockerfile`** | **8000** | **skeleton only; gated on ES + Ollama + MCP healthy** |
| **frontend** | **build `frontend/` (Next.js 14+)** | **3000** | **status page only; gated on backend healthy; browser → `localhost:8000`** |

***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Docker Compose stack** | **All 5 services up with healthchecks and memory limits** |
| **Running Elasticsearch** | **Accessible on localhost:9200; cluster health green/yellow** |
| **Ollama + gemma4:e4b** | **Model present in container (`ollama list`); Ollama ≥ 0.30 required** |
| **MCP Server** | **Official image reachable at localhost:8080/ping** |
| **Backend skeleton** | **`GET /health` reports real connectivity for ES, Ollama, MCP; `GET /debug` placeholder** |
| **Frontend skeleton** | **Next.js status page on localhost:3000** |
| **Idempotent sample data** | **200 alerts in index `alerts-security`; re-import does not duplicate** |

***Detailed To-Do List***

☐  Install Docker Desktop / Engine and confirm `docker compose version`

☐  Confirm Git and Python 3.11+ are available

☐  On Linux only: set `vm.max_map_count=262144` if below threshold

☐  Create project dirs: `docker/`, `backend/app/`, `backend/data/`, `frontend/`, `data/`

☐  Write `docker/docker-compose.yml` with elasticsearch, ollama, mcp-server, backend, frontend (healthchecks + mem limits)

☐  Write backend skeleton (`backend/requirements.txt`, `Dockerfile`, `app/main.py` with `/health` and `/debug`)

☐  Write Next.js frontend skeleton (`frontend/app/page.tsx` status page + Dockerfile)

☐  Write seed scripts with deterministic IDs (`backend/data/generate_logs.py`, `import_logs.py`)

☐  Bring stack up: `docker compose -f docker/docker-compose.yml up -d --build`

☐  Wait until all services report healthy

☐  Verify Elasticsearch: `curl -sf http://localhost:9200/_cluster/health`

☐  Verify Ollama model: `docker exec ollama ollama list` includes `gemma4:e4b`

☐  Verify MCP: `curl -sf http://localhost:8080/ping`

☐  Verify backend: `curl -sf http://localhost:8000/health` → overall `healthy`

☐  Generate + import seed data; re-run import and confirm document count unchanged (idempotency)

***Feature List***

| Feature | Status |
| :---- | :---- |
| **Docker Compose orchestration** | **Available** |
| **Elasticsearch Runtime** | **Available** |
| **Ollama + gemma4:e4b** | **Installed** |
| **Official Elastic MCP Server** | **Running (HTTP :8080)** |
| **Backend skeleton (/health, /debug)** | **Ready** |
| **Next.js frontend skeleton (status page)** | **Ready** |
| **Idempotent Sample Data** | **Generated + indexed** |

***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **Docker** | **24.0+** | **Container runtime** |
| **Docker Compose** | **2.20+ (plugin)** | **Multi-service orchestration** |
| **Elasticsearch** | **8.11.0** | **Data store** |
| **Ollama** | **0.32.1** | **LLM runner (container)** |
| **Gemma model** | **gemma4:e4b** | **Local LLM weights** |
| **Elastic MCP Server** | **docker.elastic.co/mcp/elasticsearch:0.4.0** | **MCP over HTTP (port 8080)** |
| **Python** | **3.11+** | **Backend + seed scripts** |
| **FastAPI / Uvicorn** | **0.104.1 / 0.24.0** | **Skeleton API only (CORS for Next.js)** |
| **Next.js / Node.js** | **14+ / 20+** | **Status UI skeleton only** |

***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **Docker installed + running** | **Yes** |
| **Docker Compose plugin** | **Yes** |
| **Git** | **Yes** |
| **Python 3.11+** | **Yes** |
| **16GB+ RAM recommended** | **Yes (ES 4g + Ollama 10g mem limits)** |
| **20GB+ disk space** | **Yes** |
| **Internet connection** | **Yes (image/model pull)** |

***Expected Outcome***

Before moving to Phase 1, ensure: all five Docker services are healthy; Elasticsearch is searchable; `gemma4:e4b` is loaded in Ollama; MCP responds on `/ping`; backend `/health` reports all components `connected`; seed data is present in `alerts-security` and re-import is idempotent. Agent logic remains intentionally unimplemented.

**5.2 Phase 1: Core Agent Workflow (Day 1-2)**

***Objective***

Build the autonomous agent core with LangGraph, MCP integration, and Gemma 4 reasoning.

***Why This Phase Exists***

This is the heart of the system. The agent must correctly plan, execute, and analyze security queries. Getting this right early ensures all other features build on a solid foundation.

***Implementation Approach***

MCP Server is already running from Phase 0 (`docker.elastic.co/mcp/elasticsearch:0.4.0` on port 8080). Phase 1 builds the **client-side agent stack** against that infrastructure.

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Implement MCP Client** | **Connect to Phase 0 MCP Server (`http://mcp-server:8080` / localhost:8080)** |
| **2** | **Build Tool Registry** | **Register Elasticsearch tools exposed via MCP** |
| **3** | **Create Context Builder** | **Assemble prompts, history, and tool schemas** |
| **4** | **Build LangGraph Agent** | **Planner → Router → Executor → Observer → Finalizer** |
| **5** | **Integrate gemma4:e4b** | **Call Ollama at `http://ollama:11434` (model tag `gemma4:e4b`)** |
| **6** | **Extend backend (optional agent entry)** | **Wire agent invocation paths on top of Phase 0 skeleton** |
| **7** | **Test Agent Flow** | **Run end-to-end agent execution against seeded `alerts-security` data** |

***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Working MCP Client** | **Connects to Phase 0 Elastic MCP Server (HTTP :8080)** |
| **Tool Registry** | **Registers search and count tools** |
| **Context Builder** | **Builds complete LLM context** |
| **LangGraph Agent** | **Runs PLAN → ROUTE → EXECUTE → OBSERVE loop** |
| **Agent Tested** | **Successfully executes security queries** |

***Detailed To-Do List***

☐  Confirm Phase 0 stack is healthy (`./phase0_setup.sh verify` or equivalent)

☐  Implement MCP Client connection to `MCP_SERVER_URL` (default `http://mcp-server:8080`)

☐  Test tool discovery against running MCP Server (e.g. list indices / search tools)

☐  Build Tool Registry with Elasticsearch tools

☐  Implement Context Builder (system prompt, history, tools)

☐  Integrate LLM client for `gemma4:e4b` via Ollama

☐  Build LangGraph state machine: PLANNER, ROUTER, EXECUTOR, OBSERVER, FINALIZER nodes

☐  Test agent with sample query against `alerts-security`

☐  Debug any issues

***Feature List***

| Feature | Status |
| :---- | :---- |
| **MCP Client Connection** | **Connected** |
| **Tool Discovery** | **Working** |
| **Tool Registry** | **Built** |
| **Context Builder** | **Implemented** |
| **LangGraph Agent** | **Built** |
| **PLANNER Node** | **Working** |
| **ROUTER Node** | **Working** |
| **EXECUTOR Node** | **Working** |
| **OBSERVER Node** | **Working** |
| **FINALIZER Node** | **Working** |

***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **LangChain** | **0.1.0+** | **Agent framework** |
| **LangGraph** | **0.0.15+** | **State machine** |
| **langchain-mcp-adapters** | **0.1.0+** | **MCP client integration** |
| **FastAPI** | **0.104+** | **API framework (extends Phase 0 skeleton)** |
| **Ollama + gemma4:e4b** | **from Phase 0** | **Local reasoning model** |
| **Elastic MCP Server** | **from Phase 0 (0.4.0)** | **Already running; not reinstalled here** |

***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **Elasticsearch** | **Running (Phase 0)** |
| **Sample Data (`alerts-security`)** | **Indexed (Phase 0)** |
| **Ollama + gemma4:e4b** | **Loaded (Phase 0)** |
| **MCP Server (:8080)** | **Healthy (Phase 0)** |
| **Backend skeleton** | **Ready (Phase 0)** |

***Expected Outcome***

Before moving to Phase 2, ensure: agent can successfully query Elasticsearch via the Phase 0 MCP Server; `gemma4:e4b` generates correct tool calls; results are analyzed and formatted; end-to-end flow works for "What IPs seem malicious?"

**5.3 Phase 2: API & Integration (Day 2\)**

***Objective***

Extend the Phase 0 FastAPI skeleton with chat endpoints, streaming support, and a fuller observability layer.

***Why This Phase Exists***

This phase connects the agent to the external world (API) and enables proper debugging (observability), making the system production-ready. Phase 0 already provides `/health` (real dependency checks) and a placeholder `/debug`; Phase 2 adds chat surfaces and enriches observability.

***Implementation Approach***

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Extend Phase 0 FastAPI app** | **Build on `backend/app/main.py` skeleton (do not recreate from scratch)** |
| **2** | **Implement /api/chat endpoint** | **Non-streaming chat → LangGraph agent** |
| **3** | **Implement /api/chat/stream** | **Server-Sent Events** |
| **4** | **Add Observability** | **Logging, metrics, tracing** |
| **5** | **Enrich /health** | **Keep Phase 0 connectivity checks; add version/tool metadata as needed** |
| **6** | **Enrich /debug** | **Replace Phase 0 placeholder with metrics + recent errors** |
| **7** | **Test API Endpoints** | **curl/postman testing** |

***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **FastAPI Application** | **Running on port 8000 (extends Phase 0 skeleton)** |
| **Chat Endpoint** | **Accepts POST requests** |
| **Streaming Endpoint** | **SSE for real-time responses** |
| **Observability** | **Logging and metrics** |
| **Health Check** | **/health (from Phase 0) enriched as needed** |
| **Debug Endpoint** | **/debug with real metrics** |

***Detailed To-Do List***

☐  Extend existing FastAPI app from Phase 0 (`backend/app/main.py`)

☐  Confirm/extend CORS middleware for Next.js origin (`http://localhost:3000`)

☐  Implement /api/chat endpoint (request validation, call LangGraph agent, format response, error handling)

☐  Implement /api/chat/stream (Server-Sent Events, streaming response chunks, connection management)

☐  Implement Observability (structured logging, request timing, tool call metrics, LLM token tracking)

☐  Enrich /health (retain ES / Ollama / MCP checks from Phase 0; add optional metadata)

☐  Enrich /debug (return metrics, return recent errors — replace Phase 0 placeholder)

☐  Test all endpoints

***Feature List***

| Feature | Status |
| :---- | :---- |
| **FastAPI Server** | **Running (from Phase 0)** |
| **/chat Endpoint** | **Working** |
| **/chat/stream Endpoint** | **Working** |
| **Observability** | **Implemented** |
| **/health Endpoint** | **Working (Phase 0 + enrichments)** |
| **/debug Endpoint** | **Working (metrics)** |
| **Error Handling** | **Implemented** |

***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **FastAPI** | **0.104+** | **API framework** |
| **Uvicorn** | **0.24+** | **ASGI server** |
| **Python Logging** | **stdlib** | **Logging** |
| **Pydantic** | **2.0+** | **Data validation** |
| **sse-starlette** | **1.0+** | **SSE support** |

***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **Agent Working** | **Tested (Phase 1\)** |
| **MCP Connected** | **Confirmed (Phase 1\)** |
| **Gemma 4** | **Running (Phase 1\)** |

***Expected Outcome***

Before moving to Phase 3, ensure: all API endpoints respond correctly; streaming works with real-time updates; observability captures all important data; /health shows all components green.

**5.4 Phase 3: UI & User Experience (Day 2-3)**

***Objective***

Extend the Phase 0 Next.js status skeleton into a full chat UI with REST/SSE streaming support and professional styling.

***Why This Phase Exists***

The UI is how users interact with the agent. A clean, professional Next.js interface makes the agent accessible and builds user trust. Phase 0 already ships a status page that can reach backend `/health`; Phase 3 turns that into the analyst-facing chat experience over **REST + SSE**.

***Implementation Approach***

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Extend Phase 0 Next.js app** | **Build on `frontend/app/` App Router skeleton** |
| **2** | **Implement Chat UI** | **Messages, input, send button (React components)** |
| **3** | **Add Streaming Support** | **SSE client against FastAPI `/api/chat/stream`** |
| **4** | **Apply Design System** | **Colors, typography, spacing (CSS modules / Tailwind)** |
| **5** | **Add Status Indicators** | **Connection (via `/health`), loading states** |
| **6** | **Test UI** | **End-to-end user testing at localhost:3000** |

***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Next.js App** | **Running on port 3000** |
| **Chat Interface** | **Messages, input, send** |
| **Streaming Responses** | **Real-time SSE display** |
| **Styled UI** | **Design system applied** |
| **Status Indicators** | **Connection, loading** |

***Detailed To-Do List***

☐  Extend Phase 0 Next.js skeleton (`frontend/app/page.tsx` status → full chat UI)

☐  Confirm FastAPI CORS allows `http://localhost:3000`

☐  Apply design system: dark theme, color palette, typography, spacing

☐  Implement chat state management: messages list, session ID, loading state

☐  Implement message display: user messages (right-aligned), AI messages (left-aligned), timestamps

☐  Implement input: text input, send button, Enter key support, loading state

☐  Implement streaming: EventSource/fetch stream to `/api/chat/stream`, progressive message display, complete signal handling

☐  Add status indicators: connection status (reuse Phase 0 `/health` check), processing status

☐  Error handling: display errors, retry options

☐  Test end-to-end

***Feature List***

| Feature | Status |
| :---- | :---- |
| **Next.js App** | **Extended from Phase 0 skeleton** |
| **Chat Interface** | **Working** |
| **Message Display** | **Working** |
| **Streaming Support (SSE)** | **Working** |
| **Design System** | **Applied** |
| **Status Indicators** | **Working** |
| **Error Handling** | **Working** |

***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **Next.js** | **14+ (App Router)** | **UI framework** |
| **React / TypeScript** | **18+ / 5+** | **Components & types** |
| **CSS / Tailwind (optional)** | **\-** | **Styling** |
| **EventSource / fetch stream** | **\-** | **SSE client to FastAPI** |

***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **API Working** | **Tested (Phase 2\)** |
| **Streaming Working** | **Confirmed (Phase 2\)** |
| **Agent Working** | **Running (Phase 2\)** |

***Expected Outcome***

Before moving to Phase 4, ensure: UI displays properly; queries can be submitted; streaming responses appear correctly; error states display useful messages; system looks professional.

**5.5 Phase 4: Optimization & Polish (Day 3\)**

***Objective***

Optimize performance, handle edge cases, and prepare for demonstration.

***Why This Phase Exists***

The final phase ensures the system is reliable, performant, and ready for presentation to judges and stakeholders.

***Implementation Approach***

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Performance Optimization** | **Reduce latency, optimize queries** |
| **2** | **Edge Case Handling** | **Timeouts, failures, invalid queries** |
| **3** | **Documentation** | **README, setup guide, demo script** |
| **4** | **Testing** | **End-to-end test scenarios** |
| **5** | **Demo Preparation** | **Sample queries, presentation** |

***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Optimized System** | **\<5 second response time** |
| **Robust Error Handling** | **Graceful failure recovery** |
| **Documentation** | **Complete setup guide** |
| **Demo Script** | **Prepared demonstration** |

***Detailed To-Do List***

☐  Performance optimization: reduce LLM token usage, optimize Elasticsearch queries, add query timeouts, profile and optimize slow paths

☐  Edge case handling: empty queries, very long queries, no results found, Elasticsearch down, MCP Server down, LLM timeout

☐  Documentation: complete README.md, setup instructions, architecture diagram, API documentation, demo script

☐  Testing: test with 5+ sample queries, test error scenarios, test streaming

☐  Demo preparation: prepare 3-5 demo queries, practice demo flow, prepare slides (if needed)

***Feature List***

| Feature | Status |
| :---- | :---- |
| **Performance Optimization** | **Done** |
| **Edge Case Handling** | **Done** |
| **Documentation** | **Done** |
| **Testing** | **Done** |
| **Demo Ready** | **Ready** |

***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **Python** | **3.11+** | **Core language** |
| **Docker** | **24.0+** | **Deployment** |
| **Markdown** | **\-** | **Documentation** |

***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **UI Working** | **Done (Phase 3\)** |
| **API Working** | **Done (Phase 3\)** |
| **Agent Working** | **Done (Phase 3\)** |

***Expected Outcome***

System is: fast (\<5 seconds per query); secure (no unsafe operations); well-documented; ready for demonstration.

**5.6 Phase Summary**

**Phase Timeline**

IMPLEMENTATION TIMELINE

 Phase 0: Foundation                              Day 1 (AM)
   Docker Compose (ES | Ollama gemma4:e4b | MCP :8080 | Backend skeleton | Next.js status :3000)
   Idempotent seed data (alerts-security) | Healthchecks | Memory limits
         |
         v
 Phase 1: Core Agent Workflow                     Day 1 (PM) - Day 2 (AM)
   MCP Client | Tool Registry | Context Builder | LangGraph | gemma4:e4b
         |
         v
 Phase 2: API & Integration                       Day 2 (PM)
   Extend FastAPI skeleton | Chat | Streaming | Observability | Enrich /health + /debug
         |
         v
 Phase 3: UI & User Experience                     Day 2 (PM) - Day 3 (AM)
   Extend Next.js skeleton | Chat Interface | REST/SSE Streaming | Design System | Status
         |
         v
 Phase 4: Optimization & Polish                    Day 3 (PM)
   Performance | Edge Cases | Documentation | Testing | Demo Preparation

**Phase Summary Table**

| Phase | Duration | Key Deliverables | Success Criteria |
| :---- | :---- | :---- | :---- |
| **Phase 0** | **Day 1 (AM)** | **Full infra stack + skeletons + seed** | **5 healthy services; MCP /ping; gemma4:e4b; idempotent `alerts-security` data** |
| **Phase 1** | **Day 1 (PM) – Day 2 (AM)** | **Agent working** | **Successful query execution via MCP client** |
| **Phase 2** | **Day 2 (PM)** | **API ready** | **Chat/stream endpoints + enriched health/debug** |
| **Phase 3** | **Day 2 (PM) – Day 3 (AM)** | **UI complete** | **Professional chat interface** |
| **Phase 4** | **Day 3 (PM)** | **Optimized, documented** | **Demo-ready system** |

**6\. Future Enhancements**

