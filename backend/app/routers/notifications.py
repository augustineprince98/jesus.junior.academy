"""
Notifications Router - School notifications system.

Features:
- Admin creates and sends announcements
- Parents receive holiday notices
- Class-specific notifications (homework, results)
- Mark notifications as read
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.notification import NotificationType, NotificationPriority, TargetAudience
from app.services.notification_service import (
    create_notification,
    send_notification,
    get_user_notifications,
    mark_notification_read,
    get_unread_count,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    notification_type: str  # HOLIDAY, ANNOUNCEMENT, etc.
    priority: str = "NORMAL"  # LOW, NORMAL, HIGH, URGENT
    target_audience: str  # ALL, PARENTS, STUDENTS, TEACHERS, CLASS_SPECIFIC
    target_class_id: Optional[int] = None
    academic_year_id: int
    scheduled_for: Optional[datetime] = None


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    priority: str
    is_sent: bool
    sent_at: Optional[datetime]
    recipients_count: Optional[int] = None


class UserNotificationResponse(BaseModel):
    notification_id: int
    title: str
    message: str
    notification_type: str
    priority: str
    is_read: bool
    read_at: Optional[datetime]
    sent_at: Optional[datetime]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Admin Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/create")
def create_new_notification(
    payload: CreateNotificationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Create a new notification.

    Notification is created but not sent until /send is called.
    """
    try:
        notification_type = NotificationType(payload.notification_type)
        priority = NotificationPriority(payload.priority)
        target_audience = TargetAudience(payload.target_audience)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid enum value: {e}")

    if target_audience == TargetAudience.CLASS_SPECIFIC and not payload.target_class_id:
        raise HTTPException(
            status_code=400,
            detail="target_class_id required for CLASS_SPECIFIC audience"
        )

    notification = create_notification(
        db,
        title=payload.title,
        message=payload.message,
        notification_type=notification_type,
        priority=priority,
        target_audience=target_audience,
        target_class_id=payload.target_class_id,
        academic_year_id=payload.academic_year_id,
        created_by_id=user.id,
        scheduled_for=payload.scheduled_for,
    )

    return {
        "status": "notification_created",
        "notification_id": notification.id,
        "title": notification.title,
        "is_sent": notification.is_sent,
    }


@router.post("/{notification_id}/send")
def send_notification_endpoint(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Send a notification to all recipients.
    """
    try:
        result = send_notification(db, notification_id=notification_id)
        return {
            "status": "notification_sent",
            **result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# User Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/my")
def get_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get notifications for the current user.
    """
    notifications = get_user_notifications(
        db,
        user_id=user.id,
        unread_only=unread_only,
        limit=limit,
    )
    return {
        "notifications": notifications,
        "total": len(notifications),
    }


@router.get("/my/unread-count")
def get_my_unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get count of unread notifications for current user.
    """
    count = get_unread_count(db, user_id=user.id)
    return {"unread_count": count}


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Mark a notification as read.
    """
    success = mark_notification_read(
        db,
        user_id=user.id,
        notification_id=notification_id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "marked_as_read"}


@router.post("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Mark all notifications as read for current user.
    """
    from app.models.notification import NotificationRecipient

    updated = db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == user.id,
        NotificationRecipient.is_read.is_(False),
    ).update({
        NotificationRecipient.is_read: True,
        NotificationRecipient.read_at: datetime.utcnow(),
    })
    db.commit()

    return {
        "status": "all_marked_as_read",
        "notifications_updated": updated,
    }
