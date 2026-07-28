# Phase 1B Track A — Platform & LLM Host (Mayank)

**Branch:** `phase1b_A`  
**Owner:** Mayank  
**Peer track:** Vinit → agent graph (`feat/phase-1b-agent` or similar)  
**Plans:** [phase-1b-plan.md](./phase-1b-plan.md) · [phase-1b-work-split.md](./phase-1b-work-split.md)

---

## Goal

Keep **Gemma**, **Elasticsearch seed data**, and **env contracts** reliable so Track B can build LangGraph without infra blockers.

---

## Deliverables on this branch

| ID | Deliverable | Path |
| --- | --- | --- |
| A1 | Host Ollama + tunnel runbook | this file § Host runbook + [shared-gemma-tunnel.md](../mcp/shared-gemma-tunnel.md) |
| A2 | Env contract + recreate rules | `docker/.env.example` |
| A3 | Reliable seed | `./scripts/seed-alerts.sh` |
| A4 | Platform verification | `./scripts/verify-phase1b-platform.sh` |
| A5 | Demo questions | this file § Demo questions |

---

## Host runbook (A1)

### Local Ollama (your backend)

```bash
# Ollama app or: ollama serve
curl -s http://127.0.0.1:11434/api/tags | python3 -m json.tool
# must list gemma4:e4b

# docker/.env on HOST machine:
#   OLLAMA_URL=http://host.docker.internal:11434
```

### Share model with Vinit (Cloudflare)

```bash
cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost
# DM the https://….trycloudflare.com URL — no trailing slash
# Leave terminal open; new URL every restart
```

Vinit sets that URL in **his** `docker/.env` and force-recreates **his** backend.

### Stop sharing / stop Ollama

```bash
# cloudflared terminal: Ctrl+C
# Ollama app: quit, or pkill ollama
```

---

## Env contract (A2)

| Variable | Host (Mayank) | Teammate (Vinit) |
| --- | --- | --- |
| `OLLAMA_URL` | `http://host.docker.internal:11434` | `https://….trycloudflare.com` |
| `GEMMA_MODEL_TAG` | `gemma4:e4b` | `gemma4:e4b` |

**After any `OLLAMA_URL` change:**

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env \
  up -d --force-recreate backend

docker compose -f docker/docker-compose.yml --env-file docker/.env \
  exec backend printenv OLLAMA_URL

curl -s http://localhost:8000/health | python3 -m json.tool
```

---

## Seed alerts (A3) — what and impact

### Do we need `sample_logs.json` in the repo?

**No.** It is **not committed** (gitignored). It is only a **temporary** file:

```text
generate_logs.py  →  sample_logs.json (temp, optional to keep)
                  →  Elasticsearch alerts-security  ← agent/MCP search HERE
```

| Keep in git | Ephemeral / local only |
| --- | --- |
| `generate_logs.py` (recipe) | `sample_logs.json` (deleted after seed or anytime) |
| `import_logs.py` (optional manual import) | |
| `scripts/seed-alerts.sh` (one-shot pipeline) | |

### What gets loaded into Elasticsearch

- **Index:** `alerts-security`
- **Count:** 200 documents
- **IDs:** `seed-alert-0000` … `seed-alert-0199` (idempotent re-import)
- **Fields:** timestamp, source/dest IP, event.type (`malware` \| `authentication`), severity, rule name, user, message

### What happens when you run it

```bash
./scripts/seed-alerts.sh
# optional full rewrite: ./scripts/seed-alerts.sh --force
```

1. Runs `generate_logs.py` → writes temp `backend/data/sample_logs.json`  
2. Copies JSON into backend container (or uses host Python)  
3. Creates index `alerts-security` if missing + indexes 200 docs by `_id`  
4. Data is stored in the **`elasticsearch-data` Docker volume** (survives container restarts)  
5. Prints total count  

**Impact:** MCP `search` and future `/debug/agent-run` query **ES**, not the JSON file.

Without seed → agent has nothing to retrieve.  
With seed → questions like “high severity malware” can hit real fields.

### Volumes (what we use)

| Volume / mount | Where | Purpose |
| --- | --- | --- |
| **`elasticsearch-data`** (named volume) | ES container `/usr/share/elasticsearch/data` | **Persists** seeded alerts + indices across `compose down` (without `-v`) |
| **`../backend:/app`** (bind mount) | backend container | Live code reload; includes `generate_logs.py` / `import_logs.py` |
| ~~`../data:/app/data`~~ | removed | Used to hide `backend/data` inside the container; fixed on Track A |

**Not used for seed storage:** host `sample_logs.json` is not the database. Wipe ES with `docker compose … down -v` (destroys volume) → must re-run `./scripts/seed-alerts.sh`.

---

## Platform verify (A4)

```bash
# stack up first
./scripts/dev-up.sh          # or compose up
./scripts/seed-alerts.sh     # if index empty
./scripts/verify-phase1b-platform.sh
```

Exit 0 = Gate 0 ready for parallel Track B work.

---

## Demo questions (A5)

Use after Track B ships `POST /debug/agent-run` (or today with MCP debug for search-only checks).

| # | Question | Expected signal |
| --- | --- | --- |
| 1 | Show high severity malware alerts (top 5) | tool `search`; answer mentions malware/severity/IPs |
| 2 | What indices match pattern `*`? | tool `list_indices` |
| 3 | List failed authentication events | `search` with authentication/failure-ish results |
| 4 | (multi-turn) Only severity greater than 7 | same `session_id`; filtered follow-up |

MCP-only smoke (no agent yet):

```bash
curl -s -X POST "http://localhost:8000/debug/mcp-call?tool_name=search" \
  -H "Content-Type: application/json" \
  -d '{"index":"alerts-security","query_body":{"query":{"match_all":{}},"size":2}}' \
  | python3 -m json.tool
```

---

## Import process (step-by-step)

```text
You run:  ./scripts/seed-alerts.sh

1. Wait until http://localhost:9200 is healthy
2. python3 backend/data/generate_logs.py
      → creates backend/data/sample_logs.json (200 alerts, gitignored)
3. Prefer: backend container has `elasticsearch` Python package
      docker cp sample_logs.json → backend:/tmp/sample_logs.json
      python inside backend:
        - create index alerts-security (mappings) if needed
        - for each doc: es.index(id=seed-alert-NNNN, document=_source)
        - refresh index
4. Fallback: same import via host Python if backend is down
5. Verify: GET /alerts-security/_count → 200

Runtime search path (agent / MCP):
  ToolRegistry.search → MCP → Elasticsearch volume data
  (never reads sample_logs.json)
```

## Daily checklist (Track A)

- [ ] Ollama up with `gemma4:e4b`
- [ ] If Vinit coding: tunnel up + URL shared
- [ ] `./scripts/seed-alerts.sh` if ES was wiped (`down -v` or empty index)
- [ ] `./scripts/verify-phase1b-platform.sh` green
- [ ] Do **not** implement LangGraph on this branch (that’s Track B)

---

## Integration with Track B

| Gate | Mayank | Vinit |
| --- | --- | --- |
| 0 | verify script green | same |
| 1 | tunnel/health ollama | ChatOllama works |
| 3 | keep model warm; watch `ollama ps` | `/debug/agent-run` demo |

---

## Out of scope for Track A

- LangGraph nodes, session store, Context Builder code  
- Next.js chat UI  
- Production `/api/chat`  
