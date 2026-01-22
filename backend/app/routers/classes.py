"""
Class Management Router - Admin only

Handles:
- Creating and managing school classes
- Assigning subjects to classes
- Managing exams for classes
- Class-subject relationships
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.core.auth import require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.school_class import SchoolClass
from app.models.class_subject import ClassSubject
from app.models.subject import Subject
from app.models.exam import Exam
from app.models.academic_year import AcademicYear

router = APIRouter(prefix="/admin/classes", tags=["Admin - Class Management"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ClassCreate(BaseModel):
    name: str
    section: Optional[str] = None
    academic_year_id: int


class SubjectAssignment(BaseModel):
    subject_id: int
    academic_year_id: int


class ExamCreate(BaseModel):
    name: str
    exam_type: str  # "MID_TERM", "FINAL", "UNIT_TEST", etc.
    academic_year_id: int
    exam_date: Optional[date] = None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Class Management
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/")
def create_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """Create a new school class."""
    # Check if academic year exists
    academic_year = db.get(AcademicYear, payload.academic_year_id)
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    # Check if class name already exists for this academic year
    existing = db.query(SchoolClass).filter(
        SchoolClass.name == payload.name,
        SchoolClass.academic_year_id == payload.academic_year_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class already exists for this academic year")

    school_class = SchoolClass(
        name=payload.name,
        section=payload.section,
        academic_year_id=payload.academic_year_id,
    )
    db.add(school_class)
    db.commit()
    db.refresh(school_class)

    return {
        "status": "class_created",
        "class_id": school_class.id,
        "message": f"Class {school_class.name} created successfully"
    }


@router.get("/")
def list_classes(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """List all classes with optional academic year filter."""
    query = db.query(SchoolClass)

    if academic_year_id:
        query = query.filter(SchoolClass.academic_year_id == academic_year_id)

    classes = query.all()

    result = []
    for cls in classes:
        class_teacher_name = None
        if cls.class_teacher_id:
            teacher = db.query(User).filter(User.teacher_id == cls.class_teacher_id).first()
            class_teacher_name = teacher.name if teacher else None

        result.append({
            "id": cls.id,
            "name": cls.name,
            "section": cls.section,
            "academic_year_id": cls.academic_year_id,
            "academic_year_name": cls.academic_year.year,
            "class_teacher_name": class_teacher_name,
        })

    return {"classes": result, "total": len(result)}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Subject Assignment to Classes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/{class_id}/subjects")
def assign_subject_to_class(
    class_id: int,
    payload: SubjectAssignment,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """Assign a subject to a class for a specific academic year."""
    # Validate class exists
    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Validate subject exists
    subject = db.get(Subject, payload.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Check if already assigned
    existing = db.query(ClassSubject).filter(
        ClassSubject.class_id == class_id,
        ClassSubject.subject_id == payload.subject_id,
        ClassSubject.academic_year_id == payload.academic_year_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Subject already assigned to this class")

    assignment = ClassSubject(
        class_id=class_id,
        subject_id=payload.subject_id,
        academic_year_id=payload.academic_year_id,
    )
    db.add(assignment)
    db.commit()

    return {
        "status": "subject_assigned",
        "class_id": class_id,
        "subject_id": payload.subject_id,
        "subject_name": subject.name
    }


@router.get("/{class_id}/subjects")
def get_class_subjects(
    class_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """Get all subjects assigned to a class."""
    query = db.query(ClassSubject).filter(ClassSubject.class_id == class_id)

    if academic_year_id:
        query = query.filter(ClassSubject.academic_year_id == academic_year_id)

    assignments = query.all()

    result = []
    for assignment in assignments:
        result.append({
            "assignment_id": assignment.id,
            "subject_id": assignment.subject_id,
            "subject_name": assignment.subject.name,
            "academic_year_id": assignment.academic_year_id,
            "academic_year_name": assignment.academic_year.year,
        })

    return {"subjects": result, "total": len(result)}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Exam Management for Classes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/{class_id}/exams")
def create_exam_for_class(
    class_id: int,
    payload: ExamCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """Create an exam for a specific class."""
    # Validate class exists
    school_class = db.get(SchoolClass, class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    exam = Exam(
        name=payload.name,
        exam_type=payload.exam_type,
        academic_year_id=payload.academic_year_id,
        class_id=class_id,
        exam_date=payload.exam_date,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    return {
        "status": "exam_created",
        "exam_id": exam.id,
        "class_id": class_id,
        "exam_name": exam.name
    }


@router.get("/{class_id}/exams")
def get_class_exams(
    class_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """Get all exams for a class."""
    query = db.query(Exam).filter(Exam.class_id == class_id)

    if academic_year_id:
        query = query.filter(Exam.academic_year_id == academic_year_id)

    exams = query.all()

    result = []
    for exam in exams:
        result.append({
            "id": exam.id,
            "name": exam.name,
            "exam_type": exam.exam_type,
            "academic_year_name": exam.academic_year.year,
            "exam_date": exam.exam_date,
            "class_name": exam.school_class.name,
        })

    return {"exams": result, "total": len(exams)}
