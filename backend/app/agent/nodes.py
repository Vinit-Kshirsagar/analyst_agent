"""
Graph Nodes — Phase 1B

Node factory functions for the LangGraph agent.  Each factory accepts
dependencies (LLM, registry) and returns an async node function that
takes AgentState and returns a partial state update dict.

Node pipeline:
    Planner → Router → Executor → Observer → (loop or Finalizer)

Usage (in graph.py):
    planner_node = make_planner(llm, context_builder)
    graph.add_node("planner", planner_node)
"""
import json
import logging
import re
from typing import Any, Callable, Awaitable

from langchain_ollama import ChatOllama

from app.agent.state import AgentState, MAX_TOOL_ITERATIONS
from app.agent.context import ContextBuilder
from app.tools import ToolRegistry

logger = logging.getLogger(__name__)

# Max chars of tool output to send to the Observer (avoid blowing context)
_MAX_TOOL_RESULT_CHARS = 6000


# =====================================================================
# 1. PLANNER  (LLM — Gemma)
# =====================================================================

def make_planner(
    llm: ChatOllama,
    context_builder: ContextBuilder,
) -> Callable[[AgentState], Awaitable[dict]]:
    """
    Factory: returns a Planner node function.

    The Planner sends the question + context + history to Gemma and
    receives a plan that may include a TOOL_CALL directive.
    """

    async def planner(state: AgentState) -> dict:
        question = state.get("question", "")
        history = state.get("messages", [])

        logger.info("Planner: question=%r (history=%d msgs)", question[:80], len(history))

        messages = context_builder.build(question, history)

        try:
            response = await llm.ainvoke(messages)
            plan_text = response.content if hasattr(response, "content") else str(response)
        except Exception as exc:
            logger.error("Planner LLM call failed: %s", exc)
            return {"plan": "", "error": f"Planner LLM error: {exc}"}

        # Guard against empty / None responses
        if not plan_text or not plan_text.strip():
            logger.warning("Planner: LLM returned empty response")
            return {
                "plan": "",
                "error": "Planner received empty response from LLM. "
                         "The model may be overloaded — please retry.",
            }

        logger.info("Planner: output length=%d chars", len(plan_text))
        logger.debug("Planner: raw output:\n%s", plan_text[:500])

        return {"plan": plan_text, "error": None}

    return planner


# =====================================================================
# 2. ROUTER  (Rules — parse TOOL_CALL from planner output)
# =====================================================================

# Regex to find TOOL_CALL: {"tool": "...", "arguments": {...}}
_TOOL_CALL_RE = re.compile(
    r'TOOL_CALL:\s*(\{.*\})',
    re.DOTALL,
)


def make_router(
    registry: ToolRegistry,
) -> Callable[[AgentState], Awaitable[dict]]:
    """
    Factory: returns a Router node function.

    The Router parses the planner's output for a TOOL_CALL directive.
    If found, validates the tool name against the registry.
    If not found, sets tool_name=None so the graph skips to Finalizer.
    """

    async def router(state: AgentState) -> dict:
        plan = state.get("plan", "")
        iteration = state.get("iteration", 0)

        # Check iteration cap
        if iteration >= MAX_TOOL_ITERATIONS:
            logger.warning("Router: hit MAX_TOOL_ITERATIONS (%d), skipping tools", MAX_TOOL_ITERATIONS)
            return {"tool_name": None, "tool_args": None}

        # Try to extract TOOL_CALL
        match = _TOOL_CALL_RE.search(plan)
        if not match:
            logger.info("Router: no TOOL_CALL found — direct answer path")
            return {"tool_name": None, "tool_args": None}

        # Parse the JSON
        raw_json = match.group(1)
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            logger.warning("Router: invalid TOOL_CALL JSON: %s", exc)
            return {
                "tool_name": None,
                "tool_args": None,
                "error": f"Could not parse tool call JSON: {exc}",
            }

        tool_name = parsed.get("tool", "")
        tool_args = parsed.get("arguments", {})

        # Validate tool name
        available = registry.list_names()
        if tool_name not in available:
            logger.warning(
                "Router: unknown tool '%s' (available: %s)", tool_name, available
            )
            return {
                "tool_name": None,
                "tool_args": None,
                "error": f"Unknown tool '{tool_name}'. Available: {available}",
            }

        logger.info("Router: tool=%s  args=%s", tool_name, str(tool_args)[:200])
        return {"tool_name": tool_name, "tool_args": tool_args}

    return router


# =====================================================================
# 3. EXECUTOR  (Code only — no LLM)
# =====================================================================

