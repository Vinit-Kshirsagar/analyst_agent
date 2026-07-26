**4\. Technical Specification**

**4.1 Technology Stack**

| Layer | Technology | Version | Purpose |
| :---- | :---- | :---- | :---- |
| **Frontend** | **Next.js** | **14+ (App Router)** | **UI Framework** |
|  | **React / TypeScript** | **18+ / 5+** | **UI runtime & types** |
|  | **Node.js** | **20+** | **Frontend runtime (container)** |
| **Backend** | **FastAPI** | **0.104+** | **API Framework (REST + SSE)** |
|  | **Uvicorn** | **0.24+** | **ASGI Server** |
| **Agent** | **LangChain** | **0.1.0+** | **Agent Framework** |
|  | **LangGraph** | **0.0.15+** | **State Machine** |
|  | **langchain-mcp-adapters** | **0.1.0+** | **MCP Integration** |
| **LLM** | **Ollama** | **0.32.1 (pinned; ≥0.30 required)** | **Model Runner (Docker service)** |
|  | **Gemma** | **gemma4:e4b** | **LLM Model tag for Ollama** |
| **MCP** | **docker.elastic.co/mcp/elasticsearch** | **0.4.0** | **Official Elastic MCP Server (HTTP :8080, /ping)** |
| **Database** | **Elasticsearch** | **8.11.0** | **Data Store** |
| **Deployment** | **Docker** | **24.0+** | **Containerization** |
|  | **Docker Compose** | **2.20+ (plugin)** | **Orchestration (`docker/docker-compose.yml`)** |
| **Observability** | **Python Logging** | **stdlib** | **Logging** |
|  | **Custom Metrics** | **\-** | **Performance** |

**4.2 Folder Structure**

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

**4.3 Coding Standards**

**Python Standards**

| Aspect | Standard |
| :---- | :---- |
| **Style** | **PEP 8** |
| **Linting** | **Flake8, Pylint** |
| **Formatting** | **Black (line length 88\)** |
| **Type Hints** | **Required for all functions** |
| **Docstrings** | **Google Style** |
| **Imports** | **Standard library → Third-party → Local** |

**Example: Python Code**

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

**Naming Conventions**

| Element | Convention | Example |
| :---- | :---- | :---- |
| **Classes** | **PascalCase** | **SecurityAgent, ContextBuilder** |
| **Functions** | **snake\_case** | **generate\_plan, execute\_tool** |
| **Variables** | **snake\_case** | **user\_query, tool\_results** |
| **Constants** | **UPPER\_CASE** | **MAX\_RETRIES, TIMEOUT\_SECONDS** |
| **Private Methods** | **\_leading\_underscore** | **\_validate\_input, \_format\_response** |

**4.4 API Contracts**

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

**4.5 Database Schema**

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

