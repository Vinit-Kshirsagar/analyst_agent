**AUTONOMOUS SECURITY AGENT**

Product Requirements & Technical Design Document

*Reducing time-to-insight for SOC analysts through natural-language,locally-run autonomous log investigation.*

| Attribute | Value |
| :---- | :---- |
| Document Title | Autonomous Security Agent — PRD & Technical Design |
| Version | 1.1 (incorporates independent architecture review — see Section 7\) |
| Date | July 2025 |
| Status | Draft for Review |
| Authors | Security Agent Development Team |
| Classification | Internal — Development |
| Target Audience | Stakeholders, Developers, Technical Architects |

# **Table of Contents**

**1\. Product Requirements Document (PRD)**

1.1 Project Overview

1.2 Problem Statement

1.3 Goals & Objectives

1.4 Target Users

1.5 Features Matrix

1.6 User Stories

1.7 Functional Requirements

1.8 Non-Functional Requirements

1.9 Success Metrics

**2\. System Architecture Document**

2.1 High-Level Architecture

2.2 Component Breakdown

2.3 Data Flow

2.4 API Specifications

2.5 Deployment Architecture

**3\. UI/UX Design System**

3.1 Design Philosophy

3.2 Color Palette

3.3 Typography

3.4 Component Library

3.5 Layout & Spacing

3.6 Interaction Patterns

3.7 Accessibility

**4\. Technical Specification**

4.1 Technology Stack

4.2 Folder Structure

4.3 Coding Standards

4.4 API Contracts

4.5 Database Schema

4.6 Security Standards

**5\. Implementation Roadmap**

5.1 Phase 0: Foundation

5.2 Phase 1: Core Agent Workflow

5.3 Phase 2: API & Integration

5.4 Phase 3: UI & User Experience

5.5 Phase 4: Optimization & Polish

5.6 Phase Summary

**6\. Future Enhancements**

6.1 Short-Term Roadmap

6.2 Long-Term Vision

6.3 Scalability Considerations

6.4 Security Enhancements

6.5 AI & Automation Enhancements

6.6 Cost Optimization

**7\. Critical Design Review & Production Hardening Roadmap**

7.1 Independent Review — Overall Rating

7.2 Strengths Validated by the Review

7.3 Gap: No Formal Agent State Model

7.4 Gap: Context Builder & Memory Strategy

7.5 Gap: Planner/Observer Model Split

7.6 Gap: Tool Registry Expansion

7.7 Gap: Retry Strategy & Guardrails

7.8 Missing Components

7.9 Gap: Evaluation Strategy

7.10 Revised Folder Structure

7.11 Production Deployment Topology

7.12 Phase 5: Hardening for Production

**Appendix**

# **1\. Product Requirements Document (PRD)**

## **1.1 Project Overview**

The Autonomous Security Agent is an AI-powered assistant designed to revolutionize how Security Operations Center (SOC) analysts interact with security log data. By combining a locally-run large language model (Gemma 4\) with the Model Context Protocol (MCP), the system enables analysts to query Elasticsearch logs using natural language, eliminating the need to write complex Elasticsearch Domain Specific Language (DSL) queries.

*Core Value Proposition: Reduce the time from security question to actionable insight from minutes to seconds.*

| Attribute | Value |
| :---- | :---- |
| Project Type | Hackathon / Innovation Lab Project |
| Duration | 2-3 Weeks (MVP) |
| Team Size | 2-4 Engineers |

## **1.2 Problem Statement**

### **Current Pain Points**

| Challenge | Description | Impact |
| :---- | :---- | :---- |
| Query Complexity | Analysts must write complex Elasticsearch DSL queries to retrieve security data | 70% of time spent on query formulation |
| Context Switching | Switching between SIEM, threat intelligence tools, and communication platforms | Cognitive load, increased errors |
| Data Interpretation | Raw logs require manual analysis and pattern recognition | Missed threats, delayed response |
| Skill Gap | Junior analysts struggle with advanced query syntax | Bottleneck on senior analysts |
| Time Sensitivity | Manual investigation takes hours during critical incidents | Increased Mean Time to Detect (MTTD) |

### **The Core Problem**

*Security analysts lose valuable investigation time writing and debugging complex queries to hunt down threats, resulting in delayed threat detection and increased cognitive load.*

### **Impact Statistics**

| Metric | Value |
| :---- | :---- |
| Investigation time spent on data retrieval | 75% |
| Queries that are "one-off" and not reusable | 60% |
| Increase in Mean Time to Detect (MTTD) | 45% |
| Faster investigations with natural language | 3.5x |
| Analysts reporting query writing as biggest pain | 87% |

## **1.3 Goals & Objectives**

### **Primary Goals**

| \# | Goal | Success Criteria |
| :---- | :---- | :---- |
| 1 | Natural Language Querying | Users can ask security questions in plain English and receive accurate results |
| 2 | Autonomous Agent Execution | The system independently plans, executes, and analyzes queries without human intervention |
| 3 | Elasticsearch Integration | Direct integration with Elasticsearch for real-time log retrieval |
| 4 | Local Deployment | Full system runs locally using Gemma 4 (no external API costs, data privacy) |
| 5 | Standardized Integration | Use MCP for standardized, future-proof tool integration |

### **Secondary Goals**

* Provide clear, reasoned threat assessments (not just raw data)

* Enable streaming responses for real-time interaction

* Include observability for debugging and performance monitoring

* Maintain clean separation of concerns for extensibility

## **1.4 Target Users**

### **Primary User: Security Operations Center (SOC) Analyst**

| Attribute | Description |
| :---- | :---- |
| Role | Tier 1-3 SOC Analyst |
| Technical Level | Moderate (comfortable with logs but not advanced query syntax) |
| Pain Points | Time spent on query construction, manual log analysis |
| Needs | Fast answers, clear threat assessments, actionable recommendations |
| Workflow | Investigate alerts, hunt for threats, report findings |

### **Secondary User: Security Engineer**

| Attribute | Description |
| :---- | :---- |
| Role | Security Engineer / Architect |
| Technical Level | Advanced (understands data models and query optimization) |
| Pain Points | Training junior analysts, onboarding new security tools |
| Needs | Custom queries, tuning, integration capabilities |

## **1.5 Features Matrix**

### **Must Have (Phase 1 — Core)**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Natural Language Chat | Users type questions in plain English | Critical |
| Elasticsearch Query | Agent queries Elasticsearch for security logs | Critical |
| Tool Calling | Agent uses MCP tools to retrieve data | Critical |
| Streaming Responses | Real-time streaming of agent responses | High |
| Gemma 4 Integration | Local LLM with function calling | Critical |
| Basic Observability | Logging and debugging capabilities | High |
| System Health Check | /health and /debug endpoints | Medium |

### **Should Have (Phase 2 — Enhancements)**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Conversation History | Store and retrieve chat sessions | Medium |
| Export (JSON/CSV) | Export analysis results | Medium |
| Charts & Visualizations | Visual representation of threats | Medium |
| Advanced Observability | Metrics, tracing, performance monitoring | Medium |
| Authentication | Basic API key authentication | Low |

### **Nice to Have (Phase 3 — Future)**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| File Upload | Upload custom log files for analysis | Low |
| Multiple Data Sources | Splunk, AWS CloudTrail, etc. | Low |
| Additional Tools | VirusTotal, Shodan integration | Low |
| Dark/Light Mode | Theme switching | Low |
| Report Generation | PDF reports for stakeholders | Low |
| Caching | Query result caching | Low |

## **1.6 User Stories**

### **As a SOC Analyst, I want to…**

| ID | User Story | Acceptance Criteria |
| :---- | :---- | :---- |
| US-01 | Ask "What IPs seem malicious today and why?" | Agent returns list of suspicious IPs with reasoning |
| US-02 | Ask "How many failed login attempts in the last hour?" | Agent returns count with time distribution |
| US-03 | Ask "Show me all alerts related to malware" | Agent returns filtered alerts with details |
| US-04 | Ask "Is 10.0.0.55 communicating with malicious domains?" | Agent returns correlation analysis |
| US-05 | Ask "What were the top 10 attack sources this week?" | Agent returns ranked list with evidence |
| US-06 | Ask "What's the severity distribution of alerts today?" | Agent returns categorized breakdown |
| US-07 | See results streaming in real-time | Responses appear progressively |
| US-08 | Understand why an IP was flagged | Agent provides clear reasoning |

### **As a Security Engineer, I want to…**

| ID | User Story | Acceptance Criteria |
| :---- | :---- | :---- |
| SE-01 | Check system health status | /health endpoint shows all components |
| SE-02 | Debug agent behavior | /debug endpoint provides metrics |
| SE-03 | Extend with new tools | Tool Registry allows registration |
| SE-04 | View system logs | Structured logging for analysis |
| SE-05 | Configure agent behavior | Configuration management |

## **1.7 Functional Requirements**

### **FR-01: Chat Interface**

| Requirement | Details |
| :---- | :---- |
| Description | Provide a chat interface for natural language interaction |
| Acceptance Criteria | 1\. Users can type queries 2\. Queries are sent to backend 3\. Responses are displayed 4\. Streaming responses supported 5\. Conversation history maintained (session-level) |
| Priority | Critical |

### **FR-02: Agent Workflow Execution**

| Requirement | Details |
| :---- | :---- |
| Description | Autonomous agent executes query processing |
| Acceptance Criteria | 1\. Agent receives user query 2\. Plans appropriate actions 3\. Executes tools as needed 4\. Analyzes results 5\. Generates final response |
| Priority | Critical |

