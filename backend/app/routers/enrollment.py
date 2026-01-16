from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.auth import require_roles, require_role_at_least
from app.core.roles import Role
from app.models.enrollment import Enrollment
from app.models.school_class import SchoolClass
from app.models.academic_year import AcademicYear
from app.models.people import Student
from app.models.user import User

router = APIRouter(
    prefix="/enrollment",
    tags=["Enrollment"],
)


# ==================== PUBLIC ENDPOINTS ====================

@router.get("/classes")
def get_classes_public(
    db: Session = Depends(get_db),
):
    """[PUBLIC] Get list of classes for registration dropdown."""
    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not current_year:
        return {"classes": [], "academic_year": None}

    classes = db.query(SchoolClass).filter(
        SchoolClass.academic_year_id == current_year.id
    ).order_by(SchoolClass.name).all()

    return {
        "classes": [
            {"id": c.id, "name": c.name}
            for c in classes
        ],
        "academic_year": {
            "id": current_year.id,
            "name": current_year.name,
        }
    }


@router.get("/academic-years")
def get_academic_years(
    db: Session = Depends(get_db),
):
    """[PUBLIC] Get list of academic years."""
    years = db.query(AcademicYear).order_by(AcademicYear.id.desc()).all()

    return {
        "academic_years": [
            {"id": y.id, "name": y.name, "is_current": y.is_current}
            for y in years
        ]
    }


# ==================== ADMIN ENDPOINTS ====================

class EnrollStudentRequest(BaseModel):
    student_id: int
    class_id: int
    academic_year_id: int
    roll_number: Optional[int] = None


class AssignUserToClassRequest(BaseModel):
    """Assign a user to a class (creates Student + Enrollment if needed)"""
    user_id: int
    class_id: int
    academic_year_id: Optional[int] = None  # Uses current year if not specified
    student_name: Optional[str] = None  # Uses user name if not specified
    dob: Optional[str] = None  # Date of birth (YYYY-MM-DD)
    gender: Optional[str] = "Not Specified"


@router.post("/assign")
def enroll_student(
    student_id: int,
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(Role.ADMIN)),
):
    """[ADMIN] Enroll an existing student in a class."""
    enrollment = Enrollment(
        student_id=student_id,
        class_id=class_id,
        academic_year_id=academic_year_id,
    )
    db.add(enrollment)
    db.commit()
    return {"status": "enrolled"}


@router.post("/assign-user-to-class")
def assign_user_to_class(
    payload: AssignUserToClassRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Assign a user to a class.

    This will:
    1. Create a Student record if the user doesn't have one
    2. Link the User to the Student
    3. Create an Enrollment for the current academic year
    """
    from datetime import date

    # Get the user
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify the class exists
    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    # Get academic year (use specified or current)
    if payload.academic_year_id:
        academic_year = db.get(AcademicYear, payload.academic_year_id)
    else:
        academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not academic_year:
        raise HTTPException(status_code=400, detail="No academic year found")

    # Check if user already has a student record
    if user.student_id:
        student = db.get(Student, user.student_id)
    else:
        # Create new student record
        student = Student(
            name=payload.student_name or user.name,
            dob=date.fromisoformat(payload.dob) if payload.dob else date(2010, 1, 1),
            gender=payload.gender or "Not Specified",
        )
        db.add(student)
        db.flush()  # Get the student ID

        # Link user to student
        user.student_id = student.id

    # Check if already enrolled in this academic year
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.academic_year_id == academic_year.id,
    ).first()

    if existing_enrollment:
        # Update the class if different
        if existing_enrollment.class_id != payload.class_id:
            existing_enrollment.class_id = payload.class_id
            db.commit()
            return {
                "status": "class_updated",
                "user_id": user.id,
                "student_id": student.id,
                "class_id": payload.class_id,
                "class_name": school_class.name,
            }
        else:
            return {
                "status": "already_enrolled",
                "user_id": user.id,
                "student_id": student.id,
                "class_id": payload.class_id,
                "class_name": school_class.name,
            }

    # Create enrollment
    enrollment = Enrollment(
        student_id=student.id,
        class_id=payload.class_id,
        academic_year_id=academic_year.id,
        status="ACTIVE",
    )
    db.add(enrollment)
    db.commit()

    return {
        "status": "enrolled",
        "user_id": user.id,
        "student_id": student.id,
        "class_id": payload.class_id,
        "class_name": school_class.name,
        "academic_year": academic_year.name,
    }


@router.get("/user/{user_id}/class")
def get_user_class(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get the class assignment for a user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.student_id:
        return {"user_id": user_id, "class": None, "message": "User is not linked to a student"}

    # Get current academic year
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not current_year:
        return {"user_id": user_id, "class": None, "message": "No current academic year"}

    # Get enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == user.student_id,
        Enrollment.academic_year_id == current_year.id,
    ).first()

    if not enrollment:
        return {"user_id": user_id, "class": None, "message": "Not enrolled in current year"}

    return {
        "user_id": user_id,
        "student_id": user.student_id,
        "class": {
            "id": enrollment.school_class.id,
            "name": enrollment.school_class.name,
        },
        "academic_year": current_year.name,
        "roll_number": enrollment.roll_number,
    }
