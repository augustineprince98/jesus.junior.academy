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
    target_audience: str  # ALL, PARENTS, STUDENTS, TEACHERS, CLASS_SPECIFIC, PUBLIC, PUBLIC_AND_REGISTERED
    target_class_id: Optional[int] = None
    academic_year_id: int
    scheduled_for: Optional[datetime] = None  # Schedule publication for this time (IST)
    is_public: bool = False  # Show on public homepage
    expires_at: Optional[datetime] = None  # Auto-hide after this time


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

@router.get("/list")
def list_all_notifications(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] List all notifications created by admins.
    """
    from app.models.notification import Notification
    
    notifications = db.query(Notification).order_by(
        Notification.created_at.desc()
    ).limit(limit).offset(offset).all()
    
    result = []
    for notif in notifications:
        # Count recipients
        from app.models.notification import NotificationRecipient
        recipients_count = db.query(NotificationRecipient).filter(
            NotificationRecipient.notification_id == notif.id
        ).count()
        
        result.append({
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "notification_type": notif.notification_type.value,
            "priority": notif.priority.value,
            "is_sent": notif.is_sent,
            "sent_at": notif.sent_at.isoformat() if notif.sent_at else None,
            "created_at": notif.created_at.isoformat() if notif.created_at else None,
            "recipients_count": recipients_count if notif.is_sent else 0,
        })
    
    return {
        "notifications": result,
        "total": len(result),
    }


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


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Admin Quick-Send Notices
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class QuickNoticeRequest(BaseModel):
    """Quick notice for common announcements."""
    notice_type: str  # HOLIDAY, VACATION, TIMING_CHANGE, GENERAL
    title: str
    message: str
    effective_date: Optional[str] = None  # For holidays/timing changes
    end_date: Optional[str] = None  # For vacations


@router.post("/send-notice")
def send_quick_notice(
    payload: QuickNoticeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Send a quick notice to all parents and students.

    Notice types:
    - HOLIDAY: School closure notification
    - VACATION: Extended vacation notice (summer/winter break)
    - TIMING_CHANGE: Change in school timings
    - GENERAL: Any other announcement

    This creates AND sends the notification in one step.
    """
    from app.models.academic_year import AcademicYear

    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not current_year:
        raise HTTPException(status_code=400, detail="No current academic year found")

    # Map notice type to notification type and priority
    type_mapping = {
        "HOLIDAY": (NotificationType.HOLIDAY, NotificationPriority.HIGH),
        "VACATION": (NotificationType.HOLIDAY, NotificationPriority.HIGH),
        "TIMING_CHANGE": (NotificationType.ANNOUNCEMENT, NotificationPriority.URGENT),
        "GENERAL": (NotificationType.ANNOUNCEMENT, NotificationPriority.NORMAL),
    }

    if payload.notice_type not in type_mapping:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid notice_type. Must be one of: {list(type_mapping.keys())}"
        )

    notification_type, priority = type_mapping[payload.notice_type]

    # Build message with dates if provided
    full_message = f"Dear Parents and Students,\n\n{payload.message}"

    if payload.effective_date:
        if payload.notice_type == "VACATION" and payload.end_date:
            full_message += f"\n\nDuration: {payload.effective_date} to {payload.end_date}"
        else:
            full_message += f"\n\nEffective Date: {payload.effective_date}"

    full_message += "\n\nThank you,\nJesus Junior Academy"

    # Create notification
    notification = create_notification(
        db,
        title=payload.title,
        message=full_message,
        notification_type=notification_type,
        priority=priority,
        target_audience=TargetAudience.ALL,  # Send to everyone
        academic_year_id=current_year.id,
        created_by_id=user.id,
    )

    # Send immediately
    result = send_notification(db, notification_id=notification.id)

    return {
        "status": "notice_sent",
        "notice_type": payload.notice_type,
        "title": payload.title,
        "recipients_count": result["recipients_count"],
        "sent_at": result["sent_at"],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Public Notice Endpoints (No Auth Required)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/public")
def get_public_notices(
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """
    [PUBLIC] Get notices for public homepage.

    Returns notices where is_public=True and is_published=True.
    Automatically filters out expired notices.
    """
    from app.models.notification import Notification

    now = datetime.utcnow()

    notices = db.query(Notification).filter(
        Notification.is_public == True,
        Notification.is_published == True,
        # Not expired (either no expiry or expiry in future)
        (Notification.expires_at.is_(None) | (Notification.expires_at > now)),
    ).order_by(
        Notification.priority.desc(),  # URGENT first
        Notification.published_at.desc()
    ).limit(limit).all()

    return {
        "notices": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "priority": n.priority,
                "published_at": n.published_at.isoformat() if n.published_at else None,
                "expires_at": n.expires_at.isoformat() if n.expires_at else None,
            }
            for n in notices
        ],
        "total": len(notices),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Class Teacher Notice Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ClassTeacherNoticeRequest(BaseModel):
    """Notice from class teacher to class parents."""
    title: str
    message: str
    notification_type: str = "ANNOUNCEMENT"
    priority: str = "NORMAL"
    scheduled_for: Optional[datetime] = None
    is_public: bool = False
    class_id: Optional[int] = None  # Optional for class teachers, required for admin


@router.post("/class-notice")
def create_class_notice(
    payload: ClassTeacherNoticeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [ADMIN/CLASS_TEACHER] Create a notice for a class.

    - Admin can send to any class by specifying class_id
    - Class teachers can only send to their own class
    """
    from app.models.academic_year import AcademicYear
    from app.models.school_class import SchoolClass

    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not current_year:
        raise HTTPException(status_code=400, detail="No current academic year found")

    # Admin can specify any class, class teacher uses their assigned class
    if user.role == Role.ADMIN.value:
        if not payload.class_id:
            raise HTTPException(status_code=400, detail="Admin must specify class_id")
        assigned_class = db.get(SchoolClass, payload.class_id)
        if not assigned_class:
            raise HTTPException(status_code=404, detail="Class not found")
    else:
        # Find the class where this teacher is class teacher
        assigned_class = db.query(SchoolClass).filter(
            SchoolClass.class_teacher_id == user.teacher_id,
            SchoolClass.academic_year_id == current_year.id,
        ).first()

        if not assigned_class:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned as class teacher to any class"
            )

    try:
        notification_type = NotificationType(payload.notification_type)
        priority = NotificationPriority(payload.priority)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid enum value: {e}")

    notification = create_notification(
        db,
        title=payload.title,
        message=payload.message,
        notification_type=notification_type,
        priority=priority,
        target_audience=TargetAudience.CLASS_SPECIFIC,
        target_class_id=assigned_class.id,
        academic_year_id=current_year.id,
        created_by_id=user.id,
        scheduled_for=payload.scheduled_for,
        is_public=payload.is_public,
    )

    return {
        "status": "notice_created",
        "notification_id": notification.id,
        "class_name": assigned_class.name,
        "title": notification.title,
        "is_published": notification.is_published,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Publish and Schedule Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/{notification_id}/publish")
def publish_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [ADMIN/CLASS_TEACHER] Publish a notification immediately.

    For public notices, this makes them visible on the public homepage.
    For registered user notices, this sends to recipients.
    """
    from app.models.notification import Notification

    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Class teachers can only publish their own notifications or their class notifications
    if user.role == Role.CLASS_TEACHER.value:
        if notification.created_by_id != user.id:
            raise HTTPException(status_code=403, detail="You can only publish your own notifications")

    if notification.is_published:
        return {
            "status": "already_published",
            "notification_id": notification_id,
            "published_at": notification.published_at.isoformat() if notification.published_at else None,
        }

    # Publish the notification
    notification.is_published = True
    notification.published_at = datetime.utcnow()

    # If it's a registered user notice, send to recipients
    recipients_count = 0
    if notification.target_audience not in [TargetAudience.PUBLIC.value]:
        result = send_notification(db, notification_id=notification.id)
        recipients_count = result.get("recipients_count", 0)

    db.commit()

    return {
        "status": "published",
        "notification_id": notification_id,
        "is_public": notification.is_public,
        "published_at": notification.published_at.isoformat(),
        "recipients_count": recipients_count,
    }


class ScheduleNotificationRequest(BaseModel):
    """Schedule a notification for future publication."""
    scheduled_for: datetime  # IST datetime for publication


@router.post("/{notification_id}/schedule")
def schedule_notification(
    notification_id: int,
    payload: ScheduleNotificationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [ADMIN/CLASS_TEACHER] Schedule a notification for future publication.

    The notification will be automatically published at the scheduled time (IST).
    """
    from app.models.notification import Notification

    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Class teachers can only schedule their own notifications
    if user.role == Role.CLASS_TEACHER.value:
        if notification.created_by_id != user.id:
            raise HTTPException(status_code=403, detail="You can only schedule your own notifications")

    if notification.is_published:
        raise HTTPException(status_code=400, detail="Cannot schedule an already published notification")

    # Validate scheduled time is in the future
    if payload.scheduled_for <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    notification.scheduled_for = payload.scheduled_for
    db.commit()

    return {
        "status": "scheduled",
        "notification_id": notification_id,
        "scheduled_for": notification.scheduled_for.isoformat(),
    }