### **FR-03: Elasticsearch Integration**

| Requirement | Details |
| :---- | :---- |
| Description | Agent can query Elasticsearch security logs |
| Acceptance Criteria | 1\. Connect to Elasticsearch 2\. Execute searches via MCP 3\. Handle time-based queries 4\. Return structured results 5\. Support aggregation queries |
| Priority | Critical |

### **FR-04: Tool Calling**

| Requirement | Details |
| :---- | :---- |
| Description | Agent can call tools via MCP |
| Acceptance Criteria | 1\. Discover available tools 2\. Call tools with parameters 3\. Handle tool responses 4\. Handle errors gracefully |
| Priority | Critical |

### **FR-05: Streaming Responses**

| Requirement | Details |
| :---- | :---- |
| Description | Real-time streaming of agent responses |
| Acceptance Criteria | 1\. Responses stream progressively 2\. UI updates in real-time 3\. Connection error handling 4\. Cancel/stop support |
| Priority | High |

### **FR-06: Observability**

| Requirement | Details |
| :---- | :---- |
| Description | Logging and debugging capabilities |
| Acceptance Criteria | 1\. Structured logging 2\. Tool execution metrics 3\. LLM token tracking 4\. Error tracking 5\. /debug endpoint |
| Priority | Medium |

## **1.8 Non-Functional Requirements**

### **Performance**

| Requirement | Target |
| :---- | :---- |
| Response Time | \<5 seconds for standard queries |
| Streaming Latency | \<500ms first token |
| Concurrent Users | Support 10 concurrent sessions |
| Tool Execution | \<2 seconds per tool call |
| Memory Usage | \<4GB total system footprint |

### **Security**

| Requirement | Details |
| :---- | :---- |
| Data Privacy | All data processed locally (Gemma 4\) |
| Query Validation | Prevent destructive operations |
| API Authentication | Basic API key (Phase 2\) |
| Input Sanitization | Sanitize all user inputs |
| Logging | No sensitive data in logs |

### **Scalability**

| Requirement | Details |
| :---- | :---- |
| Horizontal Scaling | Stateless API layer |
| Elasticsearch | Scalable via cluster |
| MCP Server | Independent component |
| LLM | Single instance initially |

### **Reliability**

| Requirement | Target |
| :---- | :---- |
| Availability | 99% uptime for MVP |
| Error Recovery | Graceful degradation |
| Timeout Handling | 30-second timeout per request |
| Retry Logic | 3 retries for tool calls |

## **1.9 Success Metrics**

### **Quantitative Metrics**

| Metric | Target | Measurement |
| :---- | :---- | :---- |
| Query Success Rate | \>95% | Successful query responses |
| Average Response Time | \<5 seconds | Time from query to response |
| Streaming Latency | \<500ms | Time to first token |
| User Satisfaction | \>4/5 | User surveys |
| Tool Call Success | \>98% | Successful tool executions |
| Error Rate | \<1% | Failed requests |

### **Qualitative Metrics**

| Metric | Target | Measurement |
| :---- | :---- | :---- |
| Query Accuracy | High | Human validation |
| Reasoning Quality | Clear and actionable | Expert review |
| Usability | Easy to use | User feedback |
| Effectiveness | Reduces investigation time | Time comparison |

# **2\. System Architecture Document**

## **2.1 High-Level Architecture**

The system is organized into seven layers, from the **Next.js** user interface through REST/SSE into the FastAPI backend (Context Builder, Session Manager, LangGraph agent), then Tool Registry → MCP Client → MCP Server → Elasticsearch, with a cross-cutting Observability layer.

Stack (top → bottom): **Next.js → REST/SSE → FastAPI → Context Builder / Session Manager → LangGraph (Planner → Router → Executor → Observer) → Tool Registry → MCP Client → MCP Server → Elasticsearch**

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

### **Architecture Principles**

| Principle | Description |
| :---- | :---- |
| Separation of Concerns | Each layer has a single, well-defined responsibility |
| Local First | All processing happens locally (Gemma 4, Elasticsearch, MCP) |
| Standardized Integration | MCP for all tool integrations |
| Observability by Design | Logging, metrics, tracing built-in from day one |
| Extensible | Tool Registry enables easy addition of new tools |
| Security-Aware | Validation, sanitization, and safety checks |

## **2.2 Component Breakdown**

### **2.2.1 User Interface Layer (Next.js)**

| Component | Responsibility |
| :---- | :---- |
| Chat Window | Display conversation with formatted messages |
| Input Box | Capture user queries with keyboard shortcuts |
| Streaming Handler | Display real-time streaming responses |
| Status Bar | Show system health and connection status |
| API Client | REST client for chat + health (browser → FastAPI) |

**Key Functionalities:**

* Real-time message display

* Markdown rendering for responses

* Loading/thinking indicators

* Error display with helpful messages

*Why This Component Matters: Provides the primary user interaction surface, making the agent accessible to analysts without technical query knowledge.*

### **2.2.2 API Gateway Layer**

