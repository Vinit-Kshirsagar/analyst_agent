#!/usr/bin/env bash
# verify-phase1b-platform.sh — Gate 0 / Track A platform checks for Phase 1B.
#
# Usage (from repo root):
#   ./scripts/verify-phase1b-platform.sh
#   OLLAMA_PROBE_URL=https://xxxx.trycloudflare.com ./scripts/verify-phase1b-platform.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-docker/.env}"
ES_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
MCP_URL="${MCP_SERVER_URL:-http://localhost:8080}"
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FAILS=0
TMPDIR_V="${TMPDIR:-/tmp}/phase1b-verify-$$"
mkdir -p "$TMPDIR_V"
trap 'rm -rf "$TMPDIR_V"' EXIT

red() { printf '\033[31m%s\033[0m\n' "$*"; }
grn() { printf '\033[32m%s\033[0m\n' "$*"; }
ylw() { printf '\033[33m%s\033[0m\n' "$*"; }

pass() { grn "  PASS  $*"; }
fail() { red "  FAIL  $*"; FAILS=$((FAILS + 1)); }

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE" 2>/dev/null || true
  set +a
fi

OLLAMA_PROBE_URL="${OLLAMA_PROBE_URL:-}"
if [[ -z "$OLLAMA_PROBE_URL" && -n "${OLLAMA_URL:-}" ]]; then
  if [[ "$OLLAMA_URL" == *"host.docker.internal"* ]]; then
    OLLAMA_PROBE_URL="http://127.0.0.1:11434"
  else
    OLLAMA_PROBE_URL="$OLLAMA_URL"
  fi
fi
OLLAMA_PROBE_URL="${OLLAMA_PROBE_URL:-http://127.0.0.1:11434}"
OLLAMA_PROBE_URL="${OLLAMA_PROBE_URL%/}"
MODEL_TAG="${GEMMA_MODEL_TAG:-gemma4:e4b}"

echo "=============================================="
echo " Phase 1B Track A — platform verification"
echo "=============================================="
echo "ES=$ES_URL  MCP=$MCP_URL  backend=$BACKEND_URL"
echo "Ollama probe=$OLLAMA_PROBE_URL  model=$MODEL_TAG"
echo ""

echo "[1] Elasticsearch"
if curl -sf --max-time 5 "$ES_URL/_cluster/health" >"$TMPDIR_V/es_health" 2>/dev/null; then
  status="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("status","?"))' "$TMPDIR_V/es_health")"
  pass "cluster reachable (status=$status)"
else
  fail "cluster not reachable at $ES_URL"
fi

echo "[2] Seed index alerts-security"
if curl -sf --max-time 5 "$ES_URL/alerts-security/_count" >"$TMPDIR_V/es_count" 2>/dev/null; then
  count="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("count",0))' "$TMPDIR_V/es_count")"
  if [[ "${count:-0}" -ge 1 ]]; then
    pass "alerts-security has $count document(s)"
  else
    fail "alerts-security empty — run: ./scripts/seed-alerts.sh"
  fi
else
  fail "alerts-security missing — run: ./scripts/seed-alerts.sh"
fi

echo "[3] MCP server"
if body="$(curl -sf --max-time 5 "$MCP_URL/ping" 2>/dev/null)"; then
  pass "GET /ping → $body"
else
  fail "MCP not reachable at $MCP_URL/ping"
fi

echo "[4] Backend /health"
if curl -sf --max-time 10 "$BACKEND_URL/health" >"$TMPDIR_V/be_health" 2>/dev/null; then
  python3 - "$TMPDIR_V/be_health" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
print("  overall:", d.get("status"))
for name, comp in (d.get("components") or {}).items():
    st = comp.get("status")
    extra = ""
    if name == "ollama" and "models" in comp:
        extra = f" models={comp.get('models')}"
    if name == "mcp_server" and isinstance(comp.get("tool_registry"), list):
        extra = f" tools={comp.get('tool_registry')}"
    print(f"  - {name}: {st}{extra}")
comps = d.get("components") or {}
es = (comps.get("elasticsearch") or {}).get("status")
mcp = (comps.get("mcp_server") or {}).get("status")
sys.exit(0 if es == "connected" and mcp == "connected" else 1)
PY
  if [[ $? -eq 0 ]]; then
    pass "backend ES+MCP connected (overall may be degraded if ollama down)"
  else
    fail "backend /health ES or MCP not connected"
    python3 -m json.tool <"$TMPDIR_V/be_health" 2>/dev/null || cat "$TMPDIR_V/be_health"
  fi
  ollama_st="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("components",{}).get("ollama",{}).get("status","?"))' "$TMPDIR_V/be_health")"
  if [[ "$ollama_st" == "connected" ]]; then
    pass "backend ollama component: connected"
  else
    ylw "  WARN  backend ollama: $ollama_st (set OLLAMA_URL + recreate backend; host Ollama/tunnel)"
  fi
else
  fail "backend not reachable at $BACKEND_URL/health"
fi

echo "[5] Ollama model ($MODEL_TAG)"
if curl -sf --max-time 15 "${OLLAMA_PROBE_URL}/api/tags" >"$TMPDIR_V/tags" 2>/dev/null; then
  if python3 -c 'import json,sys; m=sys.argv[1]; names=[x.get("name") for x in json.load(open(sys.argv[2])).get("models",[])]; sys.exit(0 if m in names else 1)' "$MODEL_TAG" "$TMPDIR_V/tags"; then
    pass "probe $OLLAMA_PROBE_URL has $MODEL_TAG"
  else
    fail "probe reachable but $MODEL_TAG missing — ollama pull $MODEL_TAG"
  fi
else
  fail "cannot reach Ollama at $OLLAMA_PROBE_URL"
fi

echo "[6] MCP tools (optional soft check)"
if curl -sf --max-time 10 "$BACKEND_URL/debug/mcp-tools" >"$TMPDIR_V/mcp_tools" 2>/dev/null; then
  tc="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("tool_count",0))' "$TMPDIR_V/mcp_tools")"
  if [[ "${tc:-0}" -ge 1 ]]; then
    pass "debug/mcp-tools tool_count=$tc"
  else
    ylw "  WARN  mcp-tools returned tool_count=$tc"
  fi
else
  ylw "  WARN  /debug/mcp-tools not available (backend old or MCP client down)"
fi

echo ""
echo "=============================================="
if [[ "$FAILS" -eq 0 ]]; then
  grn "Gate 0 / Track A platform: ALL REQUIRED CHECKS PASSED"
  echo "Demo questions for agent (after Track B ships /debug/agent-run):"
  echo "  1. Show high severity malware alerts (top 5)"
  echo "  2. What indices match pattern * ?"
  echo "  3. List failed authentication events"
  exit 0
else
  red "Gate 0 / Track A platform: $FAILS check(s) FAILED"
  echo "See docs/engineering/phase-1b-track-a.md"
  exit 1
fi
