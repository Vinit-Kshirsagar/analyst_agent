# DECISIONS

Architecture Decision Records. Append only; do not rewrite history.

## 2026-07-25

### Decision

Use Docker Compose as the single local orchestration path for Phase 0: Elasticsearch, Ollama, Elastic MCP Server, FastAPI backend, Next.js frontend on a shared bridge network `agent-network`.

### Reason

Service-name DNS (`elasticsearch`, `ollama`, `mcp-server`) and health-gated startup reduce “works on my machine” and intermittent cold-start failures.

### Alternatives Considered

- Host-only processes (manual ES, host Ollama, npm MCP)
- Partial Docker (ES only) with host Ollama/backend

### Trade-offs

- Higher RAM demand and larger image downloads
- Better reproducibility and one-command bring-up

### Impact

Phase 0 and later phases assume compose service URLs. Documented in `docs/current/deployment.md`.

---

## 2026-07-25

### Decision

Pin all images to explicit versions (no `latest`): Elasticsearch `8.11.0`, Ollama `0.32.1`, MCP `docker.elastic.co/mcp/elasticsearch:0.4.0`. Model tag fixed to `gemma4:e4b` (confirmed via host `ollama list`).

### Reason

`latest` and guessed model tags cause silent drift and broken environments.

### Alternatives Considered

- Floating tags with lockfile only
- Host Ollama version only (unpinned for teammates)

### Trade-offs

- Manual bumps for upgrades
- Deterministic team environments

### Impact

Pins live in `docker/.env` and compose defaults.

---

## 2026-07-25

### Decision

Gate service startup with Docker healthchecks and `depends_on: condition: service_healthy`, not process-started alone.

### Reason

Container “Up” ≠ API ready (especially Elasticsearch).

### Alternatives Considered

- Fixed sleep delays in scripts
- Application-level retry only

### Trade-offs

- Slightly longer first boot
- Far fewer flaky connection-refused starts

### Impact

Backend waits for ES + Ollama + MCP healthy; frontend waits for backend healthy.

---

## 2026-07-25

### Decision

MCP server healthcheck uses `pidof elasticsearch-core-mcp-server` (not `curl` against `/ping`). Host/clients still use `GET /ping` → `Ready`.

### Reason

Official Elastic MCP Wolfi image does not include `curl`/`wget`; curl-based healthcheck marked a healthy process as unhealthy and blocked the stack.

### Alternatives Considered

- Custom Dockerfile installing curl on top of MCP image
- Disable MCP healthcheck

### Trade-offs

- Process check is weaker than HTTP probe inside the container
- HTTP `/ping` still validated from host and backend `/health`

### Impact

Compose MCP service can become healthy; backend starts.

---

## 2026-07-25

### Decision

Mount host `${HOME}/.ollama` into the Ollama container instead of a dedicated Docker volume for model weights. Prefer reusing an existing host `gemma4:e4b` over re-pulling ~9.6GB.

### Reason

Separate Docker volume caused empty model list, slow re-download, and ~9.6GB wasted disk from a partial pull. Host already had the model.

### Alternatives Considered

- Pull into `docker_ollama-data` volume (original plan)
- Skip Ollama container; call host via `host.docker.internal`

### Trade-offs

- Host Ollama app can conflict on port/files — stop host Ollama when using compose
- Teammates without host models must still pull once into `~/.ollama`

### Impact

Backend `/health` reports `gemma4:e4b` without second download. Unused `docker_ollama-data` removed after incident.

---

## 2026-07-25

### Decision

Frontend is **Next.js 14 (App Router)** over REST/SSE to FastAPI — not Streamlit.

### Reason

Product architecture direction: production-style UI with standard browser streaming clients.

### Alternatives Considered

- Streamlit status/chat UI
- Pure static HTML

### Trade-offs

- Node/Next image and toolchain complexity vs Streamlit simplicity

### Impact