| Component | Responsibility |
| :---- | :---- |
| REST Endpoints | /health, /debug (Phase 0); /chat, /chat/stream and /api/* (Phase 1–2+) |
| Request Validation | Validate and sanitize incoming requests |
| Session Management | Create and manage chat sessions |
| Response Formatting | Standardize API responses |

**Key Functionalities:**

* Accept chat requests

* Stream responses via Server-Sent Events

* Return system health status

* Provide debug information

*Why This Component Matters: Acts as the bridge between UI and agent, providing a clean, maintainable API surface.*

### **2.2.3 Context Builder & Session Manager**

| Component | Responsibility |
| :---- | :---- |
| System Prompt Assembly | Build dynamic system prompts |
| History Integration | Inject conversation history |
| Tool Context | Add available tool schemas |
| Security Validation | Validate query safety |

**Key Functionalities:**

* Assemble complete context for LLM

* Inject conversation memory

* Prevent unsafe operations

* Format tool schemas for LLM consumption

*Why This Component Matters: Centralizes all context preparation, ensuring consistent, complete prompts for the LLM.*

### **2.2.4 LangGraph Agent (The Core)**

| Component | Responsibility |
| :---- | :---- |
| PLANNER | Generate step-by-step plan using Gemma 4 |
| ROUTER | Decide which tool(s) to execute |
| EXECUTOR | Execute tool calls via Tool Registry |
| OBSERVER | Analyze results using Gemma 4 |
| FINALIZER | Generate final response |

**Key Functionalities:**

* Autonomous planning and execution

* Tool selection and invocation

* Result analysis and synthesis

* Iterative improvement (ReAct pattern)

*Why This Component Matters: This is the intelligence engine that makes the system "autonomous."*

### **2.2.5 Tool Registry**

| Component | Responsibility |
| :---- | :---- |
| Tool Registration | Register new tools |
| Tool Discovery | List available tools |
| Tool Execution | Execute registered tools |
| Tool Metrics | Track tool usage |

**Key Functionalities:**

* Register Elasticsearch search tools

* List available tools for LLM context

* Execute tools with parameter validation

* Track tool performance metrics

*Why This Component Matters: Provides a clean abstraction for tool management, enabling easy extension with new data sources.*

### **2.2.6 MCP Layer**

| Component | Responsibility |
| :---- | :---- |
| MCP Client | Connect to MCP Server, discover tools |
| MCP Server | Expose Elasticsearch operations as MCP tools |
| Protocol Handler | JSON-RPC 2.0 communication |

**Key Functionalities:**

* Standardized tool discovery

* JSON-RPC message formatting

* Connection management

* Error handling and retries

*Why This Component Matters: Provides a standardized bridge between agent and data sources, making the system future-proof.*

### **2.2.7 Data Layer (Elasticsearch)**

| Component | Responsibility |
| :---- | :---- |
| Index Manager | Manage security indices |
| Query Engine | Execute DSL queries |
| Data Ingest | Import sample data |
| Schema Manager | Define and maintain mappings |

**Key Functionalities:**

* Store security alerts and logs

* Execute search queries

* Support aggregations for analytics

* Time-based index management

*Why This Component Matters: Provides the data foundation that powers all security analysis.*

### **2.2.8 Observability Layer**

| Component | Responsibility |
| :---- | :---- |
| Logger | Structured logging |
| Metrics Collector | Track performance metrics |
| Error Tracker | Capture and log errors |
| Debug Interface | /debug endpoint |

**Key Functionalities:**

* Request/response logging

* Tool execution timing

* LLM token usage tracking

* Error aggregation

*Why This Component Matters: Enables debugging, performance monitoring, and system health tracking.*

## **2.3 Data Flow**

Complete Request Flow — from a natural-language question to a structured threat assessment:

Step 1: User Input  
  User types: "What IPs seem malicious today and why?"  
   
Step 2: UI \-\> API  
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

## **2.4 API Specifications**

### **2.4.1 Chat Endpoint**

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

### **2.4.2 Streaming Endpoint**

**Endpoint: POST /api/chat/stream**

Request Body: Same as /api/chat

Response: Server-Sent Events (SSE)

Event Format:

data: {"type": "plan", "content": "Searching Elasticsearch..."}  
   
data: {"type": "thinking", "content": "Analyzing 47 events..."}  
   
data: {"type": "response", "content": "IP 10.0.0.55 appears..."}  
   
data: {"type": "complete", "content": ""}

### **2.4.3 Health Endpoint**

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

### **2.4.4 Debug Endpoint**

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

## **2.5 Deployment Architecture**

### **Local Development Setup (Phase 0)**

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

### **Docker Compose (local stack — Phase 0 authoritative)**

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

# **3\. UI/UX Design System**

## **3.1 Design Philosophy**

### **Core Principles**

| Principle | Application |
| :---- | :---- |
| Clarity First | Every element serves a purpose, no visual noise |
| Professional | Security tool demands trust and professionalism |
| Focus on Content | Chat and responses are primary, UI is secondary |
| Responsive | Works on analyst workstations (desktop-first) |
| Accessible | WCAG 2.1 AA compliant |

### **Design Tone**

* Professional — No playful or casual elements

* Trustworthy — Clean, precise, reliable appearance

* Technical — Appeals to security professionals

* Minimalist — No unnecessary decorations

## **3.2 Color Palette**

### **Primary Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| \#1A1A2E | Dark Navy | Backgrounds, headers |
| \#16213E | Deep Blue | Cards, containers |
| \#0F3460 | Mid Blue | Interactive elements |
| \#E94560 | Accent Red | Alerts, critical information |

### **Secondary Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| \#2D4059 | Slate Gray | Secondary elements |
| \#3C4A6A | Muted Blue | Borders, dividers |
| \#EAEAEA | Light Gray | Text on dark backgrounds |
| \#FFFFFF | White | Primary text, highlights |

### **Semantic Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| \#4CAF50 | Success Green | Successful operations |
| \#F44336 | Error Red | Errors, failures |
| \#FFC107 | Warning Yellow | Warnings, cautions |
| \#2196F3 | Info Blue | Information, help |

### **Threat Level Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| \#4CAF50 | Critical Low | Low severity threats |
| \#FFC107 | Medium | Medium severity threats |
| \#FF9800 | High | High severity threats |
| \#F44336 | Critical High | Critical severity threats |

### **Color Usage Guidelines**

| Element | Color | Usage |
| :---- | :---- | :---- |
| Background | \#1A1A2E | Primary page background |
| Chat Bubble (User) | \#0F3460 | User messages |
| Chat Bubble (AI) | \#16213E | AI responses |
| Primary Text | \#FFFFFF | Main content |
| Secondary Text | \#EAEAEA | Metadata, timestamps |
| Accent | \#E94560 | Buttons, highlights, alerts |
| Borders | \#3C4A6A | Dividers, containers |

## **3.3 Typography**

### **Font Selection**

| Attribute | Value |
| :---- | :---- |
| Primary Font | Inter (Sans-serif) |
| Monospace Font | JetBrains Mono |
| Base Size | 16px |
| Line Height | 1.6 |

### **Typography Scale**

| Style | Spec | Example |
| :---- | :---- | :---- |
| Heading 1 (H1) | Inter, 32px, Weight 700, Line-height 1.2, Color \#FFFFFF, Letter-spacing \-0.02em | "Security Agent Dashboard" |
| Heading 2 (H2) | Inter, 24px, Weight 600, Line-height 1.3, Color \#FFFFFF, Letter-spacing \-0.01em | "Threat Assessment Report" |
| Heading 3 (H3) | Inter, 20px, Weight 600, Line-height 1.4, Color \#EAEAEA | "Suspicious IPs Identified" |
| Body Text | Inter, 16px, Weight 400, Line-height 1.6, Color \#EAEAEA | "Based on the analysis of 47 security events..." |
| Small Text | Inter, 14px, Weight 400, Line-height 1.4, Color \#8A8FA8 | "Processed in 2.3 seconds" |
| Monospace (Code) | JetBrains Mono, 14px, Weight 400, Line-height 1.4, Color \#EAEAEA | "source.ip: 10.0.0.55" |

## **3.4 Component Library**

### **3.4.1 Chat Interface**

CHAT INTERFACE  
   
Security Agent Assistant                                          \[Status\]  
\------------------------------------------------------------------------  
   
User:  What IPs seem malicious today and why?  
   
AI:    Based on my analysis of 47 security events in the  
       last 24 hours, I have identified the following  
       suspicious IP addresses:  
   
       IP 10.0.0.55 \- HIGH RISK  
       \- 42 failed SSH authentication attempts  
       \- Occurred between 2:00 AM \- 4:00 AM  
       \- Targeting multiple user accounts  
   
       Detailed Analysis:  
       \- 87 total attempts  
       \- 45 unique usernames  
       \- 3 successful logins (compromised accounts)  
       \- 2 malware alerts from same source  
   
       Recommended Actions:  
       1\. Block IP 10.0.0.55 at firewall  
       2\. Investigate compromised accounts  
       3\. Review affected systems  
   
       Processed in 2.3s | 47 events analyzed  
   
\[Type your security question...\]                              \[Send\]

### **3.4.2 Input Components**

| Component | Styling | Behavior |
| :---- | :---- | :---- |
| Text Input | Dark background \#16213E, border \#3C4A6A, white text | Focus: border \#E94560 |
| Send Button | \#E94560 background, white text, 8px border-radius | Hover: \#C73E54, Disabled: \#666 |
| Status Indicator | Dot \+ label, color based on status | Green: Connected, Red: Disconnected |

### **3.4.3 Message Components**

| Component | Styling | Behavior |
| :---- | :---- | :---- |
| User Message | Background \#0F3460, White text, Right-aligned | Rounded corners: 12px 4px 12px 12px |
| AI Message | Background \#16213E, White text, Left-aligned | Rounded corners: 4px 12px 12px 12px |
| Loading Indicator | Animated dots | Three dots with pulse animation |
| Error Message | Background rgba(244,67,54,0.1), Red border | Warning icon \+ error text |

## **3.5 Layout & Spacing**

### **Spacing System**

**Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px**

| Size | Usage |
| :---- | :---- |
| 4px | Tiny spacing (between icons and text) |
| 8px | Small spacing (inline elements) |
| 16px | Base spacing (between elements) |
| 24px | Large spacing (sections) |
| 32px | X-Large spacing (page sections) |

### **Layout Structure**

PAGE LAYOUT  
   
Header (64px)  
\------------------------------------------------------------------  
Logo    "Security Agent"                                    Status  
   
Chat Area (flex-grow)  
  Messages (flex-grow, overflow-y)  
    User Message  
    AI Response  
    User Message  
    AI Response (streaming)  
   
Input Area (80px)  
\------------------------------------------------------------------  
\[Input Field ..................................\] \[Send\]

## **3.6 Interaction Patterns**

### **3.6.1 Chat Flow**

* 1\. User types query → Click Send OR Enter key

* 2\. UI shows loading indicator (animated dots)

* 3\. Next.js calls FastAPI (REST/SSE) → Session Manager + Context Builder assemble prompt → LangGraph runs PLAN → ROUTE → EXECUTE → OBSERVE → FINALIZE → MCP retrieves Elasticsearch data

* 4\. Streaming response displayed progressively: "Searching Elasticsearch..." → "Analyzing 47 events..." → "IP 10.0.0.55 appears suspicious..." → full formatted response

* 5\. Complete response displayed with metadata

### **3.6.2 Error States**

| State | Message | Actions |
| :---- | :---- | :---- |
| Network Error | Connection Error — Failed to connect to the API server. Please check your connection. | \[Retry\] |
| Timeout Error | Request Timeout — The request took too long to process. Please try again. | \[Cancel\] \[Retry\] |
| Unsafe Query Error | Safety Check Failed — Your query contains operations that are not allowed. Please modify your question and try again. | — |

## **3.7 Accessibility**

### **WCAG 2.1 AA Compliance**

| Requirement | Implementation |
| :---- | :---- |
| Color Contrast | Minimum 4.5:1 for text |
| Keyboard Navigation | Full keyboard support (Tab, Enter, Esc) |
| Screen Reader Support | ARIA labels, semantic HTML |
| Focus Indicators | Visible focus rings (3px, \#E94560) |
| Text Resize | Works at 200% zoom |
| Error Messages | Clear, descriptive error text |

### **Keyboard Shortcuts**

| Shortcut | Action |
| :---- | :---- |
| Enter | Send message |
| Shift \+ Enter | New line |
| Ctrl/Cmd \+ K | Clear chat |
| Ctrl/Cmd \+ / | Focus input |
| Escape | Cancel streaming |

# **4\. Technical Specification**

## **4.1 Technology Stack**

| Layer | Technology | Version | Purpose |
| :---- | :---- | :---- | :---- |
| Frontend | Next.js | 14+ (App Router) | UI Framework |
|  | React / TypeScript | 18+ / 5+ | UI runtime & types |
|  | Node.js | 20+ | Frontend runtime (container) |
| Backend | FastAPI | 0.104+ | API Framework (REST + SSE) |
|  | Uvicorn | 0.24+ | ASGI Server |
| Agent | LangChain | 0.1.0+ | Agent Framework |
|  | LangGraph | 0.0.15+ | State Machine |
|  | langchain-mcp-adapters | 0.1.0+ | MCP Integration |
| LLM | Ollama | 0.32.1 (pinned; ≥0.30 required) | Model Runner (Docker service) |
|  | Gemma | gemma4:e4b | LLM Model tag for Ollama |
| MCP | docker.elastic.co/mcp/elasticsearch | 0.4.0 | Official Elastic MCP Server (HTTP :8080, /ping) |
| Database | Elasticsearch | 8.11.0 | Data Store |
| Deployment | Docker | 24.0+ | Containerization |
|  | Docker Compose | 2.20+ (plugin) | Orchestration (`docker/docker-compose.yml`) |
| Observability | Python Logging | stdlib | Logging |
|  | Custom Metrics | \- | Performance |

## **4.2 Folder Structure**

security-agent/  
|  
|-- README.md  
|-- .env.example  
|-- .gitignore  
|-- Makefile  
|-- requirements.txt  
|-- pyproject.toml  
|  
|-- backend/  
|   |-- Dockerfile  
|   |-- requirements.txt  
|   |-- pyproject.toml  
|   |  
|   |-- app/  
|       |-- \_\_init\_\_.py  
|       |-- main.py  
|       |-- config.py  
|       |-- models.py  
|       |  
|       |-- api/  
|       |   |-- \_\_init\_\_.py  
|       |   |-- routes.py  
|       |   \`-- streaming.py  
|       |  
|       |-- agent/  
|       |   |-- \_\_init\_\_.py  
|       |   |-- graph.py  
|       |   |-- nodes/  
|       |   |   |-- \_\_init\_\_.py  
|       |   |   |-- planner.py  
|       |   |   |-- router.py  
|       |   |   |-- executor.py  
|       |   |   |-- observer.py  
|       |   |   \`-- finalizer.py  
|       |   \`-- prompts.py  
|       |  
|       |-- context/  
|       |   |-- \_\_init\_\_.py  
|       |   |-- builder.py  
|       |   |-- memory.py  
|       |   \`-- security.py  
|       |  
|       |-- session/  
|       |   |-- \_\_init\_\_.py  
|       |   \`-- manager.py  
|       |  
|       |-- tools/  
|       |   |-- \_\_init\_\_.py  
|       |   |-- registry.py  
|       |   \`-- definitions.py  
|       |  
|       |-- mcp/  
|       |   |-- \_\_init\_\_.py  
|       |   |-- client.py  
|       |   \`-- adapter.py  
|       |  
|       |-- llm/  
|       |   |-- \_\_init\_\_.py  
|       |   \`-- gemma.py  
|       |  
|       \`-- observability/  
|           |-- \_\_init\_\_.py  
|           |-- logger.py  
|           |-- metrics.py  
|           \`-- tracer.py  
|  
|   \`-- data/  
|       |-- generate\_logs.py  
|       \`-- import\_logs.py  
|  
|-- frontend/  
|   |-- Dockerfile  
|   |-- package.json  
|   |-- next.config.mjs  
|   |-- tsconfig.json  
|   \`-- app/  
|       |-- layout.tsx  
|       |-- page.tsx  
|       |-- globals.css  
|       \`-- components/  
|           |-- Chat.tsx  
|           |-- MessageList.tsx  
|           |-- StatusBar.tsx  
|           \`-- api.ts  
|  
|-- data/  
|   \`-- (optional host-side artifacts / sample\_logs.json)  
|  
|-- docker/  
|   \`-- docker-compose.yml  
|  
|-- scripts/  
|   |-- phase0\_setup.sh  
|   |-- start.sh  
|   \`-- stop.sh  
|  
|-- tests/  
|   |-- test\_agent.py  
|   |-- test\_context.py  
|   \`-- test\_tools.py  
|  
\`-- docs/  
    |-- Implemet\_phase0.md  
    |-- architecture.md  
    |-- api.md  
    \`-- setup.md

## **4.3 Coding Standards**

### **Python Standards**

| Aspect | Standard |
| :---- | :---- |
| Style | PEP 8 |
| Linting | Flake8, Pylint |
| Formatting | Black (line length 88\) |
| Type Hints | Required for all functions |
| Docstrings | Google Style |
| Imports | Standard library → Third-party → Local |

### **Example: Python Code**

*backend/app/agent/nodes/planner.py*

from typing import Dict, Any, List  
from langchain\_core.messages import SystemMessage, HumanMessage  
from app.llm.gemma import GemmaLLM  
   
   
class PlannerNode:  
    """  
    PLANNER node for LangGraph agent.  
    Generates a step-by-step plan using Gemma 4\.  
    """  
   
    def \_\_init\_\_(self, llm: GemmaLLM):  
        """  
        Initialize Planner node.  
   
        Args:  
            llm: GemmaLLM instance for generating plans  
        """  
        self.llm \= llm  
   
    async def execute(self, state: Dict\[str, Any\]) \-\> Dict\[str, Any\]:  
        """  
        Generate a plan based on current state.  
   
        Args:  
            state: Current agent state  
   
        Returns:  
            Updated state with plan  
        """  
        user\_query \= state.get("user\_query", "")  
        context \= state.get("context", {})  
   
        \# Generate plan using LLM  
        plan\_response \= await self.llm.generate\_plan(  
            context=context,  
            query=user\_query  
        )  
   
        return {  
            "plan": plan\_response.get("steps", \[\]),  
            "next\_action": "route"  
        }

### **Naming Conventions**

| Element | Convention | Example |
| :---- | :---- | :---- |
| Classes | PascalCase | SecurityAgent, ContextBuilder |
| Functions | snake\_case | generate\_plan, execute\_tool |
| Variables | snake\_case | user\_query, tool\_results |
| Constants | UPPER\_CASE | MAX\_RETRIES, TIMEOUT\_SECONDS |
| Private Methods | \_leading\_underscore | \_validate\_input, \_format\_response |

## **4.4 API Contracts**

**OpenAPI Specification (Excerpt)**

openapi: 3.0.0  
info:  
  title: Security Agent API  
  version: 1.0.0  
  description: Autonomous Security Agent API  
   
paths:  
  /api/chat:  
    post:  
      summary: Send a chat message  
      requestBody:  
        required: true  
        content:  
          application/json:  
            schema:  
              type: object  
              properties:  
                message:  
                  type: string  
                  description: User's security question  
                session\_id:  
                  type: string  
                  description: Session identifier  
      responses:  
        200:  
          description: Success  
          content:  
            application/json:  
              schema:  
                type: object  
                properties:  
                  success:  
                    type: boolean  
                  response:  
                    type: string  
                  metadata:  
                    type: object  
   
  /api/chat/stream:  
    post:  
      summary: Stream chat response  
      responses:  
        200:  
          description: Server-Sent Events stream  
          content:  
            text/event-stream:  
              schema:  
                type: string  
   
  /api/health:  
    get:  
      summary: System health check  
      responses:  
        200:  
          description: System health status  
   
  /api/debug:  
    get:  
      summary: Debug information  
      responses:  
        200:  
          description: Debug metrics and logs

## **4.5 Database Schema**

**Elasticsearch Index Mappings**

MVP seed index: **`alerts-security`** (created by Phase 0 `import_logs.py`). Document IDs are deterministic (`seed-alert-0000` …) so re-import is idempotent.

{  
  "mappings": {  
    "properties": {  
      "@timestamp": { "type": "date" },  
      "source": {  
        "properties": {  
          "ip": { "type": "ip" },  
          "port": { "type": "integer" }  
        }  
      },  
      "destination": {  
        "properties": {  
          "ip": { "type": "ip" },  
          "port": { "type": "integer" }  
        }  
      },  
      "event": {  
        "properties": {  
          "type": { "type": "keyword" },  
          "outcome": { "type": "keyword" },  
          "severity": { "type": "integer" }  
        }  
      },  
      "rule": {  
        "properties": {  
          "name": { "type": "keyword" },  
          "description": { "type": "text" }  
        }  
      },  
      "user": {  
        "properties": {  
          "name": { "type": "keyword" }  
        }  
      },  
      "message": { "type": "text" }  
    }  
  }  
}

Optional fields such as `source.mac`, `destination.domain`, or `user.domain` may be added later for richer production schemas; they are not required by the Phase 0 seed.

**4.6 Security Standards**

*backend/app/context/security.py*

from typing import Dict, Any, List  
   
class SecurityValidator:  
    """Validate user inputs for safety"""  
   
    UNSAFE\_PATTERNS \= \[  
        "delete", "drop", "remove", "update", "alter",  
        "exec", "eval", "system", "shell"  
    \]  
   
    def \_\_init\_\_(self):  
        self.patterns \= self.UNSAFE\_PATTERNS  
   
    def validate\_query(self, query: str) \-\> Dict\[str, Any\]:  
        """  
        Validate query for unsafe operations.  
   
        Args:  
            query: User query string  
   
        Returns:  
            Dict with allowed flag and reason  
        """  
        query\_lower \= query.lower()  
   
        for pattern in self.patterns:  
            if pattern in query\_lower:  
                return {  
                    "allowed": False,  
                    "reason": f"Unsafe operation detected: {pattern}",  
                    "severity": "high"  
                }  
   
        return {  
            "allowed": True,  
            "reason": "Query is safe",  
            "severity": "none"  
        }  
   
    def sanitize\_input(self, text: str) \-\> str:  
        """Sanitize user input"""  
        \# Remove potential control characters  
        import re  
        return re.sub(r'\[\\x00-\\x1f\\x7f-\\x9f\]', '', text)

# **5\. Implementation Roadmap**

## **5.1 Phase 0: Foundation (Day 1\)**

#### ***Objective***

Provision the full local infrastructure stack — Docker services, healthchecks, memory limits, pinned versions, skeleton backend/frontend, and idempotent seed data — so later phases can focus on agent logic rather than environment wiring.

#### ***Why This Phase Exists***

A solid foundation ensures all components work correctly before adding complexity. Phase 0 is **infrastructure only**: it does **not** implement agent logic, LangGraph nodes, or MCP client code (those begin in Phase 1). Without health-gated services, pinned model versions, and idempotent seed data, debugging integration issues becomes extremely difficult.

#### ***Scope Boundary***

| In scope (Phase 0) | Out of scope (Phase 1+) |
| :---- | :---- |
| **Docker Compose stack (5 services)** | **LangGraph agent / nodes** |
| **Elasticsearch, Ollama, official MCP image** | **MCP client + tool calling** |
| **Backend skeleton: `/health`, `/debug` only** | **`/chat`, `/chat/stream` endpoints** |
| **Frontend skeleton: status page only** | **Full chat UI** |
| **Idempotent sample log seed into `alerts-security`** | **Context Builder, Tool Registry, observability metrics** |

#### ***Implementation Approach***

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

#### ***Docker services (this phase)***

| Service | Image / Build | Port | Notes |
| :---- | :---- | :---- | :---- |
| **elasticsearch** | **`docker.elastic.co/elasticsearch/elasticsearch:8.11.0`** | **9200** | **single-node, security off, `mem_limit: 4g`, cluster healthcheck** |
| **ollama** | **`ollama/ollama:0.32.1`** | **11434** | **pinned for `gemma4:e4b` support; healthcheck requires model present; `mem_limit: 10g`** |
| **mcp-server** | **`docker.elastic.co/mcp/elasticsearch:0.4.0`** | **8080** | **official Elastic MCP image, HTTP mode, healthcheck `GET /ping`, `ES_URL=http://elasticsearch:9200`** |
| **backend** | **build `backend/Dockerfile`** | **8000** | **skeleton only; gated on ES + Ollama + MCP healthy** |
| **frontend** | **build `frontend/` (Next.js 14+)** | **3000** | **status page only; gated on backend healthy; browser → `localhost:8000`** |

#### ***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Docker Compose stack** | **All 5 services up with healthchecks and memory limits** |
| **Running Elasticsearch** | **Accessible on localhost:9200; cluster health green/yellow** |
| **Ollama + gemma4:e4b** | **Model present in container (`ollama list`); Ollama ≥ 0.30 required** |
| **MCP Server** | **Official image reachable at localhost:8080/ping** |
| **Backend skeleton** | **`GET /health` reports real connectivity for ES, Ollama, MCP; `GET /debug` placeholder** |
| **Frontend skeleton** | **Next.js status page on localhost:3000** |
| **Idempotent sample data** | **200 alerts in index `alerts-security`; re-import does not duplicate** |

#### ***Detailed To-Do List***

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

#### ***Feature List***

| Feature | Status |
| :---- | :---- |
| **Docker Compose orchestration** | **Available** |
| **Elasticsearch Runtime** | **Available** |
| **Ollama + gemma4:e4b** | **Installed** |
| **Official Elastic MCP Server** | **Running (HTTP :8080)** |
| **Backend skeleton (/health, /debug)** | **Ready** |
| **Next.js frontend skeleton (status page)** | **Ready** |
| **Idempotent Sample Data** | **Generated + indexed** |

#### ***Technology Stack (this phase)***

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

#### ***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **Docker installed + running** | **Yes** |
| **Docker Compose plugin** | **Yes** |
| **Git** | **Yes** |
| **Python 3.11+** | **Yes** |
| **16GB+ RAM recommended** | **Yes (ES 4g + Ollama 10g mem limits)** |
| **20GB+ disk space** | **Yes** |
| **Internet connection** | **Yes (image/model pull)** |

#### ***Expected Outcome***

Before moving to Phase 1, ensure: all five Docker services are healthy; Elasticsearch is searchable; `gemma4:e4b` is loaded in Ollama; MCP responds on `/ping`; backend `/health` reports all components `connected`; seed data is present in `alerts-security` and re-import is idempotent. Agent logic remains intentionally unimplemented.

## **5.2 Phase 1: Core Agent Workflow (Day 1-2)**

#### ***Objective***

Build the autonomous agent core with LangGraph, MCP integration, and Gemma 4 reasoning.

#### ***Why This Phase Exists***

This is the heart of the system. The agent must correctly plan, execute, and analyze security queries. Getting this right early ensures all other features build on a solid foundation.

#### ***Implementation Approach***

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

#### ***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Working MCP Client** | **Connects to Phase 0 Elastic MCP Server (HTTP :8080)** |
| **Tool Registry** | **Registers search and count tools** |
| **Context Builder** | **Builds complete LLM context** |
| **LangGraph Agent** | **Runs PLAN → ROUTE → EXECUTE → OBSERVE loop** |
| **Agent Tested** | **Successfully executes security queries** |

#### ***Detailed To-Do List***

☐  Confirm Phase 0 stack is healthy (`./phase0_setup.sh verify` or equivalent)

☐  Implement MCP Client connection to `MCP_SERVER_URL` (default `http://mcp-server:8080`)

☐  Test tool discovery against running MCP Server (e.g. list indices / search tools)

☐  Build Tool Registry with Elasticsearch tools

☐  Implement Context Builder (system prompt, history, tools)

☐  Integrate LLM client for `gemma4:e4b` via Ollama

☐  Build LangGraph state machine: PLANNER, ROUTER, EXECUTOR, OBSERVER, FINALIZER nodes

☐  Test agent with sample query against `alerts-security`

☐  Debug any issues

#### ***Feature List***

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

#### ***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **LangChain** | **0.1.0+** | **Agent framework** |
| **LangGraph** | **0.0.15+** | **State machine** |
| **langchain-mcp-adapters** | **0.1.0+** | **MCP client integration** |
| **FastAPI** | **0.104+** | **API framework (extends Phase 0 skeleton)** |
| **Ollama + gemma4:e4b** | **from Phase 0** | **Local reasoning model** |
| **Elastic MCP Server** | **from Phase 0 (0.4.0)** | **Already running; not reinstalled here** |

#### ***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **Elasticsearch** | **Running (Phase 0)** |
| **Sample Data (`alerts-security`)** | **Indexed (Phase 0)** |
| **Ollama + gemma4:e4b** | **Loaded (Phase 0)** |
| **MCP Server (:8080)** | **Healthy (Phase 0)** |
| **Backend skeleton** | **Ready (Phase 0)** |

#### ***Expected Outcome***

Before moving to Phase 2, ensure: agent can successfully query Elasticsearch via the Phase 0 MCP Server; `gemma4:e4b` generates correct tool calls; results are analyzed and formatted; end-to-end flow works for "What IPs seem malicious?"

## **5.3 Phase 2: API & Integration (Day 2\)**

#### ***Objective***

Extend the Phase 0 FastAPI skeleton with chat endpoints, streaming support, and a fuller observability layer.

#### ***Why This Phase Exists***

This phase connects the agent to the external world (API) and enables proper debugging (observability), making the system production-ready. Phase 0 already provides `/health` (real dependency checks) and a placeholder `/debug`; Phase 2 adds chat surfaces and enriches observability.

#### ***Implementation Approach***

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Extend Phase 0 FastAPI app** | **Build on `backend/app/main.py` skeleton (do not recreate from scratch)** |
| **2** | **Implement /api/chat endpoint** | **Non-streaming chat → LangGraph agent** |
| **3** | **Implement /api/chat/stream** | **Server-Sent Events** |
| **4** | **Add Observability** | **Logging, metrics, tracing** |
| **5** | **Enrich /health** | **Keep Phase 0 connectivity checks; add version/tool metadata as needed** |
| **6** | **Enrich /debug** | **Replace Phase 0 placeholder with metrics + recent errors** |
| **7** | **Test API Endpoints** | **curl/postman testing** |

#### ***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **FastAPI Application** | **Running on port 8000 (extends Phase 0 skeleton)** |
| **Chat Endpoint** | **Accepts POST requests** |
| **Streaming Endpoint** | **SSE for real-time responses** |
| **Observability** | **Logging and metrics** |
| **Health Check** | **/health (from Phase 0) enriched as needed** |
| **Debug Endpoint** | **/debug with real metrics** |

