#!/usr/bin/env bash
# smoke-agent-run.sh — Phase 1.5 fixed demo questions against /debug/agent-run
#
# Usage (stack + Ollama up, seed present):
#   ./scripts/smoke-agent-run.sh
#
# Exit 0 only if every question returns HTTP 200, error null, and
# (when expect_tool=1) tools_used is non-empty.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
TIMEOUT="${AGENT_TIMEOUT:-300}"
FAILS=0

red() { printf '\033[31m%s\033[0m\n' "$*"; }
grn() { printf '\033[32m%s\033[0m\n' "$*"; }
ylw() { printf '\033[33m%s\033[0m\n' "$*"; }

run_one() {
  local label="$1"
  local question="$2"
  local expect_tool="$3" # 1 = require tools_used non-empty

  echo ""
  echo "==> [$label] $question"

  local body
  body="$(python3 -c 'import json,sys; print(json.dumps({"question": sys.argv[1]}))' "$question")"

  local resp
  if ! resp="$(curl -sS --max-time "$TIMEOUT" -X POST "$BACKEND_URL/debug/agent-run" \
      -H 'Content-Type: application/json' \
      -d "$body")"; then
    red "  FAIL  curl error"
    FAILS=$((FAILS + 1))
    return
  fi

  python3 - "$resp" "$expect_tool" "$label" <<'PY'
import json, sys
raw, expect_tool, label = sys.argv[1], sys.argv[2], sys.argv[3]
try:
    d = json.loads(raw)
except json.JSONDecodeError as e:
    print(f"  FAIL  invalid JSON: {e}")
    print(raw[:400])
    sys.exit(2)

err = d.get("error")
tools = d.get("tools_used") or []
answer = (d.get("answer") or "").strip()
print(f"  tools_used={tools}")
print(f"  error={err!r}")
print(f"  answer_preview={answer[:160]!r}")

if err:
    print("  FAIL  error is not null")
    sys.exit(1)
if not answer:
    print("  FAIL  empty answer")
    sys.exit(1)
if expect_tool == "1" and not tools:
    print("  FAIL  expected tools_used non-empty")
    sys.exit(1)
print("  PASS")
sys.exit(0)
PY
  local rc=$?
  if [[ $rc -ne 0 ]]; then
    FAILS=$((FAILS + 1))
  fi
}

echo "=============================================="
echo " Phase 1.5 — agent-run smoke"
echo " backend=$BACKEND_URL"
echo "=============================================="

# Health preflight
if ! curl -sf --max-time 5 "$BACKEND_URL/health" >/dev/null; then
  red "Backend not healthy at $BACKEND_URL/health"
  exit 1
fi

# 1) Explicit schema (should always tool-call search)
run_one "malware-fields" \
  "Search alerts-security for event.type malware, size 3, show source.ip and event.severity. Be brief." \
  1

# 2) Free-form high severity malware (needs field rewrite high→gte)
run_one "high-severity-malware" \
  "Show high severity malware alerts (top 3). Be brief." \
  1

# 3) match_all style
run_one "match-all" \
  "Use the search tool on index alerts-security with match_all size 3. Summarize briefly." \
  1

# 4) empty validation (not agent quality — just API)
echo ""
echo "==> [empty-question] validation"
code="$(curl -sS -o /tmp/agent_empty.json -w '%{http_code}' --max-time 15 \
  -X POST "$BACKEND_URL/debug/agent-run" \
  -H 'Content-Type: application/json' \
  -d '{"question":""}')"
if [[ "$code" == "400" ]]; then
  grn "  PASS  empty question → 400"
else
  red "  FAIL  empty question → HTTP $code (want 400)"
  FAILS=$((FAILS + 1))
fi

echo ""
echo "=============================================="
if [[ "$FAILS" -eq 0 ]]; then
  grn "Phase 1.5 smoke: ALL CHECKS PASSED"
  exit 0
else
  red "Phase 1.5 smoke: $FAILS check(s) FAILED"
  exit 1
fi
