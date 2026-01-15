"""
Event Model - School Activities & Celebrations

For the Activities/Celebrations page on public website.
"""

from datetime import date, datetime, time
from enum import Enum
from sqlalchemy import String, Date, Time, DateTime, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EventType(str, Enum):
    CELEBRATION = "CELEBRATION"      # Diwali, Christmas, etc.
    SPORTS = "SPORTS"                # Sports day, competitions
    CULTURAL = "CULTURAL"            # Annual day, dance, music
    ACADEMIC = "ACADEMIC"            # Science fair, exhibitions
    HOLIDAY = "HOLIDAY"              # Public holidays
    MEETING = "MEETING"              # PTM, staff meetings
    OTHER = "OTHER"


class Event(Base):
    """School events and activities."""
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(String(30), nullable=False)

    # Timing
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    # Location
    venue: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Display
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)  # Show on public website
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)

    # Target audience
    for_students: Mapped[bool] = mapped_column(Boolean, default=True)
    for_parents: Mapped[bool] = mapped_column(Boolean, default=True)
    for_teachers: Mapped[bool] = mapped_column(Boolean, default=True)
    target_class_id: Mapped[int | None] = mapped_column(ForeignKey("school_classes.id"), nullable=True)

    # Metadata
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    academic_year_id: Mapped[int | None] = mapped_column(ForeignKey("academic_years.id"), nullable=True)

    # Relationships
    target_class = relationship("SchoolClass")
    created_by = relationship("User")
    academic_year = relationship("AcademicYear")

    def __repr__(self):
        return f"<Event {self.id}: {self.title[:30]}>"
