"""
TOOL_CALL parsing and search-arg normalization — Phase 1.5 reliability.

Gemma often emits almost-valid JSON (trailing commas, nested braces, wrong
ES field names). This module extracts and repairs tool calls before execution.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_INDEX = "alerts-security"

_SEVERITY_WORD_TO_GTE = {
    "critical": 7,
    "high": 6,
    "medium": 4,
    "med": 4,
    "low": 1,
}

_FIELD_ALIASES = {
    "severity": "event.severity",
    "event.severity": "event.severity",
    "category": "event.type",
    "event.category": "event.type",
    "type": "event.type",
    "event.type": "event.type",
    "outcome": "event.outcome",
    "event.outcome": "event.outcome",
    "src_ip": "source.ip",
    "source_ip": "source.ip",
    "dst_ip": "destination.ip",
    "dest_ip": "destination.ip",
}


def extract_tool_call(plan_text: str) -> dict[str, Any] | None:
    """
    Extract {"tool": str, "arguments": dict} from planner output.

    Returns None if no tool call is present (direct-answer path).
    Raises ValueError if a TOOL_CALL was intended but cannot be parsed.
    """
    if not plan_text or not plan_text.strip():
        return None

    intended = "TOOL_CALL" in plan_text.upper()
    raw = _slice_after_marker(plan_text, "TOOL_CALL:")
    if raw is None:
        raw = _find_json_object_with_tool_key(plan_text)
    if raw is None:
        return None

    last_err: Exception | None = None
    for candidate in _json_candidates(raw):
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict) and parsed.get("tool"):
                args = parsed.get("arguments") or parsed.get("args") or {}
                if not isinstance(args, dict):
                    args = {}
                return {"tool": str(parsed["tool"]).strip(), "arguments": args}
        except json.JSONDecodeError as exc:
            last_err = exc
            continue

    if intended or raw:
        raise ValueError(
            f"Could not parse tool call JSON: {last_err}. "
            f"Raw snippet: {raw[:220]!r}"
        )
    return None


def normalize_tool_args(tool_name: str, tool_args: dict[str, Any]) -> dict[str, Any]:
    """Normalize arguments for known Elastic MCP tools against seed schema."""
    args = dict(tool_args or {})

    if tool_name == "search":
        return _normalize_search_args(args)
    if tool_name == "list_indices" and not args.get("index_pattern"):
        args["index_pattern"] = "*"
    if tool_name in ("get_mappings", "get_shards") and not args.get("index"):
        args["index"] = DEFAULT_INDEX
    return args


def _normalize_search_args(args: dict[str, Any]) -> dict[str, Any]:
    out = dict(args)
    out["index"] = out.get("index") or DEFAULT_INDEX

    query_body = out.get("query_body")
    if not isinstance(query_body, dict):
        query_body = {}
        if isinstance(out.get("query"), dict):
            query_body["query"] = out.pop("query")
        if "size" in out:
            query_body["size"] = out.pop("size")
        if not query_body:
            query_body = {"query": {"match_all": {}}, "size": 5}

    # Move misplaced top-level ES keys into query_body
    for k in ("query", "size", "from", "sort", "fields"):
        if k in out and k not in ("index", "query_body"):
            # fields is valid at tool level for Elastic MCP search — keep if already set
            if k == "fields":
                continue
            if k not in query_body:
                query_body[k] = out.pop(k)
            else:
                out.pop(k, None)

    if "query" not in query_body:
        query_body["query"] = {"match_all": {}}

    # Models sometimes put size/sort inside the query object — hoist them
    q = query_body["query"]
    if isinstance(q, dict):
        for k in ("size", "from", "sort", "fields"):
            if k in q and k not in query_body:
                query_body[k] = q.pop(k)
            elif k in q:
                q.pop(k, None)

    query_body["query"] = _normalize_query_clause(query_body["query"])

    if "size" not in query_body:
        query_body["size"] = 5
    try:
        query_body["size"] = max(1, min(int(query_body["size"]), 20))
    except (TypeError, ValueError):
        query_body["size"] = 5

    # fields belongs on the MCP tool args, not always in query_body
    if "fields" in query_body and "fields" not in out:
        out["fields"] = query_body.pop("fields")

    out["query_body"] = query_body
    return out


def _normalize_query_clause(clause: Any) -> Any:
    """Recursively fix field aliases and severity word values."""
    if isinstance(clause, list):
        return [_normalize_query_clause(x) for x in clause]
    if not isinstance(clause, dict):
        return clause

    # term / match / match_phrase with one field
    for qtype in ("term", "match", "match_phrase"):
        if qtype in clause and isinstance(clause[qtype], dict) and len(clause[qtype]) == 1:
            field, val = next(iter(clause[qtype].items()))
            field = _FIELD_ALIASES.get(field, field)
            if field == "event.severity" and isinstance(val, str):
                gte = _SEVERITY_WORD_TO_GTE.get(val.strip().lower())
                if gte is not None:
                    rest = {
                        k: _normalize_query_clause(v)
                        for k, v in clause.items()
                        if k != qtype
                    }
                    rng = {"range": {"event.severity": {"gte": gte}}}
                    if rest:
                        return {"bool": {"must": [rng, rest]}}
                    return rng
            if field == "event.type" and isinstance(val, str):
                val = val.strip().lower()
            new_clause = {k: _normalize_query_clause(v) for k, v in clause.items() if k != qtype}
            new_clause[qtype] = {field: val}
            return new_clause

    if "range" in clause and isinstance(clause["range"], dict):
        fixed_range = {}
        for field, bounds in clause["range"].items():
            field = _FIELD_ALIASES.get(field, field)
            fixed_range[field] = bounds
        rest = {k: _normalize_query_clause(v) for k, v in clause.items() if k != "range"}
        rest["range"] = fixed_range
        return rest

    return {k: _normalize_query_clause(v) for k, v in clause.items()}


def _slice_after_marker(text: str, marker: str) -> str | None:
    upper = text.upper()
    m = marker.upper()
    idx = upper.find(m)
    if idx < 0:
        return None
    return text[idx + len(marker) :].strip()


def _find_json_object_with_tool_key(text: str) -> str | None:
    for m in re.finditer(r"\{", text):
        snippet = _extract_balanced_braces(text, m.start())
        if snippet and ('"tool"' in snippet or "'tool'" in snippet):
            return snippet
    return None


def _extract_balanced_braces(text: str, start: int) -> str | None:
    if start >= len(text) or text[start] != "{":
        brace = text.find("{", start)
        if brace < 0:
            return None
        start = brace
    depth = 0
    in_str = False
    escape = False
    quote = ""
    for i in range(start, len(text)):
        ch = text[i]
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_str = False
            continue
        if ch in ('"', "'"):
            in_str = True
            quote = ch
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _json_candidates(raw: str) -> list[str]:
    raw = raw.strip()
    if not raw.startswith("{"):
        brace = raw.find("{")
        if brace >= 0:
            raw = raw[brace:]
    balanced = _extract_balanced_braces(raw, 0)
    base = balanced if balanced else raw

    candidates = [base, _repair_json(base)]
    if balanced:
        candidates.append(_repair_json(balanced))

    seen: set[str] = set()
    out: list[str] = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def _repair_json(s: str) -> str:
    t = s.strip()
    t = re.sub(r",\s*}", "}", t)
    t = re.sub(r",\s*]", "]", t)
    if "'" in t and t.count('"') < 2:
        t = t.replace("'", '"')
    else:
        t = re.sub(r"'([^']*)'\s*:", r'"\1":', t)
    t = re.sub(r"\bTrue\b", "true", t)
    t = re.sub(r"\bFalse\b", "false", t)
    t = re.sub(r"\bNone\b", "null", t)
    # Close truncated objects/arrays (common when the model cuts off mid-JSON)
    t = _balance_brackets(t)
    return t


def _balance_brackets(s: str) -> str:
    """Append missing } or ] when the model truncates JSON."""
    stack: list[str] = []
    in_str = False
    escape = False
    quote = ""
    for ch in s:
        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == quote:
                in_str = False
            continue
        if ch in ('"', "'"):
            in_str = True
            quote = ch
            continue
        if ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]":
            if stack and stack[-1] == ch:
                stack.pop()
    if in_str:
        s += quote
    # drop trailing comma before we close
    s = re.sub(r",\s*$", "", s)
    while stack:
        s += stack.pop()
    return s
