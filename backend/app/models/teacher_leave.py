"""
Teacher Leave Model

Teachers apply for leave, admin/principal approves.
"""

from datetime import date, datetime
from enum import Enum
from sqlalchemy import String, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class LeaveType(str, Enum):
    CASUAL = "CASUAL"
    SICK = "SICK"
    EARNED = "EARNED"
    MATERNITY = "MATERNITY"
    EMERGENCY = "EMERGENCY"


class LeaveStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class TeacherLeave(Base):
    """Teacher leave applications."""
    __tablename__ = "teacher_leaves"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    leave_type: Mapped[str] = mapped_column(String(20), nullable=False)
    from_date: Mapped[date] = mapped_column(Date, nullable=False)
    to_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=LeaveStatus.PENDING.value)

    applied_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    reviewed_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    review_remarks: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Relationships
    teacher = relationship("Teacher")
    reviewed_by = relationship("User")

    @property
    def total_days(self) -> int:
        return (self.to_date - self.from_date).days + 1

    def __repr__(self):
        return f"<TeacherLeave {self.teacher_id} {self.from_date} to {self.to_date}>"
