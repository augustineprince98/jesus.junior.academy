"""
WebSocket Endpoint and Handlers

Handles WebSocket connections and message processing.
Features:
- JWT authentication
- Heartbeat/ping-pong keep-alive
- User and role-based messaging
- Graceful reconnection support
"""

from fastapi import WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import json
import logging
import asyncio
from datetime import datetime

from app.core.database import get_db, SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from .manager import manager

logger = logging.getLogger(__name__)

# Configuration
HEARTBEAT_INTERVAL = 30  # Send ping every 30 seconds
CONNECTION_TIMEOUT = 60  # Close connection after 60 seconds of no response


async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time communication.

    Connect with: ws://localhost:8000/ws?token=<jwt_token>

    Message Types (incoming):
    - ping: Keep-alive ping (responds with pong)
    - subscribe: Subscribe to a channel
    - unsubscribe: Unsubscribe from a channel

    Message Types (outgoing):
    - connected: Connection established
    - notification: New notification
    - attendance: Attendance status update
    - homework: Homework update
    - announcement: School-wide announcement
    - pong: Response to ping
    - heartbeat: Server-initiated keep-alive
    """
    user_id = None
    user_role = None
    heartbeat_task = None

    try:
        # Authenticate using JWT token
        payload = decode_access_token(token)
        if not payload:
            await websocket.close(code=4001, reason="Invalid token")
            return

        user_id = int(payload.get("sub"))

        # Get user role from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user_role = user.role
            else:
                await websocket.close(code=4001, reason="User not found")
                return
        finally:
            db.close()

        # Accept connection with user's actual role
        await manager.connect(websocket, user_id, user_role or "UNKNOWN")

        # Send connection success message
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "role": user_role,
            "message": "WebSocket connection established",
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Start heartbeat task
        async def send_heartbeat():
            """Send periodic heartbeat to keep connection alive."""
            while True:
                try:
                    await asyncio.sleep(HEARTBEAT_INTERVAL)
                    await websocket.send_json({
                        "type": "heartbeat",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                except Exception:
                    break

        heartbeat_task = asyncio.create_task(send_heartbeat())

        # Main message loop
        while True:
            try:
                # Receive message with timeout
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=CONNECTION_TIMEOUT
                )

                message_type = data.get("type", "")

                if message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    })

                elif message_type == "subscribe":
                    # Subscribe to specific channels/groups
                    channel = data.get("channel")
                    class_id = data.get("class_id")

                    # If subscribing to a class channel
                    if channel == "class" and class_id:
                        if class_id not in manager.class_groups:
                            manager.class_groups[class_id] = set()
                        manager.class_groups[class_id].add(user_id)

                    await websocket.send_json({
                        "type": "subscribed",
                        "channel": channel,
                        "class_id": class_id,
                    })

                elif message_type == "unsubscribe":
                    # Unsubscribe from a channel
                    channel = data.get("channel")
                    class_id = data.get("class_id")

                    if channel == "class" and class_id:
                        if class_id in manager.class_groups:
                            manager.class_groups[class_id].discard(user_id)

                    await websocket.send_json({
                        "type": "unsubscribed",
                        "channel": channel,
                    })

                elif message_type == "get_status":
                    # Return connection status
                    await websocket.send_json({
                        "type": "status",
                        "user_id": user_id,
                        "role": user_role,
                        "connected_users": manager.get_connection_count(),
                        "timestamp": datetime.utcnow().isoformat(),
                    })

                else:
                    # Unknown message type
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}",
                    })

            except asyncio.TimeoutError:
                # Connection timed out, send a ping to check if still alive
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception:
                    break

            except WebSocketDisconnect:
                break

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                })

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        try:
            await websocket.close(code=4000, reason=str(e))
        except:
            pass

    finally:
        # Cancel heartbeat task
        if heartbeat_task:
            heartbeat_task.cancel()
            try:
                await heartbeat_task
            except asyncio.CancelledError:
                pass

        # Disconnect user
        if user_id:
            manager.disconnect(user_id)
            logger.info(f"WebSocket disconnected: user_id={user_id}")


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
