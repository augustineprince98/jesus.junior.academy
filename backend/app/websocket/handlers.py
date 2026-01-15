"""
WebSocket Endpoint and Handlers

Handles WebSocket connections and message processing.
"""

from fastapi import WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import json
import logging

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from .manager import manager

logger = logging.getLogger(__name__)


async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time communication.

    Connect with: ws://localhost:8000/ws?token=<jwt_token>

    Message Types:
    - notification: New notification received
    - attendance: Attendance status update
    - homework: Homework submission update
    - announcement: School-wide announcement
    - ping/pong: Keep-alive
    """
    user_id = None
    user_role = None

    try:
        # Authenticate using JWT token
        payload = decode_access_token(token)
        if not payload:
            await websocket.close(code=4001, reason="Invalid token")
            return

        user_id = int(payload.get("sub"))

        # Get user info from database (we need a db session)
        # For now, we'll accept the connection and get role from a separate query
        # In production, you might want to cache this or include it in the token

        # Accept connection with default role (will be updated)
        await manager.connect(websocket, user_id, "UNKNOWN")

        # Send connection success message
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "WebSocket connection established",
        })

        # Main message loop
        while True:
            try:
                # Receive message (with timeout for keep-alive)
                data = await websocket.receive_json()

                message_type = data.get("type", "")

                if message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_json({"type": "pong"})

                elif message_type == "subscribe":
                    # Subscribe to specific channels/groups
                    channel = data.get("channel")
                    await websocket.send_json({
                        "type": "subscribed",
                        "channel": channel,
                    })

                else:
                    # Echo unknown messages back
                    await websocket.send_json({
                        "type": "echo",
                        "original": data,
                    })

            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                })

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=4000, reason=str(e))
        except:
            pass

    finally:
        if user_id:
            manager.disconnect(user_id)


# Helper functions for sending notifications

async def send_notification_to_user(user_id: int, notification: dict):
    """Send a notification to a specific user."""
    message = {
        "type": "notification",
        "data": notification,
    }
    return await manager.send_to_user(user_id, message)


async def send_notification_to_role(role: str, notification: dict):
    """Send a notification to all users with a specific role."""
    message = {
        "type": "notification",
        "data": notification,
    }
    return await manager.broadcast_to_role(role, message)


async def send_attendance_update(class_id: int, attendance_data: dict):
    """Send attendance update to users in a class."""
    message = {
        "type": "attendance",
        "data": attendance_data,
    }
    return await manager.broadcast_to_class(class_id, message)


async def send_homework_update(class_id: int, homework_data: dict):
    """Send homework update to users in a class."""
    message = {
        "type": "homework",
        "data": homework_data,
    }
    return await manager.broadcast_to_class(class_id, message)


async def broadcast_announcement(announcement: dict):
    """Broadcast an announcement to all connected users."""
    message = {
        "type": "announcement",
        "data": announcement,
    }
    return await manager.broadcast_all(message)
