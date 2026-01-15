"""
Teacher Attendance (Biometric) Model

Tracks teacher check-in/check-out times daily.
"""

from datetime import date, datetime, time
from sqlalchemy import String, Date, Time, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TeacherAttendance(Base):
    """Daily teacher attendance with in/out times."""
    __tablename__ = "teacher_attendance"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    check_out_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PRESENT")  # PRESENT, ABSENT, HALF_DAY, ON_LEAVE
    remarks: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Relationships
    teacher = relationship("Teacher")

    def __repr__(self):
        return f"<TeacherAttendance teacher={self.teacher_id} date={self.date}>"
