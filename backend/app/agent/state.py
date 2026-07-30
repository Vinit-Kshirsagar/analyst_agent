"""
AgentState — Phase 1B

Typed state object shared across all LangGraph nodes.
Every node reads from and writes to this state dict as it
flows through the graph: Planner → Router → Executor → Observer → Finalizer.

Hard limits:
    MAX_TOOL_ITERATIONS = 3  (prevent infinite tool loops)
"""
from typing import TypedDict

# Guard against infinite agent loops
MAX_TOOL_ITERATIONS = 3


class AgentState(TypedDict, total=False):
    """
    Shared state flowing through the LangGraph agent.

    Fields are populated incrementally by each node.
    """
    # --- Input (set before graph starts) ---
    session_id: str
    question: str
    messages: list            # chat history for this run / session

    # --- Planner ---
    plan: str                 # planner's raw LLM output

    # --- Router ---
    tool_name: str | None     # selected tool (or None if no tool needed)
    tool_args: dict | None    # arguments for the selected tool

    # --- Executor ---
    tool_result: str | None   # raw result from tool execution
    tools_used: list[str]     # accumulator of tools invoked this run

    # --- Observer ---
    observations: str         # observer's interpretation of tool results

    # --- Finalizer ---
    answer: str               # final user-facing text

    # --- Control ---
    error: str | None         # error message if something went wrong
    iteration: int            # current tool loop iteration counter
