"""
School Calendar Model - Working Days Management

Tracks which days are working days, holidays, half-days, exam days.
Class teachers can only mark attendance on working days.
"""

from datetime import date, datetime
from enum import Enum
from sqlalchemy import String, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DayType(str, Enum):
    REGULAR = "REGULAR"          # Normal working day
    HOLIDAY = "HOLIDAY"          # Full day off (Diwali, Christmas, etc.)
    HALF_DAY = "HALF_DAY"        # Half working day
    EXAM_DAY = "EXAM_DAY"        # Exam day (no regular classes)
    VACATION = "VACATION"        # Summer/Winter vacation


class SchoolCalendar(Base):
    """
    Tracks working days for the school.

    Admin sets the calendar at the start of academic year.
    Class teachers can only mark attendance on working days.
    """
    __tablename__ = "school_calendar"

    id: Mapped[int] = mapped_column(primary_key=True)
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_working_day: Mapped[bool] = mapped_column(Boolean, default=True)
    day_type: Mapped[str] = mapped_column(String(30), nullable=False, default=DayType.REGULAR.value)
    reason: Mapped[str | None] = mapped_column(String(200), nullable=True)  # "Diwali", "Summer Vacation"
    created_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    # Relationships
    academic_year = relationship("AcademicYear")
    created_by = relationship("User")

    def __repr__(self):
        return f"<SchoolCalendar {self.date} - {self.day_type}>"
