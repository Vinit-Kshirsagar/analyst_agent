"""
Agent package — Phase 1B

LangGraph-based agent core:
  - llm.py      : ChatOllama factory (Gemma via Ollama)
  - state.py    : AgentState TypedDict flowing through the graph
  - context.py  : ContextBuilder (system prompt + tools + history)
  - nodes.py    : Planner, Router, Executor, Observer, Finalizer
  - graph.py    : StateGraph compilation + run_agent() entry point
"""
from app.agent.llm import get_chat_model
from app.agent.state import AgentState
from app.agent.context import ContextBuilder
from app.agent.graph import run_agent

__all__ = [
    "get_chat_model",
    "AgentState",
    "ContextBuilder",
    "run_agent",
]
