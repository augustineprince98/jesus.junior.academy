"""
Notification System Models

Handles:
- School-wide announcements
- Holiday notices (auto-generated from calendar)
- Homework notifications (bulk to class parents)
- Fee reminders
- Result publications
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NotificationType(str, Enum):
    HOLIDAY = "HOLIDAY"              # School holiday notification
    HOMEWORK = "HOMEWORK"            # Daily homework notification
    ANNOUNCEMENT = "ANNOUNCEMENT"    # General school announcement
    FEE_REMINDER = "FEE_REMINDER"    # Fee payment reminder
    RESULT = "RESULT"                # Result publication notice
    ATTENDANCE = "ATTENDANCE"        # Attendance alert (absent notification)
    EXAM = "EXAM"                    # Exam schedule notification


class NotificationPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TargetAudience(str, Enum):
    ALL = "ALL"                      # Everyone
    PARENTS = "PARENTS"              # All parents
    STUDENTS = "STUDENTS"            # All students
    TEACHERS = "TEACHERS"            # All teachers
    CLASS_SPECIFIC = "CLASS_SPECIFIC"  # Specific class only
    PUBLIC = "PUBLIC"                # Public homepage (no login required)
    PUBLIC_AND_REGISTERED = "PUBLIC_AND_REGISTERED"  # Both public and registered users


class DeliveryMethod(str, Enum):
    APP = "APP"                      # In-app notification
    SMS = "SMS"                      # SMS message
    EMAIL = "EMAIL"                  # Email notification


class Notification(Base):
    """
    Main notification table.

    Created by admins/teachers, sent to target audience.
    """
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(30), nullable=False)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default=NotificationPriority.NORMAL.value)
    target_audience: Mapped[str] = mapped_column(String(30), nullable=False)
    target_class_id: Mapped[int | None] = mapped_column(
        ForeignKey("school_classes.id", ondelete="SET NULL"), nullable=True
    )
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False
    )
    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Public notice fields
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)  # Show on public homepage
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)  # Published status
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # Auto-hide after this time

    # Relationships
    target_class = relationship("SchoolClass")
    academic_year = relationship("AcademicYear")
    created_by = relationship("User")
    recipients = relationship("NotificationRecipient", back_populates="notification", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Notification {self.id}: {self.title[:30]}>"


class NotificationRecipient(Base):
    """
    Tracks which users received which notifications.

    Used for:
    - Tracking read/unread status
    - Delivery confirmation (SMS/Email)
    - Analytics
    """
    __tablename__ = "notification_recipients"

    id: Mapped[int] = mapped_column(primary_key=True)
    notification_id: Mapped[int] = mapped_column(
        ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    delivered_via: Mapped[str | None] = mapped_column(String(20), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    notification = relationship("Notification", back_populates="recipients")
    user = relationship("User")

    def __repr__(self):
        return f"<NotificationRecipient notification={self.notification_id} user={self.user_id}>"
