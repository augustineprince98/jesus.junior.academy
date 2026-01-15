from sqlalchemy import Column, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base

class StudentMark(Base):
    __tablename__ = "student_marks"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)  # FIXED: was users.id
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    
    marks_obtained = Column(Integer, nullable=False)
    
    # FIXED: Added missing fields used in services
    entered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_locked = Column(Boolean, default=True, nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="marks")
    subject = relationship("Subject", back_populates="marks")
    entered_by = relationship("User")