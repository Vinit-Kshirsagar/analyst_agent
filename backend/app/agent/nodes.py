"""
Graph Nodes — Phase 1B

Individual node functions for the LangGraph agent:
  - planner   : (LLM) Turn question + context into a plan / next action
  - router    : (Rules) Choose tool_name + tool_args or "none"
  - executor  : (Code) Invoke ToolRegistry.execute(); append to tools_used
  - observer  : (LLM) Interpret tool results into analyst-facing notes
  - finalizer : Produce final answer; clear transient state

Each node takes AgentState and returns a partial AgentState update dict.
"""
import logging

from app.agent.state import AgentState

logger = logging.getLogger(__name__)


async def planner(state: AgentState) -> dict:
    """
    Use Gemma to generate a plan / next action from the question + context.

    Raises:
        NotImplementedError: Stub — will be implemented in B5.
    """
    raise NotImplementedError("B5: Implement planner node")


async def router(state: AgentState) -> dict:
    """
    Parse the planner output to extract tool_name + tool_args,
    or decide no tool is needed.

    Validates tool_name against registry.list_names().

    Raises:
        NotImplementedError: Stub — will be implemented in B5.
    """
    raise NotImplementedError("B5: Implement router node")


async def executor(state: AgentState) -> dict:
    """
    Execute the selected tool via ToolRegistry.execute().
    Appends tool_name to tools_used. No LLM call.

    Raises:
        NotImplementedError: Stub — will be implemented in B5/B6.
    """
    raise NotImplementedError("B5: Implement executor node")


async def observer(state: AgentState) -> dict:
    """
    Use Gemma to interpret tool results into analyst-friendly observations.

    Raises:
        NotImplementedError: Stub — will be implemented in B5.
    """
    raise NotImplementedError("B5: Implement observer node")


async def finalizer(state: AgentState) -> dict:
    """
    Produce the final answer string and clear transient error state.

    Raises:
        NotImplementedError: Stub — will be implemented in B5.
    """
    raise NotImplementedError("B5: Implement finalizer node")