#### ***Detailed To-Do List***

☐  Extend existing FastAPI app from Phase 0 (`backend/app/main.py`)

☐  Confirm/extend CORS middleware for Next.js origin (`http://localhost:3000`)

☐  Implement /api/chat endpoint (request validation, call LangGraph agent, format response, error handling)

☐  Implement /api/chat/stream (Server-Sent Events, streaming response chunks, connection management)

☐  Implement Observability (structured logging, request timing, tool call metrics, LLM token tracking)

☐  Enrich /health (retain ES / Ollama / MCP checks from Phase 0; add optional metadata)

☐  Enrich /debug (return metrics, return recent errors — replace Phase 0 placeholder)

☐  Test all endpoints

#### ***Feature List***

| Feature | Status |
| :---- | :---- |
| **FastAPI Server** | **Running (from Phase 0)** |
| **/chat Endpoint** | **Working** |
| **/chat/stream Endpoint** | **Working** |
| **Observability** | **Implemented** |
| **/health Endpoint** | **Working (Phase 0 + enrichments)** |
| **/debug Endpoint** | **Working (metrics)** |
| **Error Handling** | **Implemented** |

#### ***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **FastAPI** | **0.104+** | **API framework** |
| **Uvicorn** | **0.24+** | **ASGI server** |
| **Python Logging** | **stdlib** | **Logging** |
| **Pydantic** | **2.0+** | **Data validation** |
| **sse-starlette** | **1.0+** | **SSE support** |

