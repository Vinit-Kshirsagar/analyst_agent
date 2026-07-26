**2\. System Architecture Document**

**2.1 High-Level Architecture**

The system is organized into layers from the **Next.js** user interface through REST/SSE into the FastAPI backend (Context Builder, Session Manager, LangGraph agent), then Tool Registry → MCP Client → MCP Server → Elasticsearch, with a cross-cutting Observability layer.

AUTONOMOUS SECURITY AGENT — SYSTEM OVERVIEW  
    
 1\. USER INTERFACE (Next.js)  
    Chat Window | Input Box | Streaming Responses | Status  
         |  
         |  REST  +  SSE  
         v  
 2\. API LAYER (FastAPI)  
    /health | /debug (Phase 0) | /chat | /chat/stream | /api/* (Phase 1–2+)  
    CORS enabled for Next.js origin  
         |  
         v  
 3\. CONTEXT BUILDER  +  SESSION MANAGER  
    System Prompt | History | Tools | Security Validation | session\_id  
         |  
         v  
 4\. LANGGRAPH AGENT  
    PLANNER(Gemma4) \-\> ROUTER \-\> EXECUTOR \-\> OBSERVER(Gemma4) \-\> FINALIZE  
                                    |  
                                    v  
                              TOOL REGISTRY  
         |  
         v  
 5\. MCP LAYER  
    MCP Client (LangChain Adapter) \<--MCP Protocol--\> MCP Server  
         |  
         v  
 6\. DATA LAYER (Elasticsearch)  
    alerts-security (MVP seed index)  |  filebeat-\*  |  winlogbeat-\*  |  auditbeat-\*  
    
 7\. OBSERVABILITY LAYER (cross-cutting)  
    Logging | Metrics | Tracing | /debug | Error Tracking

Stack (top → bottom): **Next.js → REST/SSE → FastAPI → Context Builder / Session Manager → LangGraph (Planner → Router → Executor → Observer) → Tool Registry → MCP Client → MCP Server → Elasticsearch**

**Architecture Principles**

| Principle | Description |
| :---- | :---- |
| **Separation of Concerns** | **Each layer has a single, well-defined responsibility** |
| **Local First** | **All processing happens locally (Gemma 4, Elasticsearch, MCP)** |
| **Standardized Integration** | **MCP for all tool integrations** |
| **Observability by Design** | **Logging, metrics, tracing built-in from day one** |
| **Extensible** | **Tool Registry enables easy addition of new tools** |
| **Security-Aware** | **Validation, sanitization, and safety checks** |

**2.2 Component Breakdown**

**2.2.1 User Interface Layer (Next.js)**

| Component | Responsibility |
| :---- | :---- |
| **Chat Window** | **Display conversation with formatted messages** |
| **Input Box** | **Capture user queries with keyboard shortcuts** |
| **Streaming Handler** | **Consume SSE from FastAPI and render progressively** |
| **Status Bar** | **Show system health via backend `/health`** |
| **API Client** | **REST client for chat + health (browser → FastAPI)** |

**Key Functionalities:**

* Real-time message display  
* Markdown rendering for responses  
* Loading/thinking indicators  
* Error display with helpful messages  
* SSE (`EventSource` / fetch stream) for `/api/chat/stream`

*Why This Component Matters: Provides the primary user interaction surface, making the agent accessible to analysts without technical query knowledge. Next.js enables a production-grade SPA/SSR UI with standard web streaming clients.*

**2.2.2 API Gateway Layer (FastAPI)**

| Component | Responsibility |
| :---- | :---- |
| **REST Endpoints** | **/health, /debug (Phase 0); /chat, /chat/stream and /api/* (Phase 1–2+)** |
| **SSE Streaming** | **Server-Sent Events for progressive agent output** |
| **Request Validation** | **Validate and sanitize incoming requests** |
| **CORS** | **Allow Next.js origin (dev/prod) to call the API** |
| **Response Formatting** | **Standardize API responses** |

**Key Functionalities:**

* Accept chat requests from Next.js  
* Stream responses via Server-Sent Events  
* Return system health status  
* Provide debug information

*Why This Component Matters: Acts as the bridge between UI and agent, providing a clean, maintainable API surface over REST + SSE.*

**2.2.3 Context Builder & Session Manager**

| Component | Responsibility |
| :---- | :---- |
| **System Prompt Assembly** | **Build dynamic system prompts** |
| **History Integration** | **Inject conversation history** |
| **Tool Context** | **Add available tool schemas** |
| **Security Validation** | **Validate query safety** |
| **Session Manager** | **Create/resolve `session_id`, bind history and filters per conversation** |

**Key Functionalities:**

* Assemble complete context for LLM  
* Track sessions and conversation memory  
* Prevent unsafe operations  
* Format tool schemas for LLM consumption

*Why This Component Matters: Centralizes context preparation and session lifecycle so multi-turn investigations stay consistent for the LangGraph agent.*

**2.2.4 LangGraph Agent (The Core)**

| Component | Responsibility |
| :---- | :---- |
| **PLANNER** | **Generate step-by-step plan using Gemma 4** |
| **ROUTER** | **Decide which tool(s) to execute** |
| **EXECUTOR** | **Execute tool calls via Tool Registry** |
| **OBSERVER** | **Analyze results using Gemma 4** |
| **FINALIZER** | **Generate final response** |

**Key Functionalities:**

* Autonomous planning and execution  
* Tool selection and invocation  
* Result analysis and synthesis  
* Iterative improvement (ReAct pattern)

*Why This Component Matters: This is the intelligence engine that makes the system "autonomous."*

**2.2.5 Tool Registry**

| Component | Responsibility |
| :---- | :---- |
| **Tool Registration** | **Register new tools** |
| **Tool Discovery** | **List available tools** |
| **Tool Execution** | **Execute registered tools** |
| **Tool Metrics** | **Track tool usage** |

**Key Functionalities:**

* Register Elasticsearch search tools  
* List available tools for LLM context  
* Execute tools with parameter validation  
* Track tool performance metrics

*Why This Component Matters: Provides a clean abstraction for tool management, enabling easy extension with new data sources.*

**2.2.6 MCP Layer**

| Component | Responsibility |
| :---- | :---- |
| **MCP Client** | **Connect to MCP Server, discover tools** |
| **MCP Server** | **Expose Elasticsearch operations as MCP tools** |
| **Protocol Handler** | **JSON-RPC 2.0 communication** |

**Key Functionalities:**

* Standardized tool discovery  
* JSON-RPC message formatting  
* Connection management  
* Error handling and retries

*Why This Component Matters: Provides a standardized bridge between agent and data sources, making the system future-proof.*

**2.2.7 Data Layer (Elasticsearch)**

| Component | Responsibility |
| :---- | :---- |
| **Index Manager** | **Manage security indices** |
| **Query Engine** | **Execute DSL queries** |
| **Data Ingest** | **Import sample data** |
| **Schema Manager** | **Define and maintain mappings** |

**Key Functionalities:**

* Store security alerts and logs  
* Execute search queries  
* Support aggregations for analytics  
* Time-based index management

*Why This Component Matters: Provides the data foundation that powers all security analysis.*

**2.2.8 Observability Layer**

| Component | Responsibility |
| :---- | :---- |
| **Logger** | **Structured logging** |
| **Metrics Collector** | **Track performance metrics** |
| **Error Tracker** | **Capture and log errors** |
| **Debug Interface** | **/debug endpoint** |

