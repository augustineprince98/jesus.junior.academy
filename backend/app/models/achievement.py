"""
Achievement Model - Student Achievements Showcase

For the Achievers Club page on the public website.
"""

from datetime import date, datetime
from enum import Enum
from sqlalchemy import String, Date, DateTime, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AchievementCategory(str, Enum):
    ACADEMIC = "ACADEMIC"
    SPORTS = "SPORTS"
    ARTS = "ARTS"
    SCIENCE = "SCIENCE"
    LEADERSHIP = "LEADERSHIP"
    COMMUNITY = "COMMUNITY"
    OTHER = "OTHER"


class Achievement(Base):
    """Student achievements for public showcase."""
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True)  # Optional if school-level
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    achievement_date: Mapped[date] = mapped_column(Date, nullable=False)

    # For display
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(default=0)

    # Metadata
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    academic_year_id: Mapped[int | None] = mapped_column(ForeignKey("academic_years.id"), nullable=True)

    # Relationships
    student = relationship("Student")
    created_by = relationship("User")
    academic_year = relationship("AcademicYear")

    def __repr__(self):
        return f"<Achievement {self.id}: {self.title[:30]}>"
