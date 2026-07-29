"""
Agent Graph — Phase 1B

Compiles the LangGraph StateGraph and exports the main entry point:
    run_agent(question, registry, session_id) → result dict

Graph topology:
    START → planner → router → [conditional]
        tool_name is set  → executor → observer → [conditional]
            iteration < MAX  → router   (loop back)
            iteration >= MAX → finalizer
        tool_name is None → finalizer
    finalizer → END
"""
import logging
import time
from typing import Any

from langgraph.graph import StateGraph, END

from app.agent.state import AgentState
from app.agent.llm import get_chat_model
from app.agent.context import ContextBuilder
from app.agent.nodes import (
    make_planner,
    make_router,
    make_executor,
    make_observer,
    make_finalizer,
)
from app.tools import ToolRegistry
from app.session import SessionManager

logger = logging.getLogger(__name__)

# Module-level session manager (lives for the process lifetime)
_session_manager = SessionManager()


def _build_graph(registry: ToolRegistry) -> StateGraph:
    """
    Build and compile the agent StateGraph with all dependencies wired.

    Returns a compiled LangGraph ready for ainvoke().
    """
    llm = get_chat_model()
    context_builder = ContextBuilder(registry.tool_schemas())

    # Create node functions with dependencies bound
    planner_node = make_planner(llm, context_builder)
    router_node = make_router(registry)
    executor_node = make_executor(registry)
    observer_node = make_observer(llm)
    finalizer_node = make_finalizer()

    # Define the graph
    graph = StateGraph(AgentState)

    graph.add_node("planner", planner_node)
    graph.add_node("router", router_node)
    graph.add_node("executor", executor_node)
    graph.add_node("observer", observer_node)
    graph.add_node("finalizer", finalizer_node)

    # Edges
    graph.set_entry_point("planner")
    graph.add_edge("planner", "router")

    # Router → Executor (if tool selected) or Finalizer (no tool)
    graph.add_conditional_edges(
        "router",
        _route_after_router,
        {"executor": "executor", "finalizer": "finalizer"},
    )

    graph.add_edge("executor", "observer")

    # Observer → Router (loop) or Finalizer (done)
    graph.add_conditional_edges(
        "observer",
        _route_after_observer,
        {"router": "router", "finalizer": "finalizer"},
    )

    graph.add_edge("finalizer", END)

    return graph.compile()


# =====================================================================
# Routing functions (used by conditional edges)
# =====================================================================

def _route_after_router(state: AgentState) -> str:
    """After Router: go to Executor if tool selected, else Finalizer."""
    if state.get("tool_name"):
        return "executor"
    return "finalizer"


def _route_after_observer(state: AgentState) -> str:
    """
    After Observer: loop back to Router if more iterations allowed,
    otherwise go to Finalizer.
    """
    from app.agent.state import MAX_TOOL_ITERATIONS

    iteration = state.get("iteration", 0)
    if iteration >= MAX_TOOL_ITERATIONS:
        logger.info("Graph: max iterations (%d) reached → finalizer", MAX_TOOL_ITERATIONS)
        return "finalizer"

    # For MVP: go to finalizer after first successful tool call.
    # Multi-step tool chaining can be enabled later by returning "router" here.
    return "finalizer"


# =====================================================================
# Public entry point
# =====================================================================

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
    """
    start = time.time()

    # Session management
    session = _session_manager.get_or_create(session_id)
    sid = session["id"]
    history = _session_manager.get_history(sid)

    # Record the user's question
    _session_manager.append_user(sid, question)

    # Build initial state
    initial_state: AgentState = {
        "session_id": sid,
        "question": question,
        "messages": history,
        "plan": "",
        "tool_name": None,
        "tool_args": None,
        "tool_result": None,
        "tools_used": [],
        "observations": "",
        "answer": "",
        "error": None,
        "iteration": 0,
    }

    logger.info("run_agent: session=%s question=%r", sid[:8], question[:80])

    try:
        compiled = _build_graph(registry)
        final_state = await compiled.ainvoke(initial_state)
    except Exception as exc:
        logger.exception("run_agent: graph execution failed: %s", exc)
        final_state = {
            **initial_state,
            "answer": f"Agent error: {exc}",
            "error": str(exc),
        }

    # Record the assistant's answer in session history
    answer = final_state.get("answer", "")
    _session_manager.append_assistant(sid, answer)

    elapsed = time.time() - start
    logger.info(
        "run_agent: done in %.1fs  tools_used=%s  answer_len=%d",
        elapsed,
        final_state.get("tools_used", []),
        len(answer),
    )

    return {
        "session_id": sid,
        "answer": answer,
        "plan": final_state.get("plan", ""),
        "tools_used": final_state.get("tools_used", []),
        "iterations": final_state.get("iteration", 0),
        "error": final_state.get("error"),
    }
