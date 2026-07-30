"""Shared request/response models for product APIs (Phase 2)."""
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Product chat request — same core fields as debug agent-run."""

    message: str = Field(
        ...,
        description="Analyst natural-language question or follow-up.",
        min_length=1,
    )
    session_id: str | None = Field(
        default=None,
        description="Optional session id for multi-turn conversation.",
    )


class ChatResponse(BaseModel):
    """Product chat response (stable contract for UI clients)."""

    session_id: str
    answer: str
    plan: str = ""
    tools_used: list[str] = Field(default_factory=list)
    iterations: int = 0
    error: str | None = None