def make_executor(
    registry: ToolRegistry,
) -> Callable[[AgentState], Awaitable[dict]]:
    """
    Factory: returns an Executor node function.

    The Executor invokes the selected tool via ToolRegistry.execute()
    and appends the tool name to tools_used.
    """

    async def executor(state: AgentState) -> dict:
        tool_name = state.get("tool_name")
        tool_args = state.get("tool_args", {})
        tools_used = list(state.get("tools_used", []))
        iteration = state.get("iteration", 0)

        if not tool_name:
            logger.warning("Executor: no tool_name set — skipping")
            return {"tool_result": None}

        logger.info("Executor: calling '%s' (iteration %d)", tool_name, iteration + 1)

        try:
            result = await registry.execute(tool_name, tool_args)
            # Stringify result (may be LangChain content blocks)
            result_str = _stringify_tool_result(result)
            # Truncate to protect Observer's context window
            if len(result_str) > _MAX_TOOL_RESULT_CHARS:
                result_str = result_str[:_MAX_TOOL_RESULT_CHARS] + "\n... [truncated]"
        except Exception as exc:
            logger.error("Executor: tool '%s' failed: %s", tool_name, exc)
            result_str = f"Tool execution error: {exc}"

        tools_used.append(tool_name)

        return {
            "tool_result": result_str,
            "tools_used": tools_used,
            "iteration": iteration + 1,
        }

    return executor


# =====================================================================
# 4. OBSERVER  (LLM — Gemma)
# =====================================================================

_OBSERVER_PROMPT = """\
You are a security analyst reviewing tool output.

The analyst asked: {question}

The plan was: {plan}

The tool `{tool_name}` returned:
```
{tool_result}
```

Summarize the findings concisely for the analyst. Focus on:
- Key data points (severity levels, IPs, rule names, event types)
- How many results matched
- Any notable patterns or concerns

If the results are empty or indicate no data, say so clearly.
Do NOT make up data that is not in the tool output above.
"""


def make_observer(
    llm: ChatOllama,
) -> Callable[[AgentState], Awaitable[dict]]:
    """
    Factory: returns an Observer node function.

    The Observer asks Gemma to interpret tool results into
    analyst-friendly observations.
    """

    async def observer(state: AgentState) -> dict:
        question = state.get("question", "")
        plan = state.get("plan", "")
        tool_name = state.get("tool_name", "unknown")
        tool_result = state.get("tool_result", "")

        logger.info("Observer: interpreting results from '%s'", tool_name)

        prompt = _OBSERVER_PROMPT.format(
            question=question,
            plan=plan[:500],
            tool_name=tool_name,
            tool_result=tool_result[:_MAX_TOOL_RESULT_CHARS],
        )

        try:
            response = await llm.ainvoke([
                {"role": "system", "content": "You are a concise security data analyst."},
                {"role": "user", "content": prompt},
            ])
            observations = response.content if hasattr(response, "content") else str(response)
        except Exception as exc:
            logger.error("Observer LLM call failed: %s", exc)
            observations = f"Observer error: {exc}. Raw tool result available."

        logger.info("Observer: observations length=%d chars", len(observations))
        return {"observations": observations}

    return observer


# =====================================================================
# 5. FINALIZER  (Template — no LLM by default)
# =====================================================================

def make_finalizer() -> Callable[[AgentState], Awaitable[dict]]:
    """
    Factory: returns a Finalizer node function.

    The Finalizer assembles the final answer from observations
    (tool path) or the plan itself (direct answer path).
    """

    async def finalizer(state: AgentState) -> dict:
        error = state.get("error")
        observations = state.get("observations", "")
        plan = state.get("plan", "")
        tools_used = state.get("tools_used", [])

        # If there was an error and no observations, report the error
        if error and not observations:
            answer = f"I encountered an issue: {error}"
        elif observations:
            # Tool path — observations are the primary answer
            answer = observations
        elif plan:
            # Direct answer path — strip any TOOL_CALL artifacts from plan
            answer = _TOOL_CALL_RE.sub("", plan).strip()
            if not answer:
                answer = plan
        else:
            answer = "I was unable to generate an answer. Please try rephrasing your question."

        logger.info(
            "Finalizer: answer length=%d chars, tools_used=%s",
            len(answer),
            tools_used,
        )

        return {"answer": answer}

    return finalizer


# =====================================================================
# Helpers
# =====================================================================

def _stringify_tool_result(result: Any) -> str:
    """
    Convert a tool result to a string.
    Handles LangChain content blocks (list of text parts), dicts, etc.
    """
    if isinstance(result, str):
        return result
    if isinstance(result, list):
        parts = []
        for item in result:
            if isinstance(item, dict):
                parts.append(item.get("text", str(item)))
            elif hasattr(item, "text"):
                parts.append(item.text)
            else:
                parts.append(str(item))
        return "\n".join(parts)
    if isinstance(result, dict):
        return json.dumps(result, indent=2, default=str)
    return str(result)
