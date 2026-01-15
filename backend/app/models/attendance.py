from datetime import date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Date, Boolean, ForeignKey

from app.core.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    
    # FIXED: Added missing fields used in services
    class_id: Mapped[int] = mapped_column(ForeignKey("school_classes.id"))
    academic_year_id: Mapped[int] = mapped_column(ForeignKey("academic_years.id"))
    
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_present: Mapped[bool] = mapped_column(Boolean, nullable=False)  # FIXED: Renamed from "present"