from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    class_links = relationship("ClassSubject", back_populates="subject")
    exam_max = relationship("ExamSubjectMax", back_populates="subject")
    marks = relationship("StudentMark", back_populates="subject")
