"""
WebSocket Connection Manager

Manages active WebSocket connections and provides methods for
broadcasting messages to users and groups.
"""

from typing import Dict, Set, Optional
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time communication.

    Features:
    - Track connections by user ID
    - Group connections by role or class
    - Broadcast to specific users, groups, or all
    """

    def __init__(self):
        # user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}

        # role -> set of user_ids
        self.role_groups: Dict[str, Set[int]] = {
            "ADMIN": set(),
            "CLASS_TEACHER": set(),
            "TEACHER": set(),
            "PARENT": set(),
            "STUDENT": set(),
        }

        # class_id -> set of user_ids (for class-specific notifications)
        self.class_groups: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, role: str, class_id: Optional[int] = None):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections[user_id] = websocket

        # Add to role group
        if role in self.role_groups:
            self.role_groups[role].add(user_id)

        # Add to class group if applicable
        if class_id:
            if class_id not in self.class_groups:
                self.class_groups[class_id] = set()
            self.class_groups[class_id].add(user_id)

        logger.info(f"WebSocket connected: user_id={user_id}, role={role}")

    def disconnect(self, user_id: int):
        """Remove a connection when the client disconnects."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

        # Remove from all groups
        for group in self.role_groups.values():
            group.discard(user_id)
        for group in self.class_groups.values():
            group.discard(user_id)

        logger.info(f"WebSocket disconnected: user_id={user_id}")

    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
                return True
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {e}")
                self.disconnect(user_id)
        return False

    async def broadcast_to_role(self, role: str, message: dict):
        """Send a message to all users with a specific role."""
        if role not in self.role_groups:
            return 0

        sent_count = 0
        disconnected = []

        for user_id in self.role_groups[role].copy():
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_json(message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send to user {user_id}: {e}")
                    disconnected.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected:
            self.disconnect(user_id)

        return sent_count

    async def broadcast_to_class(self, class_id: int, message: dict):
        """Send a message to all users in a specific class."""
        if class_id not in self.class_groups:
            return 0

        sent_count = 0
        disconnected = []

        for user_id in self.class_groups[class_id].copy():
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_json(message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send to user {user_id}: {e}")
                    disconnected.append(user_id)

        for user_id in disconnected:
            self.disconnect(user_id)

        return sent_count

    async def broadcast_all(self, message: dict):
        """Send a message to all connected users."""
        sent_count = 0
        disconnected = []

        for user_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_json(message)
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {e}")
                disconnected.append(user_id)

        for user_id in disconnected:
            self.disconnect(user_id)

        return sent_count

    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.active_connections)

    def is_user_connected(self, user_id: int) -> bool:
        """Check if a user is currently connected."""
        return user_id in self.active_connections

    def get_connected_users_by_role(self, role: str) -> set:
        """Get set of user IDs connected with a specific role."""
        return self.role_groups.get(role, set()).copy()

    def get_stats(self) -> dict:
        """Get connection statistics."""
        return {
            "total_connections": len(self.active_connections),
            "by_role": {role: len(users) for role, users in self.role_groups.items()},
            "class_subscriptions": len(self.class_groups),
        }

    async def broadcast_to_users(self, user_ids: list, message: dict) -> int:
        """Send a message to a list of specific users."""
        sent_count = 0
        disconnected = []

        for user_id in user_ids:
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_json(message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send to user {user_id}: {e}")
                    disconnected.append(user_id)

        for user_id in disconnected:
            self.disconnect(user_id)

        return sent_count


# Singleton instance
manager = ConnectionManager()
