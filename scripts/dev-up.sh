#!/usr/bin/env bash
# dev-up.sh — check host (or remote) Ollama, then start the Compose stack.
#
# Usage (from repo root):
#   ./scripts/dev-up.sh
#   ./scripts/dev-up.sh --no-build
#   ./scripts/dev-up.sh --down
#   OLLAMA_URL=https://xxxx.trycloudflare.com ./scripts/dev-up.sh
#
# Env (optional):
#   OLLAMA_URL       Override probe + compose Ollama URL
#   GEMMA_MODEL_TAG  Default gemma4:e4b
#   COMPOSE_FILE     Default docker/docker-compose.yml
#   ENV_FILE         Default docker/.env (created from .env.example if missing)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.yml}"
ENV_FILE="${ENV_FILE:-docker/.env}"
MODEL_TAG="${GEMMA_MODEL_TAG:-gemma4:e4b}"
DO_BUILD=1
DO_DOWN=0
SKIP_OLLAMA=0

for arg in "$@"; do
  case "$arg" in
    --no-build) DO_BUILD=0 ;;
    --down) DO_DOWN=1 ;;
    --skip-ollama-check) SKIP_OLLAMA=1 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
grn()  { printf '\033[32m%s\033[0m\n' "$*"; }
ylw()  { printf '\033[33m%s\033[0m\n' "$*"; }

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f docker/.env.example ]]; then
    echo "==> No $ENV_FILE — copying docker/.env.example → docker/.env"
    cp docker/.env.example docker/.env
    ENV_FILE=docker/.env
  else
    red "ERROR: missing $ENV_FILE and docker/.env.example"
    exit 1
  fi
fi

# Load pins (OLLAMA_URL, GEMMA_MODEL_TAG, …)
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

MODEL_TAG="${GEMMA_MODEL_TAG:-$MODEL_TAG}"
OLLAMA_URL="${OLLAMA_URL:-http://host.docker.internal:11434}"

# From the host shell, host.docker.internal often does not resolve.
# Probe localhost when using the Docker Desktop host-gateway URL.
PROBE_URL="$OLLAMA_URL"
if [[ "$OLLAMA_URL" == *"host.docker.internal"* ]]; then
  PROBE_URL="http://127.0.0.1:11434"
fi

check_ollama() {
  echo "==> Checking Ollama at $PROBE_URL"
  echo "    Compose OLLAMA_URL=$OLLAMA_URL"
  echo "    Required model: $MODEL_TAG"

  if ! command -v curl >/dev/null 2>&1; then
    red "ERROR: curl is required"
    exit 1
  fi

  local tags_json
  if ! tags_json="$(curl -sf --connect-timeout 5 --max-time 20 "${PROBE_URL}/api/tags")"; then
    red "ERROR: cannot reach Ollama at $PROBE_URL"
    echo ""
    echo "Fix (local host Ollama):"
    echo "  1. Install: https://ollama.com/download"
    echo "  2. Start:   ollama serve   # or open the Ollama app"
    echo "  3. Pull:    ollama pull $MODEL_TAG"
    echo ""
    echo "Fix (remote shared Ollama — e.g. teammate Cloudflare tunnel):"
    echo "  # in docker/.env:"
    echo "  OLLAMA_URL=https://xxxx.trycloudflare.com"
    echo "  ./scripts/dev-up.sh"
    exit 1
  fi

  local has_model=0
  if command -v python3 >/dev/null 2>&1; then
    if printf '%s' "$tags_json" | python3 -c '
import json, sys
model = sys.argv[1]
data = json.load(sys.stdin)
names = [m.get("name", "") for m in data.get("models", [])]
sys.exit(0 if model in names else 1)
' "$MODEL_TAG"; then
      has_model=1
    fi
  else
    if printf '%s' "$tags_json" | grep -q "$MODEL_TAG"; then
      has_model=1
    fi
  fi

  if [[ "$has_model" -ne 1 ]]; then
    red "ERROR: model '$MODEL_TAG' not found on Ollama"
    if command -v python3 >/dev/null 2>&1; then
      echo "Models present:"
      printf '%s' "$tags_json" | python3 -c '
import json,sys
for m in json.load(sys.stdin).get("models", []):
    print("  -", m.get("name", "?"))
'
    fi
    if [[ "$PROBE_URL" == http://127.0.0.1:* || "$PROBE_URL" == http://localhost:* ]]; then
      echo ""
      echo "Pull on this machine:"
      echo "  ollama pull $MODEL_TAG"
    else
      echo ""
      echo "Ask the teammate hosting Ollama to run:"
      echo "  ollama pull $MODEL_TAG"
    fi
    exit 1
  fi

  grn "OK: Ollama reachable and model '$MODEL_TAG' is available"
}

compose() {
  # Pass OLLAMA_URL so runtime export wins over a stale docker/.env if user set it inline
  OLLAMA_URL="$OLLAMA_URL" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

if [[ "$DO_DOWN" -eq 1 ]]; then
  echo "==> Stopping stack"
  compose down
  grn "Stack stopped"
  exit 0
fi

if [[ "$SKIP_OLLAMA" -eq 0 ]]; then
  check_ollama
else
  ylw "Skipping Ollama check (--skip-ollama-check)"
fi

echo "==> Starting Compose stack (elasticsearch, mcp-server, backend, frontend)"
if [[ "$DO_BUILD" -eq 1 ]]; then
  compose up -d --build
else
  compose up -d
fi

echo ""
echo "==> Waiting briefly for backend health..."
sleep 3
if curl -sf --max-time 10 http://127.0.0.1:8000/health >/tmp/analyst-health.$$ 2>/dev/null; then
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool </tmp/analyst-health.$$
  else
    cat /tmp/analyst-health.$$
  fi
  rm -f /tmp/analyst-health.$$
else
  ylw "Backend /health not ready yet — retry:"
  echo "  curl -s http://localhost:8000/health | python3 -m json.tool"
  rm -f /tmp/analyst-health.$$
fi

echo ""
grn "Dev stack is up."
echo "  UI:       http://localhost:3000"
echo "  Backend:  http://localhost:8000/health"
echo "  MCP:      http://localhost:8080/ping"
echo "  ES:       http://localhost:9200"
echo "  Ollama:   $OLLAMA_URL  (probed via $PROBE_URL)"
