#!/usr/bin/env bash
# seed-alerts.sh — generate 200 demo security alerts and load into Elasticsearch.
#
# Pipeline (one dataset, not two):
#   generate_logs.py  →  sample_logs.json (TEMP on disk, gitignored)
#                     →  Elasticsearch index alerts-security (REAL store)
#
# sample_logs.json is NOT source-of-truth and is NOT committed. It is only a
# temporary file between generate and import. Safe to delete anytime; this
# script recreates it. What the agent searches is ES, not the JSON file.
#
# Persistence: docs live in Docker volume elasticsearch-data after import.
#
# Usage (from repo root):
#   ./scripts/seed-alerts.sh
#   ELASTICSEARCH_URL=http://localhost:9200 ./scripts/seed-alerts.sh
#   ./scripts/seed-alerts.sh --force   # re-index all docs (overwrite by id)
#
# Prerequisites:
#   - Elasticsearch reachable (compose service up on :9200)
#   - docker compose stack with backend (for import), OR host `elasticsearch` pip package

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.yml}"
ENV_FILE="${ENV_FILE:-docker/.env}"
ES_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
FORCE=0
COUNT=200

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 2
      ;;
  esac
done

red() { printf '\033[31m%s\033[0m\n' "$*"; }
grn() { printf '\033[32m%s\033[0m\n' "$*"; }
ylw() { printf '\033[33m%s\033[0m\n' "$*"; }

if [[ ! -f "$ENV_FILE" && -f docker/.env.example ]]; then
  ylw "No $ENV_FILE — using defaults (copy docker/.env.example if needed)"
fi

echo "==> Waiting for Elasticsearch at $ES_URL ..."
ok=0
for i in $(seq 1 30); do
  if curl -sf --max-time 2 "$ES_URL/_cluster/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 1
done
if [[ "$ok" -ne 1 ]]; then
  red "ERROR: Elasticsearch not reachable at $ES_URL"
  echo "Start the stack first:"
  echo "  docker compose -f $COMPOSE_FILE --env-file ${ENV_FILE:-docker/.env.example} up -d elasticsearch"
  exit 1
fi
grn "Elasticsearch is up"

SAMPLE_JSON="$ROOT_DIR/backend/data/sample_logs.json"
echo "==> Generating $COUNT alerts → $SAMPLE_JSON"
python3 "$ROOT_DIR/backend/data/generate_logs.py"
if [[ ! -f "$SAMPLE_JSON" ]]; then
  red "ERROR: generate_logs.py did not create $SAMPLE_JSON"
  exit 1
fi

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

import_via_backend() {
  local cid
  cid="$(compose ps -q backend 2>/dev/null || true)"
  if [[ -z "$cid" ]]; then
    return 1
  fi
  # backend must be running
  if ! docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null | grep -q true; then
    return 1
  fi

  echo "==> Importing via backend container (elasticsearch client)"
  docker cp "$SAMPLE_JSON" "$cid":/tmp/sample_logs.json

  docker exec -e SEED_FORCE="${SEED_FORCE:-0}" -i "$cid" python - <<'PY'
import json
import os
import sys

from elasticsearch import Elasticsearch, NotFoundError

es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://elasticsearch:9200"))
index = "alerts-security"
force = os.environ.get("SEED_FORCE", "0") == "1"

if not es.indices.exists(index=index):
    es.indices.create(
        index=index,
        mappings={
            "properties": {
                "@timestamp": {"type": "date"},
                "source": {
                    "properties": {
                        "ip": {"type": "ip"},
                        "port": {"type": "integer"},
                    }
                },
                "destination": {
                    "properties": {
                        "ip": {"type": "ip"},
                        "port": {"type": "integer"},
                    }
                },
                "event": {
                    "properties": {
                        "type": {"type": "keyword"},
                        "outcome": {"type": "keyword"},
                        "severity": {"type": "integer"},
                    }
                },
                "rule": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "description": {"type": "text"},
                    }
                },
                "user": {"properties": {"name": {"type": "keyword"}}},
                "message": {"type": "text"},
            }
        },
    )
    print("created index", index)

