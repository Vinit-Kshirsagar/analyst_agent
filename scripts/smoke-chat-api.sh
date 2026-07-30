#!/usr/bin/env bash
# smoke-chat-api.sh — Phase 2 product chat API checks
#
# Usage (stack + Ollama up, seed present):
#   ./scripts/smoke-chat-api.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
TIMEOUT="${AGENT_TIMEOUT:-300}"
FAILS=0

red() { printf '\033[31m%s\033[0m\n' "$*"; }
grn() { printf '\033[32m%s\033[0m\n' "$*"; }

echo "=============================================="
echo " Phase 2 — /api/chat smoke"
echo " backend=$BACKEND_URL"
echo "=============================================="

if ! curl -sf --max-time 5 "$BACKEND_URL/health" >/dev/null; then
  red "Backend not healthy"
  exit 1
fi

# 1) empty message → 400
echo ""
echo "==> empty message"
code="$(curl -sS -o /tmp/chat_empty.json -w '%{http_code}' --max-time 15 \
  -X POST "$BACKEND_URL/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"message":""}')"
if [[ "$code" == "400" || "$code" == "422" ]]; then
  grn "  PASS  empty → HTTP $code"
else
  red "  FAIL  empty → HTTP $code"
  FAILS=$((FAILS + 1))
fi

# 2) real chat
echo ""
echo "==> POST /api/chat (malware search)"
Q='Search alerts-security for event.type malware, size 3, show source.ip and event.severity. Be brief.'
body="$(python3 -c 'import json,sys; print(json.dumps({"message": sys.argv[1]}))' "$Q")"
if ! resp="$(curl -sS --max-time "$TIMEOUT" -X POST "$BACKEND_URL/api/chat" \
    -H 'Content-Type: application/json' -d "$body")"; then
  red "  FAIL  curl error"
  FAILS=$((FAILS + 1))
else
  python3 - "$resp" <<'PY' || FAILS=$((FAILS + 1))
import json, sys
d = json.loads(sys.argv[1])
print("  session_id=", d.get("session_id"))
print("  tools_used=", d.get("tools_used"))
print("  error=", d.get("error"))
print("  answer_preview=", (d.get("answer") or "")[:140])
ok = d.get("session_id") and (d.get("answer") or "").strip() and d.get("error") is None
# Prefer tool use on this question
if not d.get("tools_used"):
    print("  WARN  tools_used empty (answer may still be ok)")
if ok:
    print("  PASS")
    sys.exit(0)
print("  FAIL")
sys.exit(1)
PY
fi

# 3) stream has SSE events
echo ""
echo "==> POST /api/chat/stream"
if ! stream="$(curl -sS --max-time "$TIMEOUT" -N -X POST "$BACKEND_URL/api/chat/stream" \
    -H 'Content-Type: application/json' -d "$body")"; then
  red "  FAIL  stream curl error"
  FAILS=$((FAILS + 1))
else
  if echo "$stream" | grep -q 'event: status' \
    && echo "$stream" | grep -q 'event: result' \
    && echo "$stream" | grep -q 'event: done'; then
    grn "  PASS  SSE events status/result/done present"
  else
    red "  FAIL  missing expected SSE events"
    echo "$stream" | head -40
    FAILS=$((FAILS + 1))
  fi
fi

echo ""
echo "=============================================="
if [[ "$FAILS" -eq 0 ]]; then
  grn "Phase 2 chat API smoke: ALL CHECKS PASSED"
  exit 0
fi
red "Phase 2 chat API smoke: $FAILS check(s) FAILED"
exit 1
