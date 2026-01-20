from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[str] = mapped_column(String(9), unique=True)  # e.g. "2025-2026"
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    classes = relationship("SchoolClass", back_populates="academic_year")
    enrollments = relationship("Enrollment", back_populates="academic_year")
    calendar_entries = relationship("SchoolCalendar", back_populates="academic_year")
