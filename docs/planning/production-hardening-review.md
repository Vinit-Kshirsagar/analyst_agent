**7\. Critical Design Review & Production Hardening Roadmap**

*This section incorporates an independent architecture review of Sections 1-6 conducted after the v1.0 draft. It preserves the reviewer's findings in full and translates each gap into a concrete technical addition, so the document moves from a strong hackathon specification toward a production-oriented one. Nothing in Sections 1-6 is invalidated by this review — it is an additive hardening layer.*

**7.1 Independent Review — Overall Rating**

| Area | Rating |
| :---- | :---- |
| **Product Vision** | **9.5 / 10** |
| **Architecture** | **8.5 / 10** |
| **Technical Stack** | **9 / 10** |
| **Scalability** | **8 / 10** |
| **Maintainability** | **7.5 / 10** |
| **Hackathon Readiness** | **10 / 10** |
| **Production Readiness** | **6.5 / 10** |

*Reviewer's headline finding: the document mixes product requirements, architecture, implementation detail, UI design, deployment, and coding standards into one massive document. That is acceptable for a hackathon, but becomes difficult to maintain as the project grows — a structural note that motivated the improved folder structure in Section 7.10 below.*

**7.2 Strengths Validated by the Review**

| Strength | Why It Matters |
| :---- | :---- |
| **Clear problem statement** | **Frames the project as "SOC analysts spend too much time writing Elasticsearch queries" rather than a vague "build an AI assistant" — a measurable business problem** |
| **Clean layer separation** | **UI → API → Context Builder → LangGraph → MCP → Elasticsearch, each with one responsibility** |
| **Proper multi-step agent workflow** | **Planner → Router → Executor → Observer → Finalizer, rather than a single LLM call — much closer to how production agents are built** |
| **MCP as the integration layer** | **Future data sources (VirusTotal, Splunk, AWS CloudTrail, Shodan) can be added without rewriting the agent** |
| **Complete, logical roadmap** | **Infrastructure → Agent → API → Frontend → Optimization — many teams skip this planning entirely** |

*Biggest strength, in the reviewer's words: the overall architecture follows a modern AI-agent pattern — natural language interface, LangGraph orchestration, MCP for tool integration, Elasticsearch as the knowledge source, a local model, streaming responses, and a clear roadmap. These are sound choices for both a hackathon MVP and a foundation for future expansion.*

**7.3 Gap: No Formal Agent State Model**

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

**7.4 Gap: Context Builder Is Too Simple & No Memory Strategy**

Section 2.2.3 lists the Context Builder's inputs as System Prompt, History, and Tools. The review correctly notes this is missing conversation summarization, long-term memory, retrieval memory, and user preferences — and that as conversations grow, Gemma 4 will eventually hit its context window limit. It also flags a concrete failure mode: if a user asks "Show failed logins" and then follows up with "Only from yesterday," the agent has no defined mechanism to remember that "failed logins" is the subject being filtered.

**7.4.1 Three-Tier Memory Model**

| Tier | Scope | Mechanism | Example |
| :---- | :---- | :---- | :---- |
| **Working memory** | **Single request** | **AgentState.scratchpad — Observer's notes as it works through multi-step tool calls** | **Tracking which IPs have already been checked mid-investigation** |
| **Short-term (session) memory** | **Current conversation** | **recent\_turns (last \~6-10 turns, verbatim) \+ conversation\_summary (older turns, LLM-summarized on rollover)** | **Resolving "only from yesterday" against the prior turn's "failed logins" filter** |
| **Long-term memory** | **Across sessions** | **Vector store of past investigations (see Section 7.8)** | **"Have we seen this IP flagged before?"** |

**7.4.2 Entity & Filter Tracking**

To resolve follow-up queries, the Context Builder should extract and persist a small structured "active filter" object per session (not just raw text), updated after every turn:

{  
   "entity": "failed\_logins",  
   "filters": {"time\_range": "last\_24h", "event.outcome": "failure"},  
   "last\_tool\_call": "search\_security\_events",  
   "last\_result\_count": 87  
 }

A follow-up such as "Only from yesterday" is then resolved by merging the new constraint into the persisted filter object rather than re-interpreting the query from scratch.

**7.4.3 Summarization Trigger**

* Keep the last 6-10 raw turns verbatim in context  
* When history exceeds that window, summarize the oldest turns into conversation\_summary using a lightweight LLM call, then drop the raw turns  
* Re-summarize (fold new summary into old) rather than letting the summary grow unbounded

**7.5 Gap: Planner and Observer Share One Undifferentiated Model Call**

v1.0 uses Gemma 4 identically for both planning and observing. The review suggests two viable improvements, in increasing order of effort:

