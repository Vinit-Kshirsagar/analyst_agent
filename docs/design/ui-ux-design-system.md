**3\. UI/UX Design System**

**3.1 Design Philosophy**

**Core Principles**

| Principle | Application |
| :---- | :---- |
| **Clarity First** | **Every element serves a purpose, no visual noise** |
| **Professional** | **Security tool demands trust and professionalism** |
| **Focus on Content** | **Chat and responses are primary, UI is secondary** |
| **Responsive** | **Works on analyst workstations (desktop-first)** |
| **Accessible** | **WCAG 2.1 AA compliant** |

**Design Tone**

* Professional — No playful or casual elements  
* Trustworthy — Clean, precise, reliable appearance  
* Technical — Appeals to security professionals  
* Minimalist — No unnecessary decorations

**3.2 Color Palette**

**Primary Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| **\#1A1A2E** | **Dark Navy** | **Backgrounds, headers** |
| **\#16213E** | **Deep Blue** | **Cards, containers** |
| **\#0F3460** | **Mid Blue** | **Interactive elements** |
| **\#E94560** | **Accent Red** | **Alerts, critical information** |

**Secondary Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| **\#2D4059** | **Slate Gray** | **Secondary elements** |
| **\#3C4A6A** | **Muted Blue** | **Borders, dividers** |
| **\#EAEAEA** | **Light Gray** | **Text on dark backgrounds** |
| **\#FFFFFF** | **White** | **Primary text, highlights** |

**Semantic Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| **\#4CAF50** | **Success Green** | **Successful operations** |
| **\#F44336** | **Error Red** | **Errors, failures** |
| **\#FFC107** | **Warning Yellow** | **Warnings, cautions** |
| **\#2196F3** | **Info Blue** | **Information, help** |

**Threat Level Colors**

| Hex | Name | Usage |
| :---- | :---- | :---- |
| **\#4CAF50** | **Critical Low** | **Low severity threats** |
| **\#FFC107** | **Medium** | **Medium severity threats** |
| **\#FF9800** | **High** | **High severity threats** |
| **\#F44336** | **Critical High** | **Critical severity threats** |

**Color Usage Guidelines**

| Element | Color | Usage |
| :---- | :---- | :---- |
| **Background** | **\#1A1A2E** | **Primary page background** |
| **Chat Bubble (User)** | **\#0F3460** | **User messages** |
| **Chat Bubble (AI)** | **\#16213E** | **AI responses** |
| **Primary Text** | **\#FFFFFF** | **Main content** |
| **Secondary Text** | **\#EAEAEA** | **Metadata, timestamps** |
| **Accent** | **\#E94560** | **Buttons, highlights, alerts** |
| **Borders** | **\#3C4A6A** | **Dividers, containers** |

**3.3 Typography**

**Font Selection**

| Attribute | Value |
| :---- | :---- |
| **Primary Font** | **Inter (Sans-serif)** |
| **Monospace Font** | **JetBrains Mono** |
| **Base Size** | **16px** |
| **Line Height** | **1.6** |

**Typography Scale**

| Style | Spec | Example |
| :---- | :---- | :---- |
| **Heading 1 (H1)** | **Inter, 32px, Weight 700, Line-height 1.2, Color \#FFFFFF, Letter-spacing \-0.02em** | **"Security Agent Dashboard"** |
| **Heading 2 (H2)** | **Inter, 24px, Weight 600, Line-height 1.3, Color \#FFFFFF, Letter-spacing \-0.01em** | **"Threat Assessment Report"** |
| **Heading 3 (H3)** | **Inter, 20px, Weight 600, Line-height 1.4, Color \#EAEAEA** | **"Suspicious IPs Identified"** |
| **Body Text** | **Inter, 16px, Weight 400, Line-height 1.6, Color \#EAEAEA** | **"Based on the analysis of 47 security events..."** |
| **Small Text** | **Inter, 14px, Weight 400, Line-height 1.4, Color \#8A8FA8** | **"Processed in 2.3 seconds"** |
| **Monospace (Code)** | **JetBrains Mono, 14px, Weight 400, Line-height 1.4, Color \#EAEAEA** | **"source.ip: 10.0.0.55"** |

**3.4 Component Library**

**3.4.1 Chat Interface**

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

**3.4.2 Input Components**

| Component | Styling | Behavior |
| :---- | :---- | :---- |
| **Text Input** | **Dark background \#16213E, border \#3C4A6A, white text** | **Focus: border \#E94560** |
| **Send Button** | **\#E94560 background, white text, 8px border-radius** | **Hover: \#C73E54, Disabled: \#666** |
| **Status Indicator** | **Dot \+ label, color based on status** | **Green: Connected, Red: Disconnected** |

**3.4.3 Message Components**

| Component | Styling | Behavior |
| :---- | :---- | :---- |
| **User Message** | **Background \#0F3460, White text, Right-aligned** | **Rounded corners: 12px 4px 12px 12px** |
| **AI Message** | **Background \#16213E, White text, Left-aligned** | **Rounded corners: 4px 12px 12px 12px** |
| **Loading Indicator** | **Animated dots** | **Three dots with pulse animation** |
| **Error Message** | **Background rgba(244,67,54,0.1), Red border** | **Warning icon \+ error text** |

**3.5 Layout & Spacing**

**Spacing System**

**Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px**

| Size | Usage |
| :---- | :---- |
| **4px** | **Tiny spacing (between icons and text)** |
| **8px** | **Small spacing (inline elements)** |
| **16px** | **Base spacing (between elements)** |
| **24px** | **Large spacing (sections)** |
| **32px** | **X-Large spacing (page sections)** |

**Layout Structure**

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

**3.6 Interaction Patterns**

**3.6.1 Chat Flow**

* 1\. User types query → Click Send OR Enter key  
* 2\. UI shows loading indicator (animated dots)  
* 3\. Next.js calls FastAPI (REST/SSE) → Session Manager + Context Builder assemble prompt → LangGraph runs PLAN → ROUTE → EXECUTE → OBSERVE → FINALIZE → MCP retrieves Elasticsearch data  
* 4\. Streaming response displayed progressively: "Searching Elasticsearch..." → "Analyzing 47 events..." → "IP 10.0.0.55 appears suspicious..." → full formatted response  
* 5\. Complete response displayed with metadata

**3.6.2 Error States**

| State | Message | Actions |
| :---- | :---- | :---- |
| **Network Error** | **Connection Error — Failed to connect to the API server. Please check your connection.** | **\[Retry\]** |
| **Timeout Error** | **Request Timeout — The request took too long to process. Please try again.** | **\[Cancel\] \[Retry\]** |
| **Unsafe Query Error** | **Safety Check Failed — Your query contains operations that are not allowed. Please modify your question and try again.** | **—** |

**3.7 Accessibility**

**WCAG 2.1 AA Compliance**

| Requirement | Implementation |
| :---- | :---- |
| **Color Contrast** | **Minimum 4.5:1 for text** |
| **Keyboard Navigation** | **Full keyboard support (Tab, Enter, Esc)** |
| **Screen Reader Support** | **ARIA labels, semantic HTML** |
| **Focus Indicators** | **Visible focus rings (3px, \#E94560)** |
| **Text Resize** | **Works at 200% zoom** |
| **Error Messages** | **Clear, descriptive error text** |

**Keyboard Shortcuts**

| Shortcut | Action |
| :---- | :---- |
| **Enter** | **Send message** |
| **Shift \+ Enter** | **New line** |
| **Ctrl/Cmd \+ K** | **Clear chat** |
| **Ctrl/Cmd \+ /** | **Focus input** |
| **Escape** | **Cancel streaming** |

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