#### ***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **Agent Working** | **Tested (Phase 1\)** |
| **MCP Connected** | **Confirmed (Phase 1\)** |
| **Gemma 4** | **Running (Phase 1\)** |

#### ***Expected Outcome***

Before moving to Phase 3, ensure: all API endpoints respond correctly; streaming works with real-time updates; observability captures all important data; /health shows all components green.

## **5.4 Phase 3: UI & User Experience (Day 2-3)**

#### ***Objective***

Extend the Phase 0 Next.js status skeleton into a full chat UI with REST/SSE streaming support and professional styling.

#### ***Why This Phase Exists***

The UI is how users interact with the agent. A clean, professional interface makes the agent accessible and builds user trust. Phase 0 already ships a status page that can reach backend `/health`; Phase 3 turns that into the analyst-facing chat experience over **REST + SSE**.

#### ***Implementation Approach***

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Extend Phase 0 Next.js app** | **Build on `frontend/app/` App Router skeleton** |
| **2** | **Implement Chat UI** | **Messages, input, send button** |
| **3** | **Add Streaming Support** | **SSE client against FastAPI `/api/chat/stream`** |
| **4** | **Apply Design System** | **Colors, typography, spacing (CSS modules / Tailwind)** |
| **5** | **Add Status Indicators** | **Connection (via `/health`), loading states** |
| **6** | **Test UI** | **End-to-end user testing at localhost:3000** |