| Option | Approach | Trade-off |
| :---- | :---- | :---- |
| **A — Model tiering** | **Small/fast Gemma 4 for PLANNER (cheap, frequent calls); larger or higher-effort Gemma 4 pass for OBSERVER (reasoning over retrieved data)** | **Needs two model configurations; more infra, better latency/quality balance** |
| **B — Judge pattern** | **PLANNER → Tool → JUDGE (separate reasoning pass that scores whether the tool result actually answers the question) → Answer** | **Adds one LLM call per step but catches cases where a tool call technically succeeded but didn't answer the question** |

For the MVP, Option A alone (same model, different prompt/temperature per role, with room to swap in a larger checkpoint for OBSERVER later) is sufficient; Option B is recommended once the Evaluation Strategy (Section 7.9) shows OBSERVER-stage errors are the dominant failure mode.

**7.6 Gap: Tool Registry Is Named but Not Specified**

Section 2.2.5 names the "Tool Registry" as a component but never enumerates the tools it should register — without concrete tools, the LLM has little real capability. The following is the minimum viable tool set for MVP:

| Tool | Parameters | Returns |
| :---- | :---- | :---- |
| **search\_security\_events** | **query, time\_range, size** | **List of matching log documents** |
| **count\_events** | **filter, time\_range** | **Integer count** |
| **aggregate\_events** | **field, time\_range, agg\_type** | **Bucketed aggregation (terms, date histogram, etc.)** |
| **list\_indices** | **—** | **Available Elasticsearch indices and their doc counts** |
| **fetch\_document** | **index, id** | **A single document by ID** |
| **correlate\_ips** | **ip, time\_range** | **Cross-index correlation for a given IP (alerts, auth logs, network logs)** |
| **timeline\_query** | **entity, time\_range** | **Chronological event sequence for an entity (IP, user, host)** |
| **get\_severity\_distribution** | **time\_range** | **Count of events grouped by severity/threat level** |

Each tool should be registered with a JSON-schema parameter definition (for LLM function-calling) and a declared permission level, used by the guardrail layer in Section 7.7.

**7.7 Gap: No Retry Strategy and Weak Guardrails**

**7.7.1 Retry & Recovery Logic**

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

**7.7.2 Layered Guardrails**

The v1.0 SecurityValidator (Section 4.6) checks for substrings like "delete" — the review correctly calls this extremely weak (trivially bypassed, and it blocks legitimate words containing those substrings). Guardrails should instead be layered:

| Layer | Purpose | Mechanism |
| :---- | :---- | :---- |
| **Tool permission matrix** | **Restrict which tools a role may invoke at all** | **Per-role allow-list checked before EXECUTOR dispatches any tool call** |
| **Query validation** | **Prevent destructive operations structurally, not lexically** | **Elasticsearch API key scoped to read-only indices — enforced by the cluster, not by string-matching the prompt** |
| **Prompt injection detection** | **Catch attempts to override system instructions via log content or user input** | **Lightweight classifier pass over retrieved documents and user input before they enter the prompt** |
| **Output validation** | **Prevent hallucinated claims and PII leakage** | **Verify each factual claim in the final response traces to a tool result in tool\_history; redact PII fields before display** |
| **Rate limiting** | **Prevent abuse / runaway loops** | **Per-session and per-IP request caps at the API gateway** |

**7.8 Missing Components**

**7.8.1 Authentication**

JWT issued at login → validated by a FastAPI dependency on every request → resolved to a user session → scoped to that user's conversation memory and tool permissions.

JWT \-\> FastAPI dependency \-\> User Session \-\> Conversation Memory

**7.8.2 Cache**

Repeated or near-duplicate questions currently re-run the full LLM → Elasticsearch → LLM pipeline every time. A Redis cache keyed on a normalized (query, time-window) pair can short-circuit that, with a short TTL to respect the freshness security data requires.

Repeated Question \-\> Redis Cache (short TTL) \-\> Return previous result  
                           (cache miss) \-\> LLM \-\> Elasticsearch \-\> LLM \-\> cache write

**7.8.3 Event Bus / Async Execution**

Direct FastAPI → LangGraph calls work for a hackathon but block on slow investigations. Introducing a queue lets the API return immediately and stream progress, and lets multiple LangGraph workers scale horizontally.

FastAPI \-\> Queue (Redis Streams / Kafka) \-\> Worker pool \-\> LangGraph

**7.8.4 Vector Memory**

Past investigations, embedded and stored, enable "have we seen this before" style questions and give the OBSERVER precedent to reason from, rather than treating every investigation as isolated.

Past investigations \-\> Embeddings \-\> Vector store \-\> Similarity search \-\> Context for OBSERVER

