"""
LLM Client — Phase 1B

Factory for ChatOllama backed by Gemma (gemma4:e4b) via OLLAMA_URL.
Works with both local Ollama (host.docker.internal) and remote
Cloudflare tunnel URLs.

Usage:
    model = get_chat_model()
    response = await model.ainvoke("Say hi in 5 words")
"""
import os
import logging

from langchain_ollama import ChatOllama

logger = logging.getLogger(__name__)

# Defaults match docker/.env.example and main.py
_DEFAULT_OLLAMA_URL = "http://host.docker.internal:11434"
_DEFAULT_MODEL_TAG = "gemma4:e4b"


def get_chat_model(
    *,
    temperature: float = 0.2,
    timeout: int = 120,
) -> ChatOllama:
    """
    Return a ChatOllama instance configured from environment variables.

    Reads:
        OLLAMA_URL       — Base URL for the Ollama API (no trailing slash).
                           Accepts local (host.docker.internal) or tunnel URLs.
        GEMMA_MODEL_TAG  — Ollama model tag (default: gemma4:e4b).

    Args:
        temperature: Sampling temperature. Low (0.2) for deterministic
                     SOC-analyst answers; raise for creative tasks.
        timeout:     Request timeout in seconds.  Tunnel latency can be
                     significant, so default is generous (120s).

    Returns:
        ChatOllama instance ready for ainvoke() / astream().
    """
    base_url = os.getenv("OLLAMA_URL", _DEFAULT_OLLAMA_URL).rstrip("/")
    model_tag = os.getenv("GEMMA_MODEL_TAG", _DEFAULT_MODEL_TAG)

    logger.info(
        "get_chat_model: base_url=%s  model=%s  temperature=%.1f  timeout=%ds",
        base_url,
        model_tag,
        temperature,
        timeout,
    )

    return ChatOllama(
        base_url=base_url,
        model=model_tag,
        temperature=temperature,
        timeout=timeout,
    )