#### ***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Next.js App** | **Running on port 3000** |
| **Chat Interface** | **Messages, input, send** |
| **Streaming Responses** | **Real-time display** |
| **Styled UI** | **Design system applied** |
| **Status Indicators** | **Connection, loading** |

#### ***Detailed To-Do List***

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

#### ***Feature List***

| Feature | Status |
| :---- | :---- |
| **Next.js App** | **Extended from Phase 0 skeleton** |
| **Chat Interface** | **Working** |
| **Message Display** | **Working** |
| **Streaming Support (SSE)** | **Working** |
| **Design System** | **Applied** |
| **Status Indicators** | **Working** |
| **Error Handling** | **Working** |

#### ***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **Next.js** | **14+ (App Router)** | **UI framework** |
| **React / TypeScript** | **18+ / 5+** | **Components & types** |
| **CSS / Tailwind (optional)** | **\-** | **Styling** |
| **EventSource / fetch stream** | **\-** | **SSE client to FastAPI** |

#### ***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **API Working** | **Tested (Phase 2\)** |
| **Streaming Working** | **Confirmed (Phase 2\)** |
| **Agent Working** | **Running (Phase 2\)** |

#### ***Expected Outcome***

Before moving to Phase 4, ensure: UI displays properly; queries can be submitted; streaming responses appear correctly; error states display useful messages; system looks professional.

## **5.5 Phase 4: Optimization & Polish (Day 3\)**

#### ***Objective***

Optimize performance, handle edge cases, and prepare for demonstration.

#### ***Why This Phase Exists***

The final phase ensures the system is reliable, performant, and ready for presentation to judges and stakeholders.

#### ***Implementation Approach***

| Step | Action | Command / Component |
| :---- | :---- | :---- |
| **1** | **Performance Optimization** | **Reduce latency, optimize queries** |
| **2** | **Edge Case Handling** | **Timeouts, failures, invalid queries** |
| **3** | **Documentation** | **README, setup guide, demo script** |
| **4** | **Testing** | **End-to-end test scenarios** |
| **5** | **Demo Preparation** | **Sample queries, presentation** |

#### ***Key Deliverables***

| Deliverable | Description |
| :---- | :---- |
| **Optimized System** | **\<5 second response time** |
| **Robust Error Handling** | **Graceful failure recovery** |
| **Documentation** | **Complete setup guide** |
| **Demo Script** | **Prepared demonstration** |

#### ***Detailed To-Do List***

☐  Performance optimization: reduce LLM token usage, optimize Elasticsearch queries, add query timeouts, profile and optimize slow paths

☐  Edge case handling: empty queries, very long queries, no results found, Elasticsearch down, MCP Server down, LLM timeout

☐  Documentation: complete README.md, setup instructions, architecture diagram, API documentation, demo script

☐  Testing: test with 5+ sample queries, test error scenarios, test streaming

☐  Demo preparation: prepare 3-5 demo queries, practice demo flow, prepare slides (if needed)

#### ***Feature List***

| Feature | Status |
| :---- | :---- |
| **Performance Optimization** | **Done** |
| **Edge Case Handling** | **Done** |
| **Documentation** | **Done** |
| **Testing** | **Done** |
| **Demo Ready** | **Ready** |

#### ***Technology Stack (this phase)***

| Tool | Version | Purpose |
| :---- | :---- | :---- |
| **Python** | **3.11+** | **Core language** |
| **Docker** | **24.0+** | **Deployment** |
| **Markdown** | **\-** | **Documentation** |

#### ***Dependencies & Prerequisites***

| Prerequisite | Check |
| :---- | :---- |
| **UI Working** | **Done (Phase 3\)** |
| **API Working** | **Done (Phase 3\)** |
| **Agent Working** | **Done (Phase 3\)** |

#### ***Expected Outcome***

System is: fast (\<5 seconds per query); secure (no unsafe operations); well-documented; ready for demonstration.

## **5.6 Phase Summary**

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

# **6\. Future Enhancements**

## **6.1 Short-Term Roadmap (3-6 Months)**

### **6.1.1 User Experience Enhancements**

| Enhancement | Description | Impact |
| :---- | :---- | :---- |
| Conversation History | Store and retrieve full conversation sessions | Analysts can review past investigations |
| Export Functionality | Export to JSON, CSV, PDF | Share findings with teams |
| Visualizations | Charts for threat trends, severity distribution | Quick visual understanding of threats |
| Dark/Light Mode | Theme switching | User preference, accessibility |
| Query Suggestions | Auto-suggest common queries | Faster investigation |

### **6.1.2 Agent Capabilities**

| Enhancement | Description | Impact |
| :---- | :---- | :---- |
| Multi-Turn Reasoning | Better conversation context understanding | Complex investigations |
| Tool Recommendations | Suggest relevant tools based on queries | Improved accuracy |
| Confidence Scoring | Show confidence in assessments | Better decision-making |
| Explainability | Detailed reasoning for each conclusion | Builds trust, auditability |

### **6.1.3 Performance**

| Enhancement | Description | Impact |
| :---- | :---- | :---- |
| Caching | Cache frequent queries and results | Faster responses, lower resource usage |
| Batching | Batch multiple tool calls | Reduced latency |
| Model Quantization | 4-bit quantization for Gemma 4 | Faster inference, lower memory |
| Parallel Execution | Execute independent tool calls in parallel | Significantly faster queries |

### **6.1.4 Observability**

| Enhancement | Description | Impact |
| :---- | :---- | :---- |
| Detailed Metrics | Prometheus metrics integration | Production monitoring |
| Distributed Tracing | Track requests across components | Debugging complex issues |
| Alerting | Email/Slack alerts for failures | Proactive issue resolution |
| Dashboard | Grafana dashboard for system health | Visual monitoring |

## **6.2 Long-Term Vision (6-12 Months)**

### **6.2.1 Multiple Data Sources**

MULTI-DATA SOURCE ARCHITECTURE  
   
Elasticsearch | Splunk | AWS CloudTrail | VirusTotal | Shodan  
      |\_\_\_\_\_\_\_\_\_\_\_\_|\_\_\_\_\_\_\_\_\_\_\_\_|\_\_\_\_\_\_\_\_\_\_\_\_|\_\_\_\_\_\_\_\_\_\_\_\_|  
                                |  
                                v  
                        MCP Server (Unified API)  
   
Benefits:  
  \- Single interface for all security data  
  \- Correlate across data sources  
  \- Comprehensive threat intelligence

### **6.2.2 Proactive Monitoring**

| Feature | Description | Value |
| :---- | :---- | :---- |
| Automated Threat Hunting | Agent proactively hunts for threats | Continuous protection |
| Anomaly Detection | Identifies unusual patterns automatically | Earlier detection |
| Predictive Alerts | Predicts potential threats based on patterns | Preventative actions |
| 24/7 Monitoring | Continuous analysis of new logs | No gaps in coverage |

### **6.2.3 Natural Language to Report**

| Feature | Description | Value |
| :---- | :---- | :---- |
| Auto-Generated Reports | Create incident reports automatically | Save time, consistency |
| Executive Summaries | Generate management-friendly summaries | Better communication |
| Compliance Reports | Pre-built compliance report templates | Regulatory compliance |

## **6.3 Scalability Considerations**

### **6.3.1 Horizontal Scaling**

| Component | Scaling Approach | Benefit |
| :---- | :---- | :---- |
| API Gateway | Multiple instances behind load balancer | Handle more concurrent users |
| MCP Server | Multiple MCP servers for different data sources | Data source isolation |
| Elasticsearch | Elasticsearch cluster with multiple nodes | Handle more data, faster queries |
| LLM | Future: distributed inference | Handle more concurrent requests |

### **6.3.2 Performance Optimization**

| Area | Optimization | Impact |
| :---- | :---- | :---- |
| Elasticsearch | Index optimization, field mapping | Faster queries |
| LLM | Model quantization, smaller model variants | Faster inference |
| Caching | Multi-level caching | Reduced latency |
| Query Planning | Better plan optimization | Fewer LLM calls |

## **6.4 Security Enhancements**

### **6.4.1 Access Control**

| Feature | Description | Value |
| :---- | :---- | :---- |
| Role-Based Access Control (RBAC) | Different levels of access for different users | Security, compliance |
| API Key Authentication | Secure API access | Prevent unauthorized use |
| Audit Logging | Log all queries and actions | Accountability, compliance |

