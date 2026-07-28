"""
Context Builder — Phase 1B

Assembles the full prompt package for the Planner node:
  - System prompt (SOC analyst assistant role, rules, target index)
  - Available tool schemas from ToolRegistry
  - Conversation history from SessionManager
  - Current user question

Usage:
    builder = ContextBuilder(registry)
    context = builder.build(question, history)
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)


class ContextBuilder:
    """
    Builds the prompt context for the LangGraph Planner node.

    Stub — will be implemented in B4.
    """

    def __init__(self, tool_schemas: list[dict[str, Any]] | None = None):
        """
        Args:
            tool_schemas: Output of registry.tool_schemas() — list of tool
                          name/description/input_schema dicts.
        """
        self._tool_schemas = tool_schemas or []

    def build(
        self,
        question: str,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        """
        Assemble the full prompt context string.

        Args:
            question: The user's current natural-language question.
            history:  Previous messages in this session (optional).

        Returns:
            Formatted prompt string for the Planner.

        Raises:
            NotImplementedError: Stub — will be implemented in B4.
        """
        raise NotImplementedError("B4: Implement ContextBuilder.build()")
