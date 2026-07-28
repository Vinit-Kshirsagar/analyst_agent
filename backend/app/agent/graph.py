"""
Agent Graph — Phase 1B

Compiles the LangGraph StateGraph and exports the main entry point:
    run_agent(question, session_id, registry) → AgentState result

Graph topology:
    Planner → Router → Executor → Observer → (loop back to Router or → Finalizer)

MAX_TOOL_ITERATIONS enforced via conditional edge from Observer.
"""
import logging
from typing import Any

from app.agent.state import AgentState
from app.tools import ToolRegistry

logger = logging.getLogger(__name__)


async def run_agent(
    question: str,
    registry: ToolRegistry,
    session_id: str | None = None,
) -> dict[str, Any]:
    """
    Execute the full agent graph for a user question.

    Args:
        question:    Natural-language SOC analyst question.
        registry:    Initialised ToolRegistry with MCP tools.
        session_id:  Optional session ID for multi-turn context.

    Returns:
        Dict with keys: session_id, answer, plan, tools_used,
        iterations, error.

    Raises:
        NotImplementedError: Stub — will be implemented in B5.
    """
    raise NotImplementedError("B5: Implement run_agent with LangGraph StateGraph")
