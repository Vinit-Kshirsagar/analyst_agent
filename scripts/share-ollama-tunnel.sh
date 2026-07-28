#!/usr/bin/env bash
# share-ollama-tunnel.sh — expose local Ollama via Cloudflare quick tunnel (host machine only).
#
# PURPOSE
#   Run this on the machine that HAS gemma4:e4b (e.g. stronger Mac).
#   A teammate on M1 (or any low-RAM laptop) points OLLAMA_URL at the tunnel URL.
#
# REQUIREMENTS
#   - ollama running locally with gemma4:e4b
#   - cloudflared:  brew install cloudflared
#
# USAGE
#   ./scripts/share-ollama-tunnel.sh
#   ./scripts/share-ollama-tunnel.sh --port 11434
#
# SECURITY (read this)
#   Ollama has NO built-in auth. A public trycloudflare URL means anyone who
#   finds the URL can burn your CPU/GPU and send prompts to your model.
#
#   Prefer for a private teaom:
#     1) Tailscale / WireGuard (best) — no public internet exposure
#     2) Named Cloudflare Tunnel + Cloudflare Access (email SSO / one-time PIN)
#     3) Quick tunnel ONLY for short pair sessions; rotate URL often; stop when done
#
#   Do NOT commit tunnel URLs to git. Share out-of-band (Slack/DM).

set -euo pipefail

PORT="${PORT:-11434}"
MODEL_TAG="${GEMMA_MODEL_TAG:-gemma4:e4b}"

for arg in "$@"; do
  case "$arg" in
    --port)
      shift
      PORT="${1:-11434}"
      ;;
    --port=*)
      PORT="${arg#*=}"
      ;;
    -h|--help)
      sed -n '2,28p' "$0"
      exit 0
      ;;
  esac
done

red() { printf '\033[31m%s\033[0m\n' "$*"; }
grn() { printf '\033[32m%s\033[0m\n' "$*"; }
ylw() { printf '\033[33m%s\033[0m\n' "$*"; }

if ! command -v ollama >/dev/null 2>&1; then
  red "ollama CLI not found. Install from https://ollama.com/download"
  exit 1
fi

if ! curl -sf --connect-timeout 3 "http://127.0.0.1:${PORT}/api/tags" >/dev/null; then
  red "Ollama is not reachable on localhost:${PORT}"
  echo "Start it: ollama serve   # or open the Ollama app"
  exit 1
fi

if ! ollama list 2>/dev/null | awk '{print $1}' | grep -qx "$MODEL_TAG"; then
  # ollama list header line may interfere; also try API
  if ! curl -sf "http://127.0.0.1:${PORT}/api/tags" | grep -q "$MODEL_TAG"; then
    ylw "Warning: model $MODEL_TAG not listed. Pull with: ollama pull $MODEL_TAG"
  fi
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  red "cloudflared not found."
  echo "Install:  brew install cloudflared"
  echo "Docs:     https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi

ylw "================================================================"
ylw " SECURITY: quick tunnel exposes Ollama WITHOUT authentication."
ylw " Share the URL only with your teammate. Stop this process when done."
ylw " Prefer Tailscale for ongoing team use."
ylw "================================================================"
echo ""
echo "Starting Cloudflare quick tunnel → http://127.0.0.1:${PORT}"
echo "When the https://….trycloudflare.com URL appears, send it to your teammate."
echo ""
echo "Teammate (M1 / remote) then sets in docker/.env:"
echo "  OLLAMA_URL=https://XXXX.trycloudflare.com"
echo "and runs:"
echo "  ./scripts/dev-up.sh"
echo ""
echo "Press Ctrl+C to stop sharing."
echo ""

exec cloudflared tunnel --url "http://127.0.0.1:${PORT}"