**7.8.5 Monitoring**

Section 2.2.8's Observability layer is currently just structured logging. Production operation needs metrics, traces, and dashboards, not just logs.

Structured logs (existing) \+ Prometheus (metrics) \+ OpenTelemetry (traces) \+ LangSmith (LLM/agent traces) \-\> Grafana dashboards

**7.9 Gap: No Evaluation Strategy**

None of Sections 1-6 define how answer quality will be measured before or after shipping changes. Without this, prompt or model changes are unverifiable. Recommended approach:

* Build a golden set of 30-50 representative queries (drawn from the User Stories in Section 1.6) with expected tool calls and expected answer characteristics  
* Run the golden set automatically on every prompt, model, or agent-graph change (regression testing)  
* Score each run with an LLM-as-judge pass against a rubric (did it call the right tool, did it correctly interpret results, did it hallucinate) plus periodic human spot-review  
* Track four metrics over time: answer accuracy, tool-selection accuracy, hallucination rate, and end-to-end latency  
* Treat OBSERVER hallucination rate as the primary signal for whether to invest in the Judge pattern from Section 7.5

**7.10 Revised Folder Structure**

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

**7.11 Production Deployment Topology**

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

**7.12 Phase 5: Hardening for Production (Post-MVP)**

| Workstream | Deliverable | Source |
| :---- | :---- | :---- |
| **Agent State** | **Formal AgentState schema wired through all LangGraph nodes** | **Section 7.3** |
| **Memory** | **Three-tier memory (working/session/long-term) \+ entity/filter tracking** | **Section 7.4** |
| **Model strategy** | **Tiered Planner/Observer models or Judge pattern, chosen per Section 7.9 evaluation data** | **Section 7.5** |
| **Tool Registry** | **Full 8-tool set with JSON-schema parameter definitions and permission levels** | **Section 7.6** |
| **Reliability** | **Retry/backoff \+ alternate-tool fallback in EXECUTOR** | **Section 7.7.1** |
| **Guardrails** | **Tool permission matrix, read-only ES credentials, injection detection, output validation, rate limiting** | **Section 7.7.2** |
| **Platform** | **Auth (JWT), Redis cache, event bus/queue, vector memory, Prometheus/Grafana/OpenTelemetry** | **Section 7.8** |
| **Quality** | **Golden query set \+ automated LLM-as-judge regression harness** | **Section 7.9** |
| **Codebase** | **Refactor backend/ into the agent/ vs infrastructure/ split** | **Section 7.10** |

**Appendix**

**A. Glossary of Terms**

| Term | Definition |
| :---- | :---- |
| **Agent** | **An AI system that can plan and execute actions autonomously** |
| **Tool Call** | **An LLM's request to use an external tool** |
| **MCP** | **Model Context Protocol — standardized way to connect LLMs to tools** |
| **LangGraph** | **Framework for building stateful, multi-agent applications** |
| **ReAct** | **Reasoning \+ Acting pattern for agents** |
| **SSE** | **Server-Sent Events — streaming responses** |
| **DSL** | **Domain Specific Language — query language for Elasticsearch** |
| **SOC** | **Security Operations Center** |
| **SIEM** | **Security Information and Event Management** |
| **AgentState** | **The formal, typed object threaded through every LangGraph node representing the agent's working memory for one request** |
| **LLM-as-Judge** | **Using a (typically stronger) LLM to score another model's output against a rubric, for automated evaluation** |
| **RBAC** | **Role-Based Access Control — restricting actions/tools by user role** |

**B. References**

| Resource | Link |
| :---- | :---- |
| **LangChain Documentation** | **https://python.langchain.com** |
| **LangGraph Documentation** | **https://langchain-ai.github.io/langgraph** |
| **MCP Protocol** | **https://modelcontextprotocol.io** |
| **Ollama Documentation** | **https://ollama.com/docs** |
| **Elasticsearch Documentation** | **https://www.elastic.co/guide** |
| **Gemma Documentation** | **https://ai.google.dev/gemma** |

**C. Version History**

| Version | Date | Author | Changes |
| :---- | :---- | :---- | :---- |
| **1.0** | **July 21, 2025** | **Team** | **Initial version** |
| **1.1** | **July 23, 2025** | **Team** | **Incorporated external architecture review: added Section 7 (Critical Design Review & Production Hardening Roadmap) covering the formal Agent State model, expanded Tool Registry, retry/recovery logic, memory strategy, layered guardrails, evaluation strategy, missing components (Auth, Cache, Event Bus, Vector Memory, Monitoring), a revised folder structure, and a production deployment topology** |

**Document Sign-off**

