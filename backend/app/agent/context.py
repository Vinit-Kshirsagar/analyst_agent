"""
Context Builder — Phase 1B

Assembles the full prompt package for the Planner node:
  - System prompt (SOC analyst assistant role, rules, target index)
  - Available tool schemas from ToolRegistry
  - Conversation history from SessionManager
  - Current user question

The output is a list of LangChain message dicts ready for ChatOllama.

Usage:
    builder = ContextBuilder(registry.tool_schemas())
    messages = builder.build(question, history)
    response = await llm.ainvoke(messages)
"""
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt — injected as the first message to every Planner call
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT_TEMPLATE = """\
You are a Security Operations Center (SOC) analyst assistant.
You help analysts investigate security alerts stored in Elasticsearch.

## Data
- Primary index: `alerts-security`
- The index contains security alert documents with fields such as:
  severity, event.category, event.action, source.ip, destination.ip,
  rule.name, message, @timestamp, and more.

## Available tools
You have access to the following tools to query live data.
Always prefer using tools over guessing. Never fabricate data.

{tool_descriptions}

## Tool calling rules
- To call a tool, respond with EXACTLY this JSON format on its own line:
  TOOL_CALL: {{"tool": "<tool_name>", "arguments": {{<args>}}}}
- Use the EXACT argument names shown above (e.g. `index`, `query_body`, `index_pattern`).
- For `search`: always set `"index": "alerts-security"` and provide a valid
  Elasticsearch query DSL in `query_body`.
- You may request ONE tool call per response.
- If no tool is needed, answer the question directly without TOOL_CALL.

## Response guidelines
- Be concise and factual.
- Reference specific data fields (severity, IPs, rule names) in your answers.
- If results are empty, say so clearly rather than speculating.
- When presenting multiple results, use a numbered list or brief table.
"""


class ContextBuilder:
    """
    Builds the prompt context for the LangGraph Planner node.

    Converts tool schemas, conversation history, and the current question
    into a list of message dicts: [system, ...history, user].
    """

    def __init__(self, tool_schemas: list[dict[str, Any]] | None = None):
        """
        Args:
            tool_schemas: Output of registry.tool_schemas() — list of tool
                          name/description/input_schema dicts.
        """
        self._tool_schemas = tool_schemas or []
        self._system_prompt = self._build_system_prompt()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def build(
        self,
        question: str,
        history: list[dict[str, str]] | None = None,
    ) -> list[dict[str, str]]:
        """
        Assemble the full message list for ChatOllama.

        Args:
            question: The user's current natural-language question.
            history:  Previous messages in this session
                      [{"role": "user"|"assistant", "content": "..."}].

        Returns:
            List of message dicts: [system, ...history, user_question].
        """
        messages: list[dict[str, str]] = []

        # 1. System prompt (always first)
        messages.append({"role": "system", "content": self._system_prompt})

        # 2. Conversation history (if any — enables multi-turn)
        if history:
            # Keep last N exchanges to avoid blowing context window
            trimmed = self._trim_history(history, max_messages=10)
            messages.extend(trimmed)

        # 3. Current question
        messages.append({"role": "user", "content": question})

        logger.debug(
            "ContextBuilder: built %d messages (history=%d, tools=%d)",
            len(messages),
            len(history) if history else 0,
            len(self._tool_schemas),
        )
        return messages

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_system_prompt(self) -> str:
        """Render the system prompt with tool descriptions injected."""
        tool_block = self._format_tool_descriptions()
        return _SYSTEM_PROMPT_TEMPLATE.format(tool_descriptions=tool_block)

    def _format_tool_descriptions(self) -> str:
        """
        Format tool schemas into a readable block for the system prompt.

        Example output per tool:
            ### search
            Description: Perform an Elasticsearch search ...
            Required arguments: index (string), query_body (object)
            Optional arguments: fields (array)
        """
        if not self._tool_schemas:
            return "(No tools available)"

        lines: list[str] = []
        for schema in self._tool_schemas:
            name = schema.get("name", "unknown")
            desc = schema.get("description", "No description")
            input_schema = schema.get("input_schema", {})

            lines.append(f"### {name}")
            lines.append(f"Description: {desc}")

            # Parse required / optional arguments from JSON Schema
            properties = input_schema.get("properties", {})
            required = set(input_schema.get("required", []))

            if properties:
                req_args = []
                opt_args = []
                for arg_name, arg_info in properties.items():
                    arg_type = arg_info.get("type", "any")
                    arg_desc = arg_info.get("description", "")
                    entry = f"`{arg_name}` ({arg_type})"
                    if arg_desc:
                        entry += f" — {arg_desc}"
                    if arg_name in required:
                        req_args.append(entry)
                    else:
                        opt_args.append(entry)

                if req_args:
                    lines.append("Required arguments: " + "; ".join(req_args))
                if opt_args:
                    lines.append("Optional arguments: " + "; ".join(opt_args))
            lines.append("")  # blank line between tools

        return "\n".join(lines)

    @staticmethod
    def _trim_history(
        history: list[dict[str, str]],
        max_messages: int = 10,
    ) -> list[dict[str, str]]:
        """
        Keep only the last N messages to avoid exceeding the model's
        context window. Preserves message order.
        """
        if len(history) <= max_messages:
            return list(history)
        return list(history[-max_messages:])
