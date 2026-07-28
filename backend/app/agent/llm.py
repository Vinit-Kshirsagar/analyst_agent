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

logger = logging.getLogger(__name__)


def get_chat_model():
    """
    Return a ChatOllama instance configured from environment variables.

    Env vars:
        OLLAMA_URL       — Base URL for the Ollama API (no trailing slash).
        GEMMA_MODEL_TAG  — Model tag to use (default: gemma4:e4b).

    Returns:
        ChatOllama instance ready for ainvoke().

    Raises:
        NotImplementedError: Stub — will be implemented in B2.
    """
    raise NotImplementedError("B2: Implement ChatOllama factory")
