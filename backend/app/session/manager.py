"""
Session Manager — Phase 1B

In-memory session store for multi-turn agent conversations.

Limitations (MVP):
    - All sessions are lost on backend restart.
    - No persistence layer (Redis / DB) — intentional for Phase 1B.
    - No TTL / eviction — sessions accumulate until restart.

Usage:
    manager = SessionManager()
    session = manager.get_or_create()                 # new session
    session = manager.get_or_create("existing-id")    # resume

    manager.append_user(session["id"], "Show high severity alerts")
    manager.append_assistant(session["id"], "Here are the top 5 ...")
    history = manager.get_history(session["id"])
"""
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class SessionManager:
    """
    In-memory session store keyed by session_id.

    Each session is a dict:
        {
            "id": str,
            "created_at": str (ISO 8601),
            "messages": [ {"role": "user"|"assistant", "content": str}, ... ]
        }

    Thread-safety note:
        FastAPI runs async on a single event loop, so dict mutations
        are safe without locks for the MVP.  If the backend later moves
        to threaded workers, wrap _sessions with threading.Lock.
    """

    def __init__(self) -> None:
        self._sessions: dict[str, dict] = {}
        logger.info("SessionManager initialised (in-memory, clears on restart)")

    # ------------------------------------------------------------------
    # Core API
    # ------------------------------------------------------------------

    def get_or_create(self, session_id: str | None = None) -> dict:
        """
        Retrieve an existing session or create a new one.

        Args:
            session_id: Optional existing session ID.
                        If None or not found, a new session is created.

        Returns:
            Session dict with keys: id, created_at, messages.
        """
        if session_id and session_id in self._sessions:
            logger.debug("Session resumed: %s", session_id)
            return self._sessions[session_id]

        new_id = session_id or str(uuid.uuid4())
        session = {
            "id": new_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "messages": [],
        }
        self._sessions[new_id] = session
        logger.info(
            "Session created: %s (total active: %d)",
            new_id,
            len(self._sessions),
        )
        return session

    def append_user(self, session_id: str, message: str) -> None:
        """
        Append a user message to the session history.

        Creates the session if it doesn't exist (defensive).
        """
        session = self.get_or_create(session_id)
        session["messages"].append({"role": "user", "content": message})
        logger.debug(
            "Session %s: +user msg (history len=%d)",
            session_id,
            len(session["messages"]),
        )

    def append_assistant(self, session_id: str, message: str) -> None:
        """
        Append an assistant message to the session history.

        Creates the session if it doesn't exist (defensive).
        """
        session = self.get_or_create(session_id)
        session["messages"].append({"role": "assistant", "content": message})
        logger.debug(
            "Session %s: +assistant msg (history len=%d)",
            session_id,
            len(session["messages"]),
        )

    def get_history(self, session_id: str) -> list[dict[str, str]]:
        """
        Return the message history for a session.

        Returns an empty list if the session doesn't exist.
        """
        session = self._sessions.get(session_id)
        if session is None:
            return []
        return list(session["messages"])  # shallow copy for safety

    # ------------------------------------------------------------------
    # Observability
    # ------------------------------------------------------------------

    def active_session_count(self) -> int:
        """Return the number of active sessions."""
        return len(self._sessions)

    def __repr__(self) -> str:
        return f"SessionManager(sessions={len(self._sessions)})"
