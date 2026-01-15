from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.roles import Role
from app.schemas.marks import ExamCreate, ExamSubjectMaxCreate as ExamSubjectMax
from app.services.exam_service import (
    create_exam,
    set_exam_subject_max_marks,
)

router = APIRouter(
    prefix="/exams",
    tags=["Exams"],
)


@router.post("/")
def create_exam_api(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return create_exam(
        db,
        name=payload.name,
        exam_type=payload.exam_type,
        academic_year_id=payload.academic_year_id,
        class_id=payload.class_id,
        user=user,
    )


@router.post("/{exam_id}/subjects/max-marks")
def set_max_marks_api(
    exam_id: int,
    payload: ExamSubjectMax,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return set_exam_subject_max_marks(
        db,
        exam_id=exam_id,
        subject_id=payload.subject_id,
        max_marks=payload.max_marks,
        user=user,
    )
