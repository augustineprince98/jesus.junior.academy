from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

class SchoolClass(Base):
    __tablename__ = "school_classes"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)  # e.g. "CLASS_1", "LEVEL_II"
    section = Column(String, nullable=True)  # e.g. "A", "B"
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"))
    class_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)

    # FIXED: Added missing relationships
    academic_year = relationship("AcademicYear", back_populates="classes")
    subjects = relationship("ClassSubject", back_populates="school_class")
    exams = relationship("Exam", back_populates="school_class")
    enrollments = relationship("Enrollment", back_populates="school_class")
    fee_structures = relationship("FeeStructure", back_populates="school_class")