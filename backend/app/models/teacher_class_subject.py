"""
Teacher-Class-Subject Assignment Model

Maps which teacher teaches which subject in which class.
Used to restrict homework and marks entry to assigned subjects only.
"""

from datetime import datetime
from sqlalchemy import Integer, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TeacherClassSubject(Base):
    """
    Assignment of a teacher to teach a specific subject in a specific class.

    This allows:
    - A teacher to teach multiple subjects in different classes
    - Multiple teachers to teach the same subject in different classes
    - Restricting homework/marks entry to assigned subjects only
    """
    __tablename__ = "teacher_class_subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    class_id: Mapped[int] = mapped_column(
        ForeignKey("school_classes.id", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())

    __table_args__ = (
        UniqueConstraint(
            "teacher_id", "class_id", "subject_id", "academic_year_id",
            name="uq_teacher_class_subject_year"
        ),
    )

    # Relationships
    teacher = relationship("User")
    school_class = relationship("SchoolClass")
    subject = relationship("Subject")
    academic_year = relationship("AcademicYear")

    def __repr__(self):
        return f"<TeacherClassSubject teacher={self.teacher_id} class={self.class_id} subject={self.subject_id}>"
