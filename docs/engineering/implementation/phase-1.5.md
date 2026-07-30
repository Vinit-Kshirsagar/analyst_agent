# Phase 1.5 Implementation: Agent Reliability

**Status:** ✅ COMPLETE (2026-07-30)  
**Branch:** `phase1b_A`  
**Commit (typical):** `feat(agent): Phase 1.5 reliability — tool-call repair and smoke suite`  
**Index:** [README.md](./README.md) · [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md)

---

## 1. Why we did Phase 1.5

Phase 1B delivered a working agent (`POST /debug/agent-run` → LangGraph → MCP → ES → answer).  
Live demos still failed often for two reasons:

| Problem | Symptom | Root cause |
| --- | --- | --- |
| **Broken TOOL_CALL JSON** | `error: Could not parse tool call JSON…`, `tools_used: []` | Gemma emits almost-JSON: trailing commas, truncated `}`, nested braces the old regex could not parse |
| **Wrong Elasticsearch fields** | Tool runs but **0 hits** / “no malware alerts” | Model used `severity: "high"` or `event.category` instead of seed schema (`event.severity` int, `event.type`) |

Platform and MCP were healthy; the **router + prompt** were too fragile.  
Phase 1.5 hardens that path so Phase 2 (chat API) and Phase 3 (UI) are not built on a flaky brain.

---

## 2. What we did (summary)

1. **Hardened TOOL_CALL extraction** — balanced-brace slice, trailing-comma fix, auto-close truncated JSON.  
2. **Normalized search arguments** before MCP execute — field aliases + severity words → range queries.  
3. **Rewrote planner system prompt** — documents **real** seed fields and example ES queries.  
4. **Smoke suite** — fixed questions must pass with `tools_used` non-empty and `error: null`.  
5. **Docs** — roadmap marks 1.5 complete; living state doc updated.

---

## 3. Where we changed code

| File | Change |
| --- | --- |
| **`backend/app/agent/tool_call.py`** | **NEW** — `extract_tool_call()`, `normalize_tool_args()`, JSON repair, field rewrite |
| **`backend/app/agent/nodes.py`** | Router uses `extract_tool_call` + `normalize_tool_args` instead of fragile `json.loads` + greedy regex |
| **`backend/app/agent/context.py`** | System prompt: real schema (`event.type`, `event.severity` int, …) + TOOL_CALL / query examples |
| **`scripts/smoke-agent-run.sh`** | **NEW** — automated demo questions against `/debug/agent-run` |
| **`docs/current/roadmap.md`** | Phase 1.5 marked complete; Phase 2 next |
| **`docs/engineering/implementation/CURRENT-STATE-AND-NEXT.md`** | Living “have / limits / next” |
| **`docs/engineering/implementation/README.md`** | Index points at current state |

### What we did **not** change

- MCP client / ToolRegistry transport  
- Seed format or index name (`alerts-security`)  
- SessionManager (still in-memory)  
- No product `/api/chat` or chat UI yet (Phase 2 / 3)

---

## 4. How it works now (impact)

```text
BEFORE 1.5
  Planner → almost-JSON TOOL_CALL
         → Router json.loads fails  → tools_used=[]  → useless answer
  OR parse OK but query uses event.category / severity:"high"
         → ES 0 hits → “no alerts found”

AFTER 1.5
  Planner → TOOL_CALL text
         → extract + repair JSON
         → normalize fields (high → event.severity gte 6, category → event.type)
         → Executor / MCP search
         → Observer summary with real data
```

| Impact | Detail |
| --- | --- |
| **Reliability** | Free-form “high severity malware” can succeed with `tools_used: ["search"]` |
| **Correctness** | Wrong field names are rewritten to match seed data |
| **Team confidence** | `./scripts/smoke-agent-run.sh` is the green bar before Phase 2 |
| **No API break** | Same `/debug/agent-run` contract; response shape unchanged |
| **Still limited** | Extreme model garbage can fail; sessions still RAM-only; no chat UI |

---

## 5. Verification (for reviewers / teammates)

```bash
# Platform still green
./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh

# Phase 1.5 demos (must all PASS)
./scripts/smoke-agent-run.sh
```

Smoke cases:

1. Explicit `event.type malware` search  
2. Free-form “high severity malware alerts (top 3)”  
3. match_all size 3  
4. Empty question → HTTP 400  

Manual spot-check:

```bash
curl -s --max-time 300 -X POST http://localhost:8000/debug/agent-run \
  -H 'Content-Type: application/json' \
  -d '{"question":"Show high severity malware alerts (top 3). Be brief."}' \
  | python3 -m json.tool
# Expect: error null, tools_used includes "search", non-empty answer
```

---

## 6. Notes for the agent-track owner (integrating with graph code)

- **Router is the consumer** of `tool_call.py`. Prefer extending normalize rules there rather than re-prompt-only fixes.  
- **ContextBuilder** prompt is the first line of defense; keep field list in sync with `backend/data/generate_logs.py`.  
- **Do not** reintroduce greedy `re.DOTALL` `\{.*\}` for TOOL_CALL — it breaks nested braces.  
- If adding native tool-calling for Gemma later, keep normalize layer for ES field safety.

### Seed schema cheat-sheet (must stay in prompts)

| Field | Values |
| --- | --- |
| Index | `alerts-security` |
| `event.type` | `malware` \| `authentication` |
| `event.severity` | integer ~1–8 (not `"high"`) |
| `event.outcome` | `success` \| `failure` |

---

## 7. What comes after (Phase 2+)

With 1.5 green, safe next steps:

1. **Phase 2** — `POST /api/chat` (+ SSE stream) wrapping `run_agent`  
2. **Phase 3** — Next.js chat UI  
3. Write a Phase 2 plan doc similar to `phase-1b-plan.md` when starting  

Do not build large UI until smoke-agent-run stays green after pulls.

---

## 8. One-line summary

> Phase 1.5 makes agent tool calls **parse reliably** and **query the real seed schema**, proven by `smoke-agent-run.sh`, so Phase 1 is demo-stable and Phase 2 can start.
