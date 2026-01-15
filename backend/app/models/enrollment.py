from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"), nullable=False  # FIXED: Changed from users.id
    )
    class_id: Mapped[int] = mapped_column(
        ForeignKey("school_classes.id"), nullable=False  # FIXED: was "classes.id"
    )
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_years.id"), nullable=False
    )

    roll_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE"
    )
    # ACTIVE / PROMOTED / COMPLETED

    # FIXED: Corrected relationship names
    student = relationship("Student", back_populates="enrollments")
    school_class = relationship("SchoolClass", back_populates="enrollments")
    academic_year = relationship("AcademicYear", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("student_id", "academic_year_id"),
        UniqueConstraint("class_id", "academic_year_id", "roll_number"),
    )