**Key Functionalities:**

* Request/response logging  
* Tool execution timing  
* LLM token usage tracking  
* Error aggregation

*Why This Component Matters: Enables debugging, performance monitoring, and system health tracking.*

**2.3 Data Flow**

Complete Request Flow — from a natural-language question to a structured threat assessment:

Step 1: User Input  
   User types: "What IPs seem malicious today and why?"  
    
 Step 2: UI \-\> API (REST)  
   Next.js sends POST /api/chat (or opens SSE on /api/chat/stream) with query + session\_id  
    
 Step 3: API \-\> Session Manager \-\> Context Builder  
   1\. Resolve/create session  
   2\. Validate query (check for unsafe operations)  
   3\. Build system prompt with tool schemas  
   4\. Inject conversation history  
   5\. Create complete context for LLM  
    
 Step 4: Context \-\> LangGraph Agent  
   PLANNER: Gemma 4 generates plan  
   \-\> "Search for alerts in last 24h, group by source.ip, analyze patterns"  
    
 Step 5: Agent \-\> Tool Registry \-\> MCP  
   ROUTER: "Use search\_events tool"  
   EXECUTOR: Tool Registry \-\> MCP Client \-\> MCP Server  
    
 Step 6: MCP \-\> Elasticsearch  
   MCP Server translates to Elasticsearch DSL  
   Executes query on alerts-security  
   Returns 47 matching documents  
    
 Step 7: Results \-\> Agent \-\> Gemma 4  
   OBSERVER: Gemma 4 analyzes 47 logs  
   \-\> Identifies IP 10.0.0.55 in 42 alerts  
   \-\> Pattern: SSH brute force at 2-4 AM  
   \-\> Conclusion: Malicious activity detected  
    
 Step 8: Final Response  
   API returns: Structured threat assessment to UI  
   UI displays: "IP 10.0.0.55 is malicious because..."  
    
 Observability: Logs every step with timing, tokens, success/failure

**2.4 API Specifications**

**2.4.1 Chat Endpoint**

**Endpoint: POST /api/chat**

Request Body:

{  
   "message": "What IPs seem malicious today and why?",  
   "session\_id": "user\_session\_123"  
 }

Response Body:

{  
   "success": true,  
   "response": "Based on my analysis of 47 security events...",  
   "metadata": {  
     "session\_id": "user\_session\_123",  
     "timestamp": "2025-07-21T14:13:00",  
     "processing\_time": 2.3,  
     "tool\_calls": \["search\_security\_events"\],  
     "results\_count": 47,  
     "model": "gemma4:e4b"  
   }  
 }

