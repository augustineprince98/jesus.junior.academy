from datetime import datetime, date

from sqlalchemy import String, Boolean, DateTime, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[str] = mapped_column(String(9), unique=True)  # e.g. "2025-26"
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # e.g. 2025-04-01
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # e.g. 2026-03-31
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    classes = relationship("SchoolClass", back_populates="academic_year")
    enrollments = relationship("Enrollment", back_populates="academic_year")
    calendar_entries = relationship("SchoolCalendar", back_populates="academic_year")
