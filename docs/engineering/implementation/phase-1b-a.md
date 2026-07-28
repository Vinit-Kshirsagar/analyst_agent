# Phase 1B Track A Implementation — Platform & LLM Host (Mayank)

**Status:** ✅ COMPLETE on branch `phase1b_A` (ready to PR/merge)  
**Owner:** Mayank  
**Date:** 2026-07-28  
**Does not include:** LangGraph / agent nodes (Track B — Vinit)

---

## 1. Why this track exists

Phase 1A proved MCP tools and remote Gemma *can* work.  
Phase 1B-A makes the platform **repeatable** so agent work is not blocked by:

- empty Elasticsearch  
- stale `OLLAMA_URL` in containers  
- unclear “is the model up?” checks  

---

## 2. What Mayank implemented (this update)

| Deliverable | Path | Purpose |
| --- | --- | --- |
| Seed one-liner | `scripts/seed-alerts.sh` | Generate 200 alerts + import into ES |
| Platform Gate 0 check | `scripts/verify-phase1b-platform.sh` | ES, seed count, MCP, backend health, Ollama model |
| Env contract | `docker/.env.example` | `OLLAMA_URL` rules + force-recreate backend |
| Compose fix | `docker/docker-compose.yml` | Removed bad `../data:/app/data` overlay that hid `backend/data` |
| Track A runbook | `docs/engineering/phase-1b-track-a.md` | Host Ollama, tunnel, volumes, demo questions |
| Work split | `docs/engineering/phase-1b-work-split.md` | Parallel A/B ownership |
| Full 1B plan | `docs/engineering/phase-1b-plan.md` | Agent design for Track B |

### Intentionally **not** kept in git

- `backend/data/sample_logs.json` — **ephemeral** only (gitignored). Recreated by seed script; agent never reads this file at runtime.

### Kept as code (recipe)

- `backend/data/generate_logs.py` — builds alert JSON  
- `backend/data/import_logs.py` — optional manual import  

---

## 3. Seed pipeline (what happens)

```text
./scripts/seed-alerts.sh

1. Wait for Elasticsearch :9200
2. python3 backend/data/generate_logs.py
      → temp file backend/data/sample_logs.json (200 docs, gitignored)
3. Import via backend container (elasticsearch Python client):
      - create index alerts-security + mappings if needed
      - index docs with ids seed-alert-0000 … seed-alert-0199
4. Data stored in Docker volume: elasticsearch-data
5. Verify count == 200

Runtime (agent / MCP):
  search tool → MCP → Elasticsearch volume
  (does NOT open sample_logs.json)
```

Re-run without `--force`: `200 skipped` = already seeded (good).  
`compose down -v` wipes volume → must seed again.

---

## 4. Volumes we use

| Volume / mount | Role |
| --- | --- |
| **`elasticsearch-data`** (named) | Persists index `alerts-security` and all seed docs |
| **`../backend:/app`** (bind) | Live backend code + generate/import scripts in container |
| ~~`../data:/app/data`~~ | **Removed** — previously overwrote `/app/data` and broke in-container seed paths |

---

## 5. Verification results (Mayank machine, 2026-07-28)

```text
./scripts/verify-phase1b-platform.sh
  [1] Elasticsearch     PASS (yellow — normal single-node)
  [2] alerts-security   PASS (200 documents)
  [3] MCP /ping         PASS Ready
  [4] Backend /health   PASS overall healthy
      elasticsearch connected
      ollama connected models=['gemma4:e4b']
      mcp_server connected tools=[esql, search, get_shards, list_indices, get_mappings]
  [5] Ollama gemma4:e4b PASS
  [6] mcp-tools         PASS tool_count=5

curl ES count → 200
MCP search with JSON body → Total results: 200, showing 2
```

**Note:** `POST /debug/mcp-call?tool_name=search` **without** a JSON body returns FastAPI `Field required` — expected. Always pass `-d '{...}'`.

---

## 6. How this unblocks Phase 1B-B (Vinit)

| Track A gives | Track B uses it for |
| --- | --- |
| 200 searchable alerts | Executor → `search` has real hits |
| Working MCP ToolRegistry | Graph tools list + execute |
| Stable `OLLAMA_URL` / tunnel docs | ChatOllama Planner + Observer |
| `verify-phase1b-platform.sh` | Gate 0 before coding / before demo |
| Demo question list | Acceptance tests for `/debug/agent-run` |

Vinit should **not** reimplement seed or MCP. He builds:

1. `app/agent/llm.py` — ChatOllama  
2. `app/session/` — SessionManager  
3. `app/agent/context.py` — ContextBuilder  
4. LangGraph nodes + `POST /debug/agent-run`  

See [phase-1b-work-split.md](../phase-1b-work-split.md).

---

## 7. Mayank — what to do next (after this)

| Priority | Task | Notes |
| --- | --- | --- |
| 1 | **Commit / PR `phase1b_A`** | Share scripts + docs with Vinit |
| 2 | Stay ready to **run Cloudflare tunnel** when Vinit develops | `--http-host-header localhost` |
| 3 | Keep host Ollama + seed available for integration Gate 3 | `ollama ps` during agent-run |
| 4 | Review Vinit’s agent PR for env/ops only | Don’t rewrite graph unless pairing |
| 5 | **Do not** start Phase 2 chat API or chat UI yet | Wait for agent-run DoD |

### Handoff message to Vinit

```text
Track A (platform) ready on branch phase1b_A:

- ./scripts/seed-alerts.sh
- ./scripts/verify-phase1b-platform.sh
- docs/engineering/implementation/ (phase 0, 1a, 1b-a)

Please run Gate 0, then start Track B from:
docs/engineering/phase-1b-work-split.md

When you need Gemma on my machine, ping me for a tunnel URL
and force-recreate your backend after setting OLLAMA_URL.
```

---

## 8. Definition of done for Track A

- [x] Seed script loads 200 docs idempotently  
- [x] Verify script passes with healthy stack + Ollama  
- [x] Env recreate rules documented  
- [x] Volume mount issue fixed  
- [x] Implementation docs updated (this folder)  
- [ ] PR merged to `main` (pending)  

---

## 9. Related docs

- Ops runbook: [phase-1b-track-a.md](../phase-1b-track-a.md)  
- Shared tunnel incident report: [../mcp/shared-gemma-tunnel.md](../../mcp/shared-gemma-tunnel.md)  
- MCP setup (Vinit): [../mcp/setup_1.md](../../mcp/setup_1.md)  