Error Response:

{  
   "success": false,  
   "error": "MCP Server connection failed",  
   "error\_code": "MCP\_001",  
   "suggestion": "Check if Elasticsearch is running"  
 }

**2.4.2 Streaming Endpoint**

**Endpoint: POST /api/chat/stream**

Request Body: Same as /api/chat

Response: Server-Sent Events (SSE)

Event Format:

data: {"type": "plan", "content": "Searching Elasticsearch..."}  
    
 data: {"type": "thinking", "content": "Analyzing 47 events..."}  
    
 data: {"type": "response", "content": "IP 10.0.0.55 appears..."}  
    
 data: {"type": "complete", "content": ""}

**2.4.3 Health Endpoint**

**Endpoint: GET /health** (Phase 0 skeleton; may also be exposed under `/api/health` later)

Phase 0 response shape (real connectivity checks for each dependency):

{  
   "status": "healthy",  
   "components": {  
     "elasticsearch": {"status": "connected"},  
     "ollama": {"status": "connected", "models": \["gemma4:e4b"\]},  
     "mcp\_server": {"status": "connected"}  
   }  
 }

Overall status is `"healthy"` only when every component reports `"connected"`; otherwise `"degraded"`. Ollama may report `"model_missing"` if `gemma4:e4b` is not loaded. Phase 2+ may enrich this payload with versions, tool counts, and timestamps.

**2.4.4 Debug Endpoint**

**Endpoint: GET /debug** (Phase 0 placeholder; enriched in Phase 2+)

Phase 0:

{  
   "phase": "0",  
   "note": "Full metrics implemented in Phase 1."  
 }

Target (Phase 2+) response:

{  
   "metrics": {  
     "total\_requests": 42,  
     "total\_tool\_calls": 127,  
     "total\_llm\_calls": 89,  
     "total\_errors": 3  
   },  
   "performance": {  
     "avg\_request\_duration": 2.3,  
     "avg\_tool\_duration": 0.8,  
     "avg\_llm\_duration": 1.2  
   },  
   "last\_errors": \[  
     {"timestamp": "2025-07-21T14:10:00", "error": "Tool timeout"}  
   \]  
 }

**2.5 Deployment Architecture**

**Local Development Setup (Phase 0)**

All core services run as Docker Compose containers on a shared `agent-network`. There is no separate host-side Node.js MCP process — the official Elastic MCP image runs in-container on port **8080**.

LOCAL DEVELOPMENT ARCHITECTURE — DEVELOPER MACHINE (Docker Compose)  
    
 Docker: elasticsearch  
   Image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0  
   Port: 9200 | mem\_limit: 4g | healthcheck: \_cluster/health  
    
 Docker: ollama  
   Image: ollama/ollama:0.32.1  
   Port: 11434 | Model: gemma4:e4b | mem\_limit: 10g  
    
 Docker: mcp-server  
   Image: docker.elastic.co/mcp/elasticsearch:0.4.0  
   Port: 8080 | command: http | healthcheck: GET /ping  
   ES\_URL=http://elasticsearch:9200  
    
 Docker: backend (Phase 0 skeleton → later LangGraph + MCP Client)  
   Port: 8000 | depends\_on: ES, Ollama, MCP (healthy)  
   Endpoints (Phase 0): /health, /debug  
    
 Docker: frontend (Next.js Phase 0 status page → later full chat UI)  
   Port: 3000 | depends\_on: backend (healthy)  
   NEXT\_PUBLIC\_API\_URL=http://localhost:8000 (browser → FastAPI)  
   INTERNAL\_API\_URL=http://backend:8000 (server-side → FastAPI)

**Docker Compose (local stack — Phase 0 authoritative)**

Defined in `docker/docker-compose.yml` and generated by the Phase 0 setup script. Key facts:

| Service | Image | Host port | Healthcheck |
| :---- | :---- | :---- | :---- |
| **elasticsearch** | **elasticsearch:8.11.0** | **9200** | **curl cluster health** |
| **ollama** | **ollama/ollama:0.32.1** | **11434** | **`ollama list` contains gemma4:e4b** |
| **mcp-server** | **docker.elastic.co/mcp/elasticsearch:0.4.0** | **8080** | **GET /ping** |
| **backend** | **build: backend/** | **8000** | **GET /health** |
| **frontend** | **build: frontend/ (Next.js)** | **3000** | **gated on backend healthy** |

Environment variables on backend: `ELASTICSEARCH_URL`, `OLLAMA_URL`, `MCP_SERVER_URL=http://mcp-server:8080`, `GEMMA_MODEL_TAG=gemma4:e4b`. FastAPI enables CORS for the Next.js origin (e.g. `http://localhost:3000`).

Service start order is **health-gated** (`depends_on` with `condition: service_healthy`), not merely process-started. Seed data uses deterministic document IDs (`seed-alert-0000` …) so re-import into index `alerts-security` is idempotent.