with open("/tmp/sample_logs.json") as f:
    docs = json.load(f)

created = updated = skipped = 0
for doc in docs:
    _id = doc["_id"]
    body = doc["_source"]
    if force:
        es.index(index=index, id=_id, document=body)
        updated += 1
        continue
    try:
        es.get(index=index, id=_id)
        skipped += 1
    except NotFoundError:
        es.index(index=index, id=_id, document=body)
        created += 1

es.indices.refresh(index=index)
total = es.count(index=index)["count"]
print(
    f"Import complete: {created} new, {updated} forced, {skipped} skipped. "
    f"Total in index: {total}"
)
if total < 1:
    sys.exit(1)
PY
}

import_via_host_python() {
  echo "==> Importing via host Python (elasticsearch package)"
  SEED_FORCE="$FORCE" ELASTICSEARCH_URL="$ES_URL" python3 - <<PY
import json
import os
import sys
from pathlib import Path

try:
    from elasticsearch import Elasticsearch, NotFoundError
except ImportError:
    print("ERROR: pip install elasticsearch==8.11.0", file=sys.stderr)
    sys.exit(2)

es = Elasticsearch(os.environ["ELASTICSEARCH_URL"])
index = "alerts-security"
force = os.environ.get("SEED_FORCE", "0") == "1"
path = Path("backend/data/sample_logs.json")

if not es.indices.exists(index=index):
    es.indices.create(
        index=index,
        mappings={
            "properties": {
                "@timestamp": {"type": "date"},
                "source": {"properties": {"ip": {"type": "ip"}, "port": {"type": "integer"}}},
                "destination": {"properties": {"ip": {"type": "ip"}, "port": {"type": "integer"}}},
                "event": {
                    "properties": {
                        "type": {"type": "keyword"},
                        "outcome": {"type": "keyword"},
                        "severity": {"type": "integer"},
                    }
                },
                "rule": {
                    "properties": {
                        "name": {"type": "keyword"},
                        "description": {"type": "text"},
                    }
                },
                "user": {"properties": {"name": {"type": "keyword"}}},
                "message": {"type": "text"},
            }
        },
    )
    print("created index", index)

docs = json.loads(path.read_text())
created = updated = skipped = 0
for doc in docs:
    _id, body = doc["_id"], doc["_source"]
    if force:
        es.index(index=index, id=_id, document=body)
        updated += 1
        continue
    try:
        es.get(index=index, id=_id)
        skipped += 1
    except NotFoundError:
        es.index(index=index, id=_id, document=body)
        created += 1

es.indices.refresh(index=index)
total = es.count(index=index)["count"]
print(f"Import complete: {created} new, {updated} forced, {skipped} skipped. Total: {total}")
sys.exit(0 if total >= 1 else 1)
PY
}

export SEED_FORCE="$FORCE"
if import_via_backend; then
  :
elif import_via_host_python; then
  :
else
  red "ERROR: could not import (backend not running and host elasticsearch package missing)"
  echo "Fix one of:"
  echo "  docker compose -f $COMPOSE_FILE --env-file docker/.env up -d backend"
  echo "  pip install 'elasticsearch==8.11.0'"
  exit 1
fi

echo "==> Verifying document count"
TOTAL="$(curl -sf "$ES_URL/alerts-security/_count" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("count",0))')"
echo "alerts-security count = $TOTAL"
if [[ "$TOTAL" -lt 1 ]]; then
  red "ERROR: index empty after seed"
  exit 1
fi
grn "Seed OK — $TOTAL documents in alerts-security"
echo ""
echo "Quick MCP check (if backend is up):"
echo "  curl -s -X POST 'http://localhost:8000/debug/mcp-call?tool_name=search' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"index\":\"alerts-security\",\"query_body\":{\"query\":{\"match_all\":{}},\"size\":2}}'"
