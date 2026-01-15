from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.exam import Exam, ExamType, ExamSubjectMax
from app.models.subject import Subject
from app.core.roles import Role


def create_exam(
    db: Session,
    *,
    name: str,
    exam_type: ExamType,
    academic_year_id: int,
    class_id: int,
    user,
):
    if user.role not in {Role.ADMIN, Role.CLASS_TEACHER}:
        raise HTTPException(status_code=403, detail="Not allowed")

    exam = Exam(
        name=name,
        exam_type=exam_type,
        academic_year_id=academic_year_id,
        class_id=class_id,
        created_by_id=user.id,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def set_exam_subject_max_marks(
    db: Session,
    *,
    exam_id: int,
    subject_id: int,
    max_marks: int,
    user,
):
    if user.role not in {Role.ADMIN, Role.CLASS_TEACHER}:
        raise HTTPException(status_code=403, detail="Not allowed")

    if max_marks <= 0:
        raise HTTPException(status_code=400, detail="Invalid max marks")

    record = (
        db.query(ExamSubjectMax)
        .filter_by(exam_id=exam_id, subject_id=subject_id)
        .first()
    )

    if record:
        record.max_marks = max_marks
    else:
        record = ExamSubjectMax(
            exam_id=exam_id,
            subject_id=subject_id,
            max_marks=max_marks,
        )
        db.add(record)

    db.commit()
    return record
