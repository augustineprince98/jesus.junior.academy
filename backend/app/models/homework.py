"""
Homework System Model

Subject teachers assign homework for their classes.
When published, goes out as bulk notification to all parents of that class.
"""

from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Boolean, Text, Date, DateTime, ForeignKey, func, JSON
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

    # File attachments (images and documents)
    # Stored as JSON array: [{"filename": "...", "file_path": "...", "file_type": "image/png", "size": 1234}]
    attachments: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)

    # Relationships
    school_class = relationship("SchoolClass")
    subject = relationship("Subject")
    academic_year = relationship("AcademicYear")
    assigned_by = relationship("User")

    # Relationship to submission attachments
    homework_attachments = relationship("HomeworkAttachment", back_populates="homework", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Homework {self.id}: {self.title[:30]} for class {self.class_id}>"


class HomeworkAttachment(Base):
    """
    Individual file attachment for homework.
    Supports images (PNG, JPG, GIF) and documents (PDF, DOC, DOCX).
    """
    __tablename__ = "homework_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    homework_id: Mapped[int] = mapped_column(
        ForeignKey("homework.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # MIME type
    file_size: Mapped[int] = mapped_column(nullable=False)  # Size in bytes
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    # Relationships
    homework = relationship("Homework", back_populates="homework_attachments")

    def __repr__(self):
        return f"<HomeworkAttachment {self.id}: {self.original_filename}>"
