"""
Session Manager — Phase 1B

In-memory session store for multi-turn agent conversations.

Limitations (MVP):
    - All sessions are lost on backend restart.
    - No persistence layer (Redis / DB) — intentional for Phase 1B.

Usage:
    manager = SessionManager()
    session = manager.get_or_create(session_id)
    manager.append_user(session_id, "Show high severity alerts")
    manager.append_assistant(session_id, "Here are the top 5 ...")
"""
import logging

logger = logging.getLogger(__name__)


class SessionManager:
    """
    In-memory session store keyed by session_id.

    Stub — will be implemented in B3.
    """

    def __init__(self):
        raise NotImplementedError("B3: Implement SessionManager")

    def get_or_create(self, session_id: str | None = None) -> dict:
        """
        Retrieve an existing session or create a new one.

        Args:
            session_id: Optional existing session ID. If None, generates a new one.

        Returns:
            Session dict with id and message history.

        Raises:
            NotImplementedError: Stub — will be implemented in B3.
        """
        raise NotImplementedError("B3: Implement get_or_create")

    def append_user(self, session_id: str, message: str) -> None:
        """Append a user message to the session history."""
        raise NotImplementedError("B3: Implement append_user")

    def append_assistant(self, session_id: str, message: str) -> None:
        """Append an assistant message to the session history."""
        raise NotImplementedError("B3: Implement append_assistant")

    def get_history(self, session_id: str) -> list[dict[str, str]]:
        """Return the message history for a session."""
        raise NotImplementedError("B3: Implement get_history")
