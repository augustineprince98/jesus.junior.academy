"""
Homework System Model

Subject teachers assign homework for their classes.
When published, goes out as bulk notification to all parents of that class.
"""

from datetime import date, datetime
from sqlalchemy import String, Boolean, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Homework(Base):
    """
    Homework assignments by subject teachers.

    Flow:
    1. Subject teacher creates homework for their class/subject
    2. Teacher marks it as published
    3. System sends notification to all parents of students in that class
    """
    __tablename__ = "homework"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(
        ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False
    )
    assigned_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    # Relationships
    school_class = relationship("SchoolClass")
    subject = relationship("Subject")
    academic_year = relationship("AcademicYear")
    assigned_by = relationship("User")

    def __repr__(self):
        return f"<Homework {self.id}: {self.title[:30]} for class {self.class_id}>"