### **6.4.2 Data Protection**

| Feature | Description | Value |
| :---- | :---- | :---- |
| Data Encryption | Encrypt data at rest and in transit | Data security |
| PII Redaction | Automatically redact PII from logs | Privacy compliance |
| Data Retention Policies | Automatic deletion of old data | Storage management, compliance |

## **6.5 AI & Automation Enhancements**

### **6.5.1 Fine-Tuning**

| Feature | Description | Value |
| :---- | :---- | :---- |
| Domain Fine-Tuning | Fine-tune Gemma 4 on security data | Better accuracy, domain-specific knowledge |
| Few-Shot Learning | Provide examples in prompts | Better responses |
| Reinforcement Learning | Learn from user feedback | Continuous improvement |

### **6.5.2 Automated Actions**

| Feature | Description | Value |
| :---- | :---- | :---- |
| Automated Response | Block IPs, quarantine systems automatically | Faster incident response |
| Playbook Automation | Execute security playbooks | Consistency, speed |
| Self-Healing | Automatically remediate common issues | Reduced manual work |

## **6.6 Cost Optimization**

| Area | Optimization | Savings |
| :---- | :---- | :---- |
| Model Size | Use smaller quantized models | Lower compute costs |
| Caching | Reduce repeated LLM calls | Lower token usage |
| Efficient Queries | Optimize Elasticsearch queries | Lower infrastructure costs |
| Spot Instances | Use spot instances for non-critical workloads | Lower cloud costs |

# **7\. Critical Design Review & Production Hardening Roadmap**

*This section incorporates an independent architecture review of Sections 1-6 conducted after the v1.0 draft. It preserves the reviewer's findings in full and translates each gap into a concrete technical addition, so the document moves from a strong hackathon specification toward a production-oriented one. Nothing in Sections 1-6 is invalidated by this review — it is an additive hardening layer.*

## **7.1 Independent Review — Overall Rating**

| Area | Rating |
| :---- | :---- |
| Product Vision | 9.5 / 10 |
| Architecture | 8.5 / 10 |
| Technical Stack | 9 / 10 |
| Scalability | 8 / 10 |
| Maintainability | 7.5 / 10 |
| Hackathon Readiness | 10 / 10 |
| Production Readiness | 6.5 / 10 |

*Reviewer's headline finding: the document mixes product requirements, architecture, implementation detail, UI design, deployment, and coding standards into one massive document. That is acceptable for a hackathon, but becomes difficult to maintain as the project grows — a structural note that motivated the improved folder structure in Section 7.10 below.*

## **7.2 Strengths Validated by the Review**

| Strength | Why It Matters |
| :---- | :---- |
| Clear problem statement | Frames the project as "SOC analysts spend too much time writing Elasticsearch queries" rather than a vague "build an AI assistant" — a measurable business problem |
| Clean layer separation | UI → API → Context Builder → LangGraph → MCP → Elasticsearch, each with one responsibility |
| Proper multi-step agent workflow | Planner → Router → Executor → Observer → Finalizer, rather than a single LLM call — much closer to how production agents are built |
| MCP as the integration layer | Future data sources (VirusTotal, Splunk, AWS CloudTrail, Shodan) can be added without rewriting the agent |
| Complete, logical roadmap | Infrastructure → Agent → API → Frontend → Optimization — many teams skip this planning entirely |

*Biggest strength, in the reviewer's words: the overall architecture follows a modern AI-agent pattern — natural language interface, LangGraph orchestration, MCP for tool integration, Elasticsearch as the knowledge source, a local model, streaming responses, and a clear roadmap. These are sound choices for both a hackathon MVP and a foundation for future expansion.*

## **7.3 Gap: No Formal Agent State Model**

The v1.0 design mentions LangGraph nodes (Planner, Router, Executor, Observer, Finalizer) but never defines the object that actually flows between them. Without a typed state, retries, tool history, and reasoning traces have nowhere consistent to live. The following AgentState schema formalizes it:

\# backend/app/agent/state/schema.py  
   
from typing import TypedDict, Literal, Optional  
from pydantic import BaseModel  
   
   
class ToolCallRecord(BaseModel):  
    tool\_name: str  
    parameters: dict  
    result: Optional\[dict\] \= None  
    status: Literal\["pending", "success", "failed"\] \= "pending"  
    error: Optional\[str\] \= None  
    duration\_ms: Optional\[float\] \= None  
    attempt: int \= 1  
   
   
class AgentState(TypedDict):  
    session\_id: str  
    user\_query: str  
    conversation\_summary: str          \# rolling summary of older turns  
    recent\_turns: list\[dict\]           \# last N raw turns, verbatim  
    plan: list\[str\]                    \# PLANNER output  
    current\_step: int  
    tool\_history: list\[ToolCallRecord\] \# every EXECUTOR call this turn  
    retries: int  
    max\_retries: int  
    scratchpad: str                    \# OBSERVER's running reasoning notes  
    reasoning\_trace: list\[str\]         \# human-readable trace for /debug and audit  
    final\_response: Optional\[str\]  
    error: Optional\[str\]  
    next\_action: Literal\["route", "execute", "observe", "finalize", "retry", "abort"\]

This state object is what should be logged to the Observability layer (Section 2.2.8) and returned by /api/debug — it is the single source of truth for "what did the agent actually do" during an investigation.

## **7.4 Gap: Context Builder Is Too Simple & No Memory Strategy**

Section 2.2.3 lists the Context Builder's inputs as System Prompt, History, and Tools. The review correctly notes this is missing conversation summarization, long-term memory, retrieval memory, and user preferences — and that as conversations grow, Gemma 4 will eventually hit its context window limit. It also flags a concrete failure mode: if a user asks "Show failed logins" and then follows up with "Only from yesterday," the agent has no defined mechanism to remember that "failed logins" is the subject being filtered.

### **7.4.1 Three-Tier Memory Model**

| Tier | Scope | Mechanism | Example |
| :---- | :---- | :---- | :---- |
| Working memory | Single request | AgentState.scratchpad — Observer's notes as it works through multi-step tool calls | Tracking which IPs have already been checked mid-investigation |
| Short-term (session) memory | Current conversation | recent\_turns (last \~6-10 turns, verbatim) \+ conversation\_summary (older turns, LLM-summarized on rollover) | Resolving "only from yesterday" against the prior turn's "failed logins" filter |
| Long-term memory | Across sessions | Vector store of past investigations (see Section 7.8) | "Have we seen this IP flagged before?" |

### **7.4.2 Entity & Filter Tracking**

To resolve follow-up queries, the Context Builder should extract and persist a small structured "active filter" object per session (not just raw text), updated after every turn:

{  
  "entity": "failed\_logins",  
  "filters": {"time\_range": "last\_24h", "event.outcome": "failure"},  
  "last\_tool\_call": "search\_security\_events",  
  "last\_result\_count": 87  
}

A follow-up such as "Only from yesterday" is then resolved by merging the new constraint into the persisted filter object rather than re-interpreting the query from scratch.

### **7.4.3 Summarization Trigger**

* Keep the last 6-10 raw turns verbatim in context

* When history exceeds that window, summarize the oldest turns into conversation\_summary using a lightweight LLM call, then drop the raw turns

* Re-summarize (fold new summary into old) rather than letting the summary grow unbounded

## **7.5 Gap: Planner and Observer Share One Undifferentiated Model Call**

v1.0 uses Gemma 4 identically for both planning and observing. The review suggests two viable improvements, in increasing order of effort:

| Option | Approach | Trade-off |
| :---- | :---- | :---- |
| A — Model tiering | Small/fast Gemma 4 for PLANNER (cheap, frequent calls); larger or higher-effort Gemma 4 pass for OBSERVER (reasoning over retrieved data) | Needs two model configurations; more infra, better latency/quality balance |
| B — Judge pattern | PLANNER → Tool → JUDGE (separate reasoning pass that scores whether the tool result actually answers the question) → Answer | Adds one LLM call per step but catches cases where a tool call technically succeeded but didn't answer the question |

For the MVP, Option A alone (same model, different prompt/temperature per role, with room to swap in a larger checkpoint for OBSERVER later) is sufficient; Option B is recommended once the Evaluation Strategy (Section 7.9) shows OBSERVER-stage errors are the dominant failure mode.

## **7.6 Gap: Tool Registry Is Named but Not Specified**

Section 2.2.5 names the "Tool Registry" as a component but never enumerates the tools it should register — without concrete tools, the LLM has little real capability. The following is the minimum viable tool set for MVP:

| Tool | Parameters | Returns |
| :---- | :---- | :---- |
| search\_security\_events | query, time\_range, size | List of matching log documents |
| count\_events | filter, time\_range | Integer count |
| aggregate\_events | field, time\_range, agg\_type | Bucketed aggregation (terms, date histogram, etc.) |
| list\_indices | — | Available Elasticsearch indices and their doc counts |
| fetch\_document | index, id | A single document by ID |
| correlate\_ips | ip, time\_range | Cross-index correlation for a given IP (alerts, auth logs, network logs) |
| timeline\_query | entity, time\_range | Chronological event sequence for an entity (IP, user, host) |
| get\_severity\_distribution | time\_range | Count of events grouped by severity/threat level |

Each tool should be registered with a JSON-schema parameter definition (for LLM function-calling) and a declared permission level, used by the guardrail layer in Section 7.7.

## **7.7 Gap: No Retry Strategy and Weak Guardrails**

### **7.7.1 Retry & Recovery Logic**

