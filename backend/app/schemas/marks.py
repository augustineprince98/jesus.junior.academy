from typing import List
from pydantic import BaseModel, Field


# ----------------------------
# EXAMS
# ----------------------------
class ExamCreate(BaseModel):
    name: str
    academic_year_id: int
    exam_type: str = Field(
        description="FA / MID_TERM / ANNUAL"
    )


# ----------------------------
# SUBJECTS
# ----------------------------
class SubjectCreate(BaseModel):
    name: str


class AssignSubjectToClass(BaseModel):
    class_id: int
    subject_id: int


# ----------------------------
# CLASS TEACHER:
# SET MAX MARKS PER SUBJECT
# ----------------------------
class ExamSubjectMaxCreate(BaseModel):
    exam_id: int
    class_id: int
    subject_id: int
    max_marks: int = Field(gt=0)


# ----------------------------
# SUBJECT TEACHER:
# ENTER STUDENT MARKS
# ----------------------------
class MarkEntry(BaseModel):
    student_id: int
    subject_id: int
    marks_obtained: int = Field(ge=0)


class MarkEntryRequest(BaseModel):
    class_id: int
    exam_id: int
    marks: List[MarkEntry]
