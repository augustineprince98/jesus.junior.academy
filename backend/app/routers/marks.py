from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.roles import Role
from app.models import (
    Exam,
    Subject,
    ClassSubject,
    ExamSubjectMax,  # FIXED: Correct model name
    StudentMark,
    SchoolClass,
    Enrollment,
)
from app.models.user import User
from app.schemas.marks import (
    ExamCreate,
    SubjectCreate,
    AssignSubjectToClass,
    ExamSubjectMaxCreate,
    MarkEntryRequest,
)

router = APIRouter(prefix="/marks", tags=["Marks & Exams"])

@router.post("/exam")
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admins only")

    exam = Exam(
        name=payload.name,
        exam_type=payload.exam_type,
        academic_year_id=payload.academic_year_id,
        class_id=payload.class_id,  # FIXED: This field now exists
    )
    db.add(exam)
    db.commit()
    return {"status": "exam created", "exam_id": exam.id}

@router.post("/subject")
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admins only")

    subject = Subject(name=payload.name)
    db.add(subject)
    db.commit()
    return {"status": "subject created", "subject_id": subject.id}

@router.post("/assign-subject")
def assign_subject_to_class(
    payload: AssignSubjectToClass,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admins only")

    mapping = ClassSubject(
        class_id=payload.class_id,
        subject_id=payload.subject_id,
    )
    db.add(mapping)
    db.commit()
    return {"status": "subject assigned to class"}

@router.post("/exam/{exam_id}/subject-max")
def set_subject_max_marks(
    exam_id: int,
    payload: ExamSubjectMaxCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in [Role.CLASS_TEACHER.value, Role.ADMIN.value]:
        raise HTTPException(status_code=403, detail="Class teachers or admin only")

    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Admin can set max marks for any class, class teacher only for their class
    if user.role != Role.ADMIN.value and school_class.class_teacher_id != user.teacher_id:
        raise HTTPException(status_code=403, detail="Not your class")

    existing = (
        db.query(ExamSubjectMax)
        .filter_by(
            exam_id=exam_id,
            subject_id=payload.subject_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Max marks already set")

    # FIXED: Use correct model name and fields
    exam_subject = ExamSubjectMax(
        exam_id=exam_id,
        subject_id=payload.subject_id,
        max_marks=payload.max_marks,
    )
    db.add(exam_subject)
    db.commit()
    return {"status": "max marks set"}

@router.post("/enter")
def enter_marks(
    payload: MarkEntryRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Enter marks for a student. Uses the marks_service for validation.
    """
    from app.services.marks_service import enter_marks as service_enter_marks

    mark = service_enter_marks(
        db,
        student_id=payload.student_id,
        exam_id=payload.exam_id,
        subject_id=payload.subject_id,
        marks_obtained=payload.marks_obtained,
        user=user,
    )
    return {
        "status": "marks_entered",
        "mark_id": mark.id,
        "student_id": mark.student_id,
        "marks_obtained": mark.marks_obtained,
        "is_locked": mark.is_locked,
    }