v1.0's non-functional requirements mention "3 retries for tool calls" (Section 1.8) but never define the decision logic. The EXECUTOR node should implement:

TOOL EXECUTION LIFECYCLE  
   
  Tool Call  
     |  
     v  
  Success? \--Yes--\> Return result to OBSERVER  
     |  
     No  
     v  
  Classify error  
     |  
     \+-- Transient (timeout, 5xx, connection reset)  
     |      \-\> retry with exponential backoff, up to max\_retries  
     |  
     \+-- Permanent (bad params, index not found, permission denied)  
            \-\> try an alternate tool if one covers the same intent  
            \-\> otherwise: stop, and have FINALIZER explain the failure  
               in plain language rather than surfacing a raw error

### **7.7.2 Layered Guardrails**

The v1.0 SecurityValidator (Section 4.6) checks for substrings like "delete" — the review correctly calls this extremely weak (trivially bypassed, and it blocks legitimate words containing those substrings). Guardrails should instead be layered:

| Layer | Purpose | Mechanism |
| :---- | :---- | :---- |
| Tool permission matrix | Restrict which tools a role may invoke at all | Per-role allow-list checked before EXECUTOR dispatches any tool call |
| Query validation | Prevent destructive operations structurally, not lexically | Elasticsearch API key scoped to read-only indices — enforced by the cluster, not by string-matching the prompt |
| Prompt injection detection | Catch attempts to override system instructions via log content or user input | Lightweight classifier pass over retrieved documents and user input before they enter the prompt |
| Output validation | Prevent hallucinated claims and PII leakage | Verify each factual claim in the final response traces to a tool result in tool\_history; redact PII fields before display |
| Rate limiting | Prevent abuse / runaway loops | Per-session and per-IP request caps at the API gateway |

## **7.8 Missing Components**

### **7.8.1 Authentication**

JWT issued at login → validated by a FastAPI dependency on every request → resolved to a user session → scoped to that user's conversation memory and tool permissions.

JWT \-\> FastAPI dependency \-\> User Session \-\> Conversation Memory

### **7.8.2 Cache**

Repeated or near-duplicate questions currently re-run the full LLM → Elasticsearch → LLM pipeline every time. A Redis cache keyed on a normalized (query, time-window) pair can short-circuit that, with a short TTL to respect the freshness security data requires.

Repeated Question \-\> Redis Cache (short TTL) \-\> Return previous result  
                          (cache miss) \-\> LLM \-\> Elasticsearch \-\> LLM \-\> cache write

### **7.8.3 Event Bus / Async Execution**

Direct FastAPI → LangGraph calls work for a hackathon but block on slow investigations. Introducing a queue lets the API return immediately and stream progress, and lets multiple LangGraph workers scale horizontally.

FastAPI \-\> Queue (Redis Streams / Kafka) \-\> Worker pool \-\> LangGraph

### **7.8.4 Vector Memory**

Past investigations, embedded and stored, enable "have we seen this before" style questions and give the OBSERVER precedent to reason from, rather than treating every investigation as isolated.

Past investigations \-\> Embeddings \-\> Vector store \-\> Similarity search \-\> Context for OBSERVER

### **7.8.5 Monitoring**

Section 2.2.8's Observability layer is currently just structured logging. Production operation needs metrics, traces, and dashboards, not just logs.

Structured logs (existing) \+ Prometheus (metrics) \+ OpenTelemetry (traces) \+ LangSmith (LLM/agent traces) \-\> Grafana dashboards

## **7.9 Gap: No Evaluation Strategy**

None of Sections 1-6 define how answer quality will be measured before or after shipping changes. Without this, prompt or model changes are unverifiable. Recommended approach:

* Build a golden set of 30-50 representative queries (drawn from the User Stories in Section 1.6) with expected tool calls and expected answer characteristics

* Run the golden set automatically on every prompt, model, or agent-graph change (regression testing)

* Score each run with an LLM-as-judge pass against a rubric (did it call the right tool, did it correctly interpret results, did it hallucinate) plus periodic human spot-review

* Track four metrics over time: answer accuracy, tool-selection accuracy, hallucination rate, and end-to-end latency

* Treat OBSERVER hallucination rate as the primary signal for whether to invest in the Judge pattern from Section 7.5

## **7.10 Revised Folder Structure**

The reviewer's core structural critique — PRD, architecture, UI, deployment, and coding standards all living in one document — mirrors a codebase risk: business logic and infrastructure concerns intermixed. The folder structure from Section 4.2 is revised to separate them explicitly:

backend/  
    api/  
    core/  
    agent/  
        graph/  
        nodes/  
        prompts/  
        state/  
        memory/  
        tools/  
    services/  
    infrastructure/  
        elastic/  
        mcp/  
        llm/  
    models/  
    schemas/  
    observability/

Note the split: agent/ holds pure orchestration logic (graph, nodes, prompts, state, memory, tools-as-interfaces), while infrastructure/ holds the concrete clients (Elasticsearch, MCP, LLM) those tools call into. services/ sits between them for business logic that doesn't belong in either. This is the same separation-of-concerns principle already stated as an architecture principle in Section 2.1 — applied one level deeper, to the agent module itself.

## **7.11 Production Deployment Topology**

Section 2.5 defines the local development topology (Docker Compose, direct container-to-container calls). For production, the review proposes layering in a reverse proxy, cache, and observability stack:

PRODUCTION TOPOLOGY (target state — builds on Section 2.5's dev topology)  
   
  NGINX  (TLS termination, reverse proxy, rate limiting)  
     |  
     v  
  FastAPI  (auth, session, request validation)  
     |  
     v  
  Redis  (cache \+ session store \+ event queue)  
     |  
     v  
  LangGraph  (agent orchestration)  
     |  
     v  
  Tool Manager  (permission matrix, retry/recovery)  
     |  
     v  
  MCP  (protocol layer)  
     |  
     v  
  Elasticsearch  (read-only scoped credentials)  
   
  Cross-cutting: Observability \-\> Prometheus \-\> Grafana

This is presented as a target architecture, not a Phase 1-4 requirement — Section 5's roadmap remains the correct sequence for the hackathon MVP. The recommendation is to treat the items in this section (7.3-7.9) as a Phase 5, undertaken once the MVP proves the core natural-language-to-insight loop works end to end.

## **7.12 Phase 5: Hardening for Production (Post-MVP)**

| Workstream | Deliverable | Source |
| :---- | :---- | :---- |
| Agent State | Formal AgentState schema wired through all LangGraph nodes | Section 7.3 |
| Memory | Three-tier memory (working/session/long-term) \+ entity/filter tracking | Section 7.4 |
| Model strategy | Tiered Planner/Observer models or Judge pattern, chosen per Section 7.9 evaluation data | Section 7.5 |
| Tool Registry | Full 8-tool set with JSON-schema parameter definitions and permission levels | Section 7.6 |
| Reliability | Retry/backoff \+ alternate-tool fallback in EXECUTOR | Section 7.7.1 |
| Guardrails | Tool permission matrix, read-only ES credentials, injection detection, output validation, rate limiting | Section 7.7.2 |
| Platform | Auth (JWT), Redis cache, event bus/queue, vector memory, Prometheus/Grafana/OpenTelemetry | Section 7.8 |
| Quality | Golden query set \+ automated LLM-as-judge regression harness | Section 7.9 |
| Codebase | Refactor backend/ into the agent/ vs infrastructure/ split | Section 7.10 |

# **Appendix**

## **A. Glossary of Terms**

| Term | Definition |
| :---- | :---- |
| Agent | An AI system that can plan and execute actions autonomously |
| Tool Call | An LLM's request to use an external tool |
| MCP | Model Context Protocol — standardized way to connect LLMs to tools |
| LangGraph | Framework for building stateful, multi-agent applications |
| ReAct | Reasoning \+ Acting pattern for agents |
| SSE | Server-Sent Events — streaming responses |
| DSL | Domain Specific Language — query language for Elasticsearch |
| SOC | Security Operations Center |
| SIEM | Security Information and Event Management |
| AgentState | The formal, typed object threaded through every LangGraph node representing the agent's working memory for one request |
| LLM-as-Judge | Using a (typically stronger) LLM to score another model's output against a rubric, for automated evaluation |
| RBAC | Role-Based Access Control — restricting actions/tools by user role |

## **B. References**

| Resource | Link |
| :---- | :---- |
| LangChain Documentation | https://python.langchain.com |
| LangGraph Documentation | https://langchain-ai.github.io/langgraph |
| MCP Protocol | https://modelcontextprotocol.io |
| Ollama Documentation | https://ollama.com/docs |
| Elasticsearch Documentation | https://www.elastic.co/guide |
| Gemma Documentation | https://ai.google.dev/gemma |

## **C. Version History**

| Version | Date | Author | Changes |
| :---- | :---- | :---- | :---- |
| 1.0 | July 21, 2025 | Team | Initial version |
| 1.1 | July 23, 2025 | Team | Incorporated external architecture review: added Section 7 (Critical Design Review & Production Hardening Roadmap) covering the formal Agent State model, expanded Tool Registry, retry/recovery logic, memory strategy, layered guardrails, evaluation strategy, missing components (Auth, Cache, Event Bus, Vector Memory, Monitoring), a revised folder structure, and a production deployment topology |

## **Document Sign-off**

| Role | Name | Signature | Date |
| :---- | :---- | :---- | :---- |
| Product Owner |  |  |  |
| Tech Lead |  |  |  |
| Developer Lead |  |  |  |
| UX Lead |  |  |  |

