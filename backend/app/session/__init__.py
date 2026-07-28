"""
Session package — Phase 1B

In-memory session management for multi-turn agent conversations.
Restart clears all sessions (documented MVP limitation).
"""
from app.session.manager import SessionManager

__all__ = ["SessionManager"]
