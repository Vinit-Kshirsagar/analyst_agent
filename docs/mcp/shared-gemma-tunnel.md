# Phase 1A Addendum — Shared Remote Gemma via Cloudflare Tunnel

**Status:** Complete and verified (2026-07-27)  
**Owners:** Host (Mayank) = Ollama + tunnel · Teammate (Vinit) = local stack + remote `OLLAMA_URL`

## Objective

Allow a teammate to use a host-hosted **gemma4:e4b** model without installing Ollama or downloading weights. Each developer still runs:

- Backend, frontend, Elasticsearch, MCP server (and later LangGraph) **locally**
- Only **LLM inference** is delegated to the host via Cloudflare Tunnel

## Architecture

```text
                     Host Machine (Mayank)

          ┌─────────────────────────────────┐
          │ Ollama                          │
          │ gemma4:e4b                      │
          │ Port 11434                      │
          └──────────────┬──────────────────┘
                         │
          cloudflared --http-host-header localhost
                         │
                         ▼
       https://xxxxx.trycloudflare.com


                     Team Member (Vinit)

Frontend → Backend → ChatOllama / health check
                → OLLAMA_URL (Cloudflare)
                → Host Ollama → gemma4:e4b

Local ES + MCP stay on the teammate machine.
```

## Critical flags

Host tunnel **must** rewrite Host (otherwise Ollama returns 403):

```bash
cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost
```

Do **not** set `-H "Host: localhost:11434"` on the public URL when testing with curl.

## Operational workflow

### Host (Mayank)

```bash
# Ollama already running (app) is fine; "address already in use" means it is up
curl -s http://127.0.0.1:11434/api/tags

cloudflared tunnel --url http://127.0.0.1:11434 --http-host-header localhost
# DM the printed https://….trycloudflare.com URL (no trailing slash)
# Leave this terminal open while the teammate works
```

**Host’s own backend** should prefer local Ollama (not the public tunnel):

```env
OLLAMA_URL=http://host.docker.internal:11434
```

### Teammate (Vinit)

```env
# docker/.env — no trailing slash
OLLAMA_URL=https://xxxxx.trycloudflare.com
GEMMA_MODEL_TAG=gemma4:e4b
```

Recreate backend after any `OLLAMA_URL` change (env is baked at container create time):

```bash
# from repo root
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --force-recreate backend
# or full stack:
# docker compose -f docker/docker-compose.yml --env-file docker/.env down
# docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

Verify:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env config | grep OLLAMA
curl -sS "$OLLAMA_URL/api/tags" | python3 -m json.tool
curl -s http://localhost:8000/health | python3 -m json.tool
# ollama.status == connected, models include gemma4:e4b
```

Inference test (optional):

```bash
curl -sS "https://xxxxx.trycloudflare.com/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma4:e4b","prompt":"Hello","stream":false}' | python3 -m json.tool
```

On the host, during inference:

```bash
ollama ps
# NAME          PROCESSOR
# gemma4:e4b    100% GPU   (when loaded)
```

`ollama ps` empty after idle is normal (model unloaded).

## Incident report — “Network is unreachable” on teammate

### Symptom

```json
"ollama": {
  "status": "error",
  "detail": "[Errno 101] Network is unreachable"
}
```

with ES/MCP healthy.

### Investigation

1. Host health / local Ollama OK  
2. Teammate still had `OLLAMA_URL=http://host.docker.internal:11434` (no local Ollama on M1)  
3. Updated `docker/.env` to Cloudflare URL; `docker compose config` showed new value  
4. Running backend still used **old** env until recreated  

### Root cause

> Updating `.env` alone does **not** refresh env inside an already-created container. Recreate the backend (or full stack) after changing `OLLAMA_URL`.

### Resolution

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --force-recreate backend
```

Then `/health` reported `ollama: connected` with `gemma4:e4b`.

### Lessons

1. After env changes: **recreate** affected services  
2. Check effective config: `docker compose … config | grep OLLAMA`  
3. Check live container: `docker compose exec backend printenv OLLAMA_URL`  
4. Validate with `/health` and optional `ollama ps` on the host during generate  

## Stop Ollama (host)

If started with `ollama serve` → **Ctrl+C** in that terminal.

If running as macOS app / background:

```bash
pkill ollama
# or quit the Ollama app from the menu bar
```

Verify:

```bash
curl -s http://127.0.0.1:11434/api/tags   # should fail if fully stopped
ollama ps                                 # empty or connection error
```

Stopping Ollama **or** `cloudflared` breaks the teammate’s remote LLM until both are up again.

## Scope vs Phase 1B

| Done (this addendum + MCP PR) | Not done yet (Phase 1B) |
| --- | --- |
| Host Ollama + shared tunnel | LangGraph agent graph |
| Teammate remote `OLLAMA_URL` | Session Manager + Context Builder |
| MCP client + ToolRegistry (PR #1) | ChatOllama wired into agent loop |
| Health + generate over tunnel | `/debug/agent-run` / plan-observe |

## Final outcome

- One shared **gemma4:e4b** on the host  
- Teammates avoid large model download / heavy local GPU  
- Local ES + MCP + app stack stay independent per developer  
- Only inference crosses Cloudflare Tunnel  

Quick tunnels change URL on every restart — share the new URL and recreate the teammate backend when the host restarts `cloudflared`.
