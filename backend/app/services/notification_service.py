"""
Notification Service - Handles all notification logic.

Features:
- Create and send notifications
- Holiday notifications (auto from calendar)
- Homework bulk notifications
- Target specific audiences (all, parents, class-specific)
"""

from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.notification import (
    Notification,
    NotificationRecipient,
    NotificationType,
    NotificationPriority,
    TargetAudience,
)
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.student_parent import StudentParent
from app.models.school_calendar import SchoolCalendar, DayType
from app.core.roles import Role


def create_notification(
    db: Session,
    *,
    title: str,
    message: str,
    notification_type: NotificationType,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    target_audience: TargetAudience,
    target_class_id: Optional[int] = None,
    academic_year_id: int,
    created_by_id: int,
    scheduled_for: Optional[datetime] = None,
) -> Notification:
    """
    Create a new notification.

    If target_audience is CLASS_SPECIFIC, target_class_id must be provided.
    """
    notification = Notification(
        title=title,
        message=message,
        notification_type=notification_type.value,
        priority=priority.value,
        target_audience=target_audience.value,
        target_class_id=target_class_id,
        academic_year_id=academic_year_id,
        created_by_id=created_by_id,
        scheduled_for=scheduled_for,
        is_sent=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def send_notification(
    db: Session,
    *,
    notification_id: int,
) -> dict:
    """
    Send a notification to all target recipients.

    Creates NotificationRecipient records for each user.
    """
    notification = db.get(Notification, notification_id)
    if not notification:
        raise ValueError("Notification not found")

    if notification.is_sent:
        raise ValueError("Notification already sent")

    # Get target users based on audience
    target_users = get_target_users(
        db,
        target_audience=TargetAudience(notification.target_audience),
        target_class_id=notification.target_class_id,
        academic_year_id=notification.academic_year_id,
    )

    # Create recipient records
    for user_id in target_users:
        recipient = NotificationRecipient(
            notification_id=notification_id,
            user_id=user_id,
            is_read=False,
        )
        db.add(recipient)

    # Mark as sent
    notification.is_sent = True
    notification.sent_at = datetime.utcnow()

    db.commit()

    return {
        "notification_id": notification_id,
        "recipients_count": len(target_users),
        "sent_at": notification.sent_at,
    }


def get_target_users(
    db: Session,
    *,
    target_audience: TargetAudience,
    target_class_id: Optional[int] = None,
    academic_year_id: int,
) -> List[int]:
    """
    Get list of user IDs to receive notification.
    """
    if target_audience == TargetAudience.ALL:
        # All active users
        users = db.query(User.id).filter(User.is_active.is_(True)).all()
        return [u.id for u in users]

    elif target_audience == TargetAudience.PARENTS:
        # All parent users
        users = db.query(User.id).filter(
            User.role == Role.PARENT.value,
            User.is_active.is_(True),
        ).all()
        return [u.id for u in users]

    elif target_audience == TargetAudience.STUDENTS:
        # All student users
        users = db.query(User.id).filter(
            User.role == Role.STUDENT.value,
            User.is_active.is_(True),
        ).all()
        return [u.id for u in users]

    elif target_audience == TargetAudience.TEACHERS:
        # All teacher users
        users = db.query(User.id).filter(
            User.role.in_([Role.TEACHER.value, Role.CLASS_TEACHER.value]),
            User.is_active.is_(True),
        ).all()
        return [u.id for u in users]

    elif target_audience == TargetAudience.CLASS_SPECIFIC:
        if not target_class_id:
            raise ValueError("target_class_id required for CLASS_SPECIFIC audience")

        # Get all students in this class
        enrollments = db.query(Enrollment).filter(
            Enrollment.class_id == target_class_id,
            Enrollment.academic_year_id == academic_year_id,
            Enrollment.status == "ACTIVE",
        ).all()

        student_ids = [e.student_id for e in enrollments]

        # Get parent user IDs for these students
        parent_links = db.query(StudentParent).filter(
            StudentParent.student_id.in_(student_ids),
        ).all()

        parent_ids = [pl.parent_id for pl in parent_links]

        # Get user IDs for these parents
        parent_users = db.query(User.id).filter(
            User.parent_id.in_(parent_ids),
            User.is_active.is_(True),
        ).all()

        # Get user IDs for students
        student_users = db.query(User.id).filter(
            User.student_id.in_(student_ids),
            User.is_active.is_(True),
        ).all()

        return list(set([u.id for u in parent_users] + [u.id for u in student_users]))

    return []


def create_holiday_notification(
    db: Session,
    *,
    calendar_entry: SchoolCalendar,
    created_by_id: int,
) -> Notification:
    """
    Create a notification for a holiday/school closure.
    """
    title = f"School Closed: {calendar_entry.reason or calendar_entry.day_type}"
    message = f"Dear Parents,\n\nPlease note that school will remain closed on {calendar_entry.date.strftime('%d %B %Y')}.\n\nReason: {calendar_entry.reason or calendar_entry.day_type}\n\nThank you."

    return create_notification(
        db,
        title=title,
        message=message,
        notification_type=NotificationType.HOLIDAY,
        priority=NotificationPriority.HIGH,
        target_audience=TargetAudience.PARENTS,
        academic_year_id=calendar_entry.academic_year_id,
        created_by_id=created_by_id,
    )


def create_homework_notification(
    db: Session,
    *,
    class_id: int,
    subject_name: str,
    homework_title: str,
    homework_description: str,
    due_date: date,
    academic_year_id: int,
    created_by_id: int,
) -> Notification:
    """
    Create a notification for homework assignment.

    Sent to all parents of students in the class.
    """
    title = f"Homework: {subject_name} - {homework_title}"
    message = f"Dear Parents,\n\n{subject_name} homework has been assigned:\n\n{homework_description}\n\nDue Date: {due_date.strftime('%d %B %Y')}\n\nPlease ensure your child completes it on time."

    return create_notification(
        db,
        title=title,
        message=message,
        notification_type=NotificationType.HOMEWORK,
        priority=NotificationPriority.NORMAL,
        target_audience=TargetAudience.CLASS_SPECIFIC,
        target_class_id=class_id,
        academic_year_id=academic_year_id,
        created_by_id=created_by_id,
    )


def get_user_notifications(
    db: Session,
    *,
    user_id: int,
    unread_only: bool = False,
    limit: int = 50,
) -> List[dict]:
    """
    Get notifications for a user.
    """
    query = db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == user_id,
    )

    if unread_only:
        query = query.filter(NotificationRecipient.is_read.is_(False))

    recipients = query.order_by(NotificationRecipient.id.desc()).limit(limit).all()

    result = []
    for r in recipients:
        notification = r.notification
        result.append({
            "notification_id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "priority": notification.priority,
            "is_read": r.is_read,
            "read_at": r.read_at,
            "sent_at": notification.sent_at,
        })

    return result


def mark_notification_read(
    db: Session,
    *,
    user_id: int,
    notification_id: int,
) -> bool:
    """
    Mark a notification as read for a user.
    """
    recipient = db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == user_id,
        NotificationRecipient.notification_id == notification_id,
    ).first()

    if not recipient:
        return False

    recipient.is_read = True
    recipient.read_at = datetime.utcnow()
    db.commit()
    return True


def get_unread_count(db: Session, *, user_id: int) -> int:
    """Get count of unread notifications for a user."""
    return db.query(NotificationRecipient).filter(
        NotificationRecipient.user_id == user_id,
        NotificationRecipient.is_read.is_(False),
    ).count()
