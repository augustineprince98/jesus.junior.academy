from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[str] = mapped_column(String(9), unique=True)  # e.g. "2025-2026"
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    classes = relationship("SchoolClass", back_populates="academic_year")
    enrollments = relationship("Enrollment", back_populates="academic_year")