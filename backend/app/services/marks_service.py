from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.student_mark import StudentMark
from app.models.exam import ExamSubjectMax, Exam
from app.models.enrollment import Enrollment
from app.models.class_subject import ClassSubject
from app.core.roles import Role


def enter_marks(
    db: Session,
    *,
    student_id: int,
    exam_id: int,
    subject_id: int,
    marks_obtained: int,
    user,
):
    """
    Enter marks for a student in an exam for a specific subject.

    Validations:
    - User must be ADMIN, TEACHER, or CLASS_TEACHER
    - Max marks must be defined for the subject in this exam
    - Marks must be within valid range (0 to max_marks)
    - Student must be enrolled in the class for this exam
    - Subject must be assigned to the class
    - Marks must not be locked (unless edit request approved)
    """
    if user.role not in {Role.ADMIN, Role.TEACHER, Role.CLASS_TEACHER}:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Get exam details to find class_id and academic_year_id
    exam = db.query(Exam).filter_by(id=exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Validate student is enrolled in this class
    enrollment = (
        db.query(Enrollment)
        .filter_by(
            student_id=student_id,
            class_id=exam.class_id,
            academic_year_id=exam.academic_year_id,
            status="ACTIVE",
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(
            status_code=400,
            detail="Student not enrolled in this class for this academic year",
        )

    # Validate subject is assigned to this class
    class_subject = (
        db.query(ClassSubject)
        .filter_by(class_id=exam.class_id, subject_id=subject_id)
        .first()
    )
    if not class_subject:
        raise HTTPException(
            status_code=400,
            detail="Subject not assigned to this class",
        )

    # Validate max marks is defined
    exam_subject = (
        db.query(ExamSubjectMax)
        .filter_by(exam_id=exam_id, subject_id=subject_id)
        .first()
    )
    if not exam_subject:
        raise HTTPException(
            status_code=400,
            detail="Maximum marks not defined for this subject in this exam",
        )

    # Validate marks range
    if marks_obtained < 0:
        raise HTTPException(
            status_code=400,
            detail="Marks cannot be negative",
        )
    if marks_obtained > exam_subject.max_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Marks ({marks_obtained}) exceed maximum allowed ({exam_subject.max_marks})",
        )

    # Check for existing mark record
    mark = (
        db.query(StudentMark)
        .filter_by(
            student_id=student_id,
            exam_id=exam_id,
            subject_id=subject_id,
        )
        .first()
    )

    if mark and mark.is_locked:
        raise HTTPException(
            status_code=403,
            detail="Marks are locked. Submit an edit request to modify.",
        )

    if not mark:
        mark = StudentMark(
            student_id=student_id,
            exam_id=exam_id,
            subject_id=subject_id,
            marks_obtained=marks_obtained,
            entered_by_id=user.id,
            is_locked=True,
        )
        db.add(mark)
    else:
        mark.marks_obtained = marks_obtained
        mark.entered_by_id = user.id

    db.commit()
    db.refresh(mark)
    return mark
