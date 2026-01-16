"""
Teacher Subject Assignment Router

Manages which teacher teaches which subject in which class.
Used to restrict homework and marks entry to assigned subjects.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.teacher_class_subject import TeacherClassSubject
from app.models.school_class import SchoolClass
from app.models.subject import Subject
from app.models.academic_year import AcademicYear

router = APIRouter(prefix="/teacher-subjects", tags=["Teacher Subject Assignment"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AssignTeacherSubjectRequest(BaseModel):
    teacher_id: int
    class_id: int
    subject_id: int
    academic_year_id: Optional[int] = None  # Uses current year if not specified


class BulkAssignRequest(BaseModel):
    teacher_id: int
    class_id: int
    subject_ids: List[int]
    academic_year_id: Optional[int] = None


class TeacherSubjectResponse(BaseModel):
    id: int
    teacher_id: int
    teacher_name: str
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str
    academic_year_id: int
    academic_year_name: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Admin Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/assign")
def assign_teacher_to_subject(
    payload: AssignTeacherSubjectRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Assign a teacher to teach a subject in a class.
    """
    # Get academic year
    if payload.academic_year_id:
        academic_year = db.get(AcademicYear, payload.academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    # Verify teacher exists and is a teacher
    teacher = db.get(User, payload.teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if teacher.role not in [Role.TEACHER.value, Role.CLASS_TEACHER.value]:
        raise HTTPException(status_code=400, detail="User is not a teacher")

    # Verify class exists
    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Verify subject exists
    subject = db.get(Subject, payload.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Check if already assigned
    existing = db.query(TeacherClassSubject).filter(
        TeacherClassSubject.teacher_id == payload.teacher_id,
        TeacherClassSubject.class_id == payload.class_id,
        TeacherClassSubject.subject_id == payload.subject_id,
        TeacherClassSubject.academic_year_id == academic_year.id,
    ).first()

    if existing:
        return {
            "status": "already_assigned",
            "message": f"{teacher.name} is already assigned to teach {subject.name} in {school_class.name}",
        }

    # Create assignment
    assignment = TeacherClassSubject(
        teacher_id=payload.teacher_id,
        class_id=payload.class_id,
        subject_id=payload.subject_id,
        academic_year_id=academic_year.id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "status": "assigned",
        "assignment_id": assignment.id,
        "teacher_name": teacher.name,
        "class_name": school_class.name,
        "subject_name": subject.name,
    }


@router.post("/assign-bulk")
def assign_teacher_multiple_subjects(
    payload: BulkAssignRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Assign a teacher to teach multiple subjects in a class.
    """
    # Get academic year
    if payload.academic_year_id:
        academic_year = db.get(AcademicYear, payload.academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    teacher = db.get(User, payload.teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    assigned = []
    skipped = []

    for subject_id in payload.subject_ids:
        subject = db.get(Subject, subject_id)
        if not subject:
            skipped.append({"subject_id": subject_id, "reason": "Subject not found"})
            continue

        existing = db.query(TeacherClassSubject).filter(
            TeacherClassSubject.teacher_id == payload.teacher_id,
            TeacherClassSubject.class_id == payload.class_id,
            TeacherClassSubject.subject_id == subject_id,
            TeacherClassSubject.academic_year_id == academic_year.id,
        ).first()

        if existing:
            skipped.append({"subject_id": subject_id, "subject_name": subject.name, "reason": "Already assigned"})
            continue

        assignment = TeacherClassSubject(
            teacher_id=payload.teacher_id,
            class_id=payload.class_id,
            subject_id=subject_id,
            academic_year_id=academic_year.id,
        )
        db.add(assignment)
        assigned.append({"subject_id": subject_id, "subject_name": subject.name})

    db.commit()

    return {
        "status": "bulk_assigned",
        "teacher_name": teacher.name,
        "class_name": school_class.name,
        "assigned": assigned,
        "skipped": skipped,
        "total_assigned": len(assigned),
    }


@router.delete("/remove/{assignment_id}")
def remove_teacher_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Remove a teacher's subject assignment."""
    assignment = db.get(TeacherClassSubject, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()

    return {"status": "removed", "assignment_id": assignment_id}


@router.get("/class/{class_id}")
def get_class_teacher_assignments(
    class_id: int,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get all teacher-subject assignments for a class."""
    if academic_year_id:
        academic_year = db.get(AcademicYear, academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        return {"assignments": [], "message": "No academic year found"}

    assignments = db.query(TeacherClassSubject).filter(
        TeacherClassSubject.class_id == class_id,
        TeacherClassSubject.academic_year_id == academic_year.id,
    ).all()

    return {
        "class_id": class_id,
        "academic_year_id": academic_year.id,
        "assignments": [
            {
                "id": a.id,
                "teacher_id": a.teacher_id,
                "teacher_name": a.teacher.name,
                "subject_id": a.subject_id,
                "subject_name": a.subject.name,
            }
            for a in assignments
        ],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Teacher Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/my-assignments")
def get_my_assignments(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    [TEACHER] Get my subject-class assignments.

    Returns list of classes and subjects the teacher is assigned to teach.
    """
    if user.role not in [Role.TEACHER.value, Role.CLASS_TEACHER.value]:
        raise HTTPException(status_code=403, detail="Only teachers can view this")

    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not current_year:
        return {"assignments": [], "message": "No current academic year"}

    assignments = db.query(TeacherClassSubject).filter(
        TeacherClassSubject.teacher_id == user.id,
        TeacherClassSubject.academic_year_id == current_year.id,
    ).all()

    # Group by class
    classes_dict = {}
    for a in assignments:
        if a.class_id not in classes_dict:
            classes_dict[a.class_id] = {
                "class_id": a.class_id,
                "class_name": a.school_class.name,
                "subjects": [],
            }
        classes_dict[a.class_id]["subjects"].append({
            "subject_id": a.subject_id,
            "subject_name": a.subject.name,
        })

    return {
        "teacher_id": user.id,
        "teacher_name": user.name,
        "academic_year": current_year.name,
        "classes": list(classes_dict.values()),
    }


def is_teacher_assigned_to_subject(
    db: Session,
    teacher_id: int,
    class_id: int,
    subject_id: int,
    academic_year_id: int,
) -> bool:
    """
    Helper function to check if a teacher is assigned to teach a subject in a class.
    Used by homework and marks entry to validate permissions.
    """
    assignment = db.query(TeacherClassSubject).filter(
        TeacherClassSubject.teacher_id == teacher_id,
        TeacherClassSubject.class_id == class_id,
        TeacherClassSubject.subject_id == subject_id,
        TeacherClassSubject.academic_year_id == academic_year_id,
    ).first()

    return assignment is not None
