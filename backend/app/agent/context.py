"""
Context Builder — Phase 1B / 1.5

Assembles the full prompt package for the Planner node:
  - System prompt (SOC role, REAL seed field schema, tool rules)
  - Available tool schemas from ToolRegistry
  - Conversation history from SessionManager
  - Current user question
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT_TEMPLATE = """\
You are a Security Operations Center (SOC) analyst assistant.
You help analysts investigate security alerts stored in Elasticsearch.

## Data — use ONLY these fields (seed index schema)
- Primary index: `alerts-security` (always use this index name for search)
- Documents look like:
  - `@timestamp` (date)
  - `source.ip`, `source.port`
  - `destination.ip`, `destination.port`
  - `event.type`: either `"malware"` or `"authentication"` (keyword)
  - `event.outcome`: either `"success"` or `"failure"` (keyword)
  - `event.severity`: INTEGER from about 1–8 (NOT the strings "high"/"low")
  - `rule.name`, `rule.description`
  - `user.name`
  - `message`

### Query examples (copy patterns)
- Malware alerts:
  {{"query": {{"term": {{"event.type": "malware"}}}}, "size": 5}}
- High severity (numeric):
  {{"query": {{"range": {{"event.severity": {{"gte": 6}}}}}}, "size": 5}}
- High severity malware:
  {{"query": {{"bool": {{"must": [
    {{"term": {{"event.type": "malware"}}}},
    {{"range": {{"event.severity": {{"gte": 6}}}}}}
  ]}}}}, "size": 5}}
- Failed auth:
  {{"query": {{"bool": {{"must": [
    {{"term": {{"event.type": "authentication"}}}},
    {{"term": {{"event.outcome": "failure"}}}}
  ]}}}}, "size": 5}}

NEVER use fields like `event.category`, `severity: "high"`, or made-up fields.

## Available tools
Always prefer tools over guessing. Never fabricate alert data.

{tool_descriptions}

## Tool calling rules
- To call a tool, respond with EXACTLY one line in this form (valid JSON, double quotes only):
  TOOL_CALL: {{"tool": "<tool_name>", "arguments": {{...}}}}
- No trailing commas. No single quotes. No comments inside JSON.
- Use EXACT argument names: `index`, `query_body`, `index_pattern`, `query`, `fields`.
- For `search`:
  - `"index": "alerts-security"`
  - put `query` and `size` **inside** `query_body`, not next to `tool`
  - Example:
    TOOL_CALL: {{"tool": "search", "arguments": {{"index": "alerts-security", "query_body": {{"query": {{"term": {{"event.type": "malware"}}}}, "size": 3}}}}}}
- One TOOL_CALL per response only.
- If no tool is needed, answer directly without TOOL_CALL.

## Response guidelines
- Be concise and factual.
- Cite severity (as numbers), IPs, rule names from tool output.
- If results are empty, say so clearly.
"""


class ContextBuilder:
    """Builds the prompt context for the LangGraph Planner node."""

    def __init__(self, tool_schemas: list[dict[str, Any]] | None = None):
        self._tool_schemas = tool_schemas or []
        self._system_prompt = self._build_system_prompt()

    def build(
        self,
        question: str,
        history: list[dict[str, str]] | None = None,
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = [
            {"role": "system", "content": self._system_prompt},
        ]
        if history:
            messages.extend(self._trim_history(history, max_messages=10))
        messages.append({"role": "user", "content": question})
        logger.debug(
            "ContextBuilder: built %d messages (history=%d, tools=%d)",
            len(messages),
            len(history) if history else 0,
            len(self._tool_schemas),
        )
        return messages

    def _build_system_prompt(self) -> str:
        return _SYSTEM_PROMPT_TEMPLATE.format(
            tool_descriptions=self._format_tool_descriptions()
        )

    def _format_tool_descriptions(self) -> str:
        if not self._tool_schemas:
            return "(No tools available)"

        lines: list[str] = []
        for schema in self._tool_schemas:
            name = schema.get("name", "unknown")
            desc = schema.get("description", "No description")
            input_schema = schema.get("input_schema", {})
            lines.append(f"### {name}")
            lines.append(f"Description: {desc}")
            properties = input_schema.get("properties", {})
            required = set(input_schema.get("required", []))
            if properties:
                req_args, opt_args = [], []
                for arg_name, arg_info in properties.items():
                    arg_type = arg_info.get("type", "any")
                    arg_desc = arg_info.get("description", "")
                    entry = f"`{arg_name}` ({arg_type})"
                    if arg_desc:
                        entry += f" — {arg_desc}"
                    (req_args if arg_name in required else opt_args).append(entry)
                if req_args:
                    lines.append("Required arguments: " + "; ".join(req_args))
                if opt_args:
                    lines.append("Optional arguments: " + "; ".join(opt_args))
            lines.append("")
        return "\n".join(lines)

    @staticmethod
    def _trim_history(
        history: list[dict[str, str]],
        max_messages: int = 10,
    ) -> list[dict[str, str]]:
        if len(history) <= max_messages:
            return list(history)
        return list(history[-max_messages:])