Phase 0 ships status page only on `:3000`. Full chat UI is Phase 3. CORS allows `http://localhost:3000`.

---

## 2026-07-25

### Decision

Phase 0 backend exposes only `GET /health` and `GET /debug`. No LangGraph, no `/chat`. Seed index name: `alerts-security` with deterministic document IDs for idempotent import.

### Reason

Infrastructure-first milestone: prove wiring before agent logic.

### Alternatives Considered

- Ship agent stubs in Phase 0
- Auto-generated ES IDs (non-idempotent)

### Trade-offs

- Limited user-facing value until Phase 1–3
- Reliable demos and teammate parity on data counts

### Impact

Agent work deferred to Phase 1; seed re-runs do not grow document count.

---

## 2026-07-26

### Decision

Remove Ollama from Docker Compose. Run Ollama on the **host**; backend reaches it at `http://host.docker.internal:11434`. Compose stack is 4 services: Elasticsearch, MCP server, backend, frontend.

### Reason

Team local-dev efficiency: Ollama is the heaviest service (~10GB mem limit, large model weights). Running it on the host avoids Docker Desktop RAM pressure, port/`~/.ollama` conflicts with the desktop app, and a redundant container when models already live under host `~/.ollama`. Each teammate installs Ollama once and pulls `gemma4:e4b` once.

### Alternatives Considered

- Keep Ollama in Compose (previous Phase 0 decision) with host `~/.ollama` bind mount
- Optional Compose profile `full` that still starts an Ollama container for CI-only machines

### Trade-offs

- Slight Ollama version drift across teammate machines (document recommended install; pin model tag `gemma4:e4b`)
- Compose no longer health-gates Ollama; backend `/health` reports Ollama status and can be `degraded` if host Ollama is down
- Linux needs `extra_hosts: host.docker.internal:host-gateway` (added in compose)

### Impact

- `docker/docker-compose.yml`: no `ollama` service; backend `OLLAMA_URL` defaults to host gateway
- Docs/README updated for host-first Ollama setup
- Teammate onboarding: install Ollama → `ollama pull gemma4:e4b` → `ollama serve` → compose up

---

## 2026-07-26

### Decision

Track all project markdown (`docs/`, `DECISIONS.md`, `TODO.md`, `PROJECT_CONTEXT.md`, etc.) in git. Remove the previous blanket `*.md` gitignore rule. Keep `docker/.env` gitignored; commit `docker/.env.example` only.

### Reason

Repo is private; teammates need to see implementation docs and decisions. Ignoring all markdown hid almost all written work from git.

### Alternatives Considered

- Keep ignoring `docs/` only
- Commit `docker/.env` with pins (risk: remote tunnel URLs leak)

### Impact

- `.gitignore` no longer matches `*.md`
- Local secrets/overrides stay in `docker/.env`

---

## 2026-07-26

### Decision

Support **remote Ollama** via `OLLAMA_URL` for teammates who cannot run `gemma4:e4b` (e.g. M1). Prefer Tailscale for private team networking; Cloudflare quick tunnel is an optional short-session tool (`scripts/share-ollama-tunnel.sh`). Always run `./scripts/dev-up.sh` preflight before Compose.

### Reason

One teammate owns LangChain / LangGraph / MCP integration on hardware that cannot host e4b. Sharing only the LLM endpoint keeps their local ES+MCP+backend stack intact.

### Alternatives Considered

- Smaller local model on M1 for agent wiring (good for offline; diverges from demo model)
- Cloud API (OpenAI/Anthropic) instead of Gemma (changes product constraints)
- Full remote backend (harder for MCP/ES iteration)

### Trade-offs

- Tunnel latency and host machine must stay online
- Quick tunnels are unauthenticated — operational discipline required
- Model behavior stays consistent (`gemma4:e4b`) across the team

### Impact

- `scripts/dev-up.sh`, `scripts/share-ollama-tunnel.sh`
- `OLLAMA_URL` documented for local vs remote
