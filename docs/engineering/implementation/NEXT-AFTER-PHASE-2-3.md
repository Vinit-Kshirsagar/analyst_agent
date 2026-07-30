# What We Need To Do Next (After Phases 2 & 3)

**Last updated:** 2026-07-30  
**Branch (product work):** `feat/phase-2-3-product-chat`  
**Parent context:** [CURRENT-STATE-AND-NEXT.md](./CURRENT-STATE-AND-NEXT.md)

This is the team roadmap **after** product chat API + Agent Chat UI exist.

---

## 1. Where we are now

```text
✅ Phase 0     Foundation (Docker + host Ollama + health)
✅ Phase 1A    MCP tools + ToolRegistry
✅ Phase 1B    LangGraph agent + /debug/agent-run
✅ Phase 1.5   Tool-call reliability + smoke-agent-run
✅ Phase 2     POST /api/chat + /api/chat/stream (+ smoke-chat-api)
✅ Phase 3     Agent Chat tab in Next.js (calls /api/chat)

⏸ Merge to main + team demo
🔜 Phase 4     Polish / latency / demo quality
⏸ Phase 5     Auth, multi-tenant, production hardening
```

**In plain language:**  
You can open the app, go to **Agent Chat**, ask about `alerts-security`, and get an answer from Gemma + Elasticsearch via MCP. Next is ship to `main`, demo, then polish.

---

## 2. Immediate (this week)

| # | What | How | Impact |
| --- | --- | --- | --- |
| 1 | **Merge** `feat/phase-2-3-product-chat` → `main` | PR + review | Whole team has API + UI |
| 2 | Everyone **`git pull` on main** | `git checkout main && git pull` | Same code |
| 3 | **Joint demo** | seed → smoke scripts → UI chat | Prove product path |
| 4 | **Host Gemma** during demo | Ollama up; tunnel if remote teammate | No empty LLM errors |

### Demo script

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d
./scripts/seed-alerts.sh
./scripts/verify-phase1b-platform.sh
./scripts/smoke-agent-run.sh      # optional regression
./scripts/smoke-chat-api.sh

open http://localhost:3000
# → Enter dashboard → Agent Chat
# Ask: Search alerts-security for event.type malware, size 3. Be brief.
```

---

## 3. Phase 4 — Polish (next real build phase)

**Goal:** Make demos boringly reliable and faster to present.

| Work item | What | Impact |
| --- | --- | --- |
| P4.1 | Faster failure UX when Ollama/MCP down (chat tab banners) | Users see “backend offline” not a hang |
| P4.2 | Better loading states (steps: planning / tools / answer) using SSE events | Feels less like a black box |
| P4.3 | Latency notes (timeouts, tunnel vs local) in docs | Fewer false “broken” reports |
| P4.4 | Golden demo questions list in UI (chips/suggestions) | Non-experts get hits first try |
| P4.5 | Optional: richer seed (guaranteed high-severity malware set) | Consistent stakeholder demos |
| P4.6 | Recorded walkthrough / README Quick start for product path | Onboarding |

**Parallel split (optional)**

| Track A | Track B |
| --- | --- |
| Host ops, seed fixtures, demo script, docs | Chat UX polish, SSE progress UI, error banners |

---

## 4. Phase 5 — Production path (later)

Only after Phase 4 demos are solid.

| Work | Impact |
| --- | --- |
| Auth (who can chat) | Safe multi-user |
| Session persistence (Redis/DB) | History survives restart |
| Guardrails / eval harness | Measure answer quality |
| Real log sources beyond seed | Real SOC value |
| Deploy (TLS, secrets, monitoring) | Not laptop-only |

---

## 5. What we are **not** doing next

- Rebuilding MCP or LangGraph from scratch  
- Putting Ollama back in Docker as default  
- Multi-tenant cloud product before auth design  
- Token-level LLM streaming unless polish needs it (lifecycle SSE already exists)

---

## 6. Success criteria after merge

| Check | Pass |
| --- | --- |
| `main` has `/api/chat` and Agent Chat tab | yes |
| `./scripts/smoke-chat-api.sh` | ALL PASSED |
| UI send → assistant answer | yes |
| `tools_used` often includes `search` on malware question | yes |

---

## 7. One-line next step

> **Merge the product-chat branch, pull main, run smokes, demo Agent Chat — then Phase 4 polish.**
