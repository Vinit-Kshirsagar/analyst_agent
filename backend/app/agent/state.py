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

    Fields will be populated incrementally by each node.
    Stub — field details will be finalised in B5.
    """
    session_id: str
    question: str
    messages: list            # chat history for this run / session
    context: str              # assembled prompt package
    plan: str                 # planner output
    tool_name: str | None     # selected tool (or None if no tool needed)
    tool_args: dict | None    # arguments for the selected tool
    tool_result: str | None   # raw result from tool execution
    tools_used: list[str]     # accumulator of tools invoked this run
    observations: str         # observer's interpretation of tool results
    answer: str               # final user-facing text
    error: str | None         # error message if something went wrong
    iteration: int            # current tool loop iteration counter
