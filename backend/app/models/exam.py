from enum import Enum
from sqlalchemy import Column, Integer, String, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

class ExamType(str, Enum):
    FA = "FA"
    MID_TERM = "MID_TERM"
    ANNUAL = "ANNUAL"

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    exam_type = Column(SQLEnum(ExamType), nullable=False)
    class_id = Column(Integer, ForeignKey("school_classes.id"), nullable=False)
    
    # FIXED: Added missing fields used in services
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    school_class = relationship("SchoolClass", back_populates="exams")
    academic_year = relationship("AcademicYear")
    subject_max = relationship(
        "ExamSubjectMax",
        back_populates="exam",
        cascade="all, delete-orphan",
    )
    marks = relationship("StudentMark", back_populates="exam")


class ExamSubjectMax(Base):
    __tablename__ = "exam_subject_max"

    id = Column(Integer, primary_key=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    max_marks = Column(Integer, nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="subject_max")
    subject = relationship("Subject")
