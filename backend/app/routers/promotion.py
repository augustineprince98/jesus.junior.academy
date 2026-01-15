"""
Promotion Router - Student class promotions.

Handles:
- Bulk class promotion
- Individual student promotion
- Hold back (repeat) students
- Class 8 graduation (passout)
- Bulk promote all classes for academic year transition
"""

from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.services.promotion_service import (
    promote_class,
    hold_back_student,
    graduate_class_8,
    promote_individual_student,
    get_promotion_preview,
    bulk_promote_all_classes,
)


router = APIRouter(prefix="/promotion", tags=["Promotion"])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class PromoteClassRequest(BaseModel):
    from_class_id: int
    from_academic_year_id: int
    to_class_id: int
    to_academic_year_id: int
    exclude_student_ids: Optional[List[int]] = None


class HoldBackRequest(BaseModel):
    student_id: int
    class_id: int
    from_academic_year_id: int
    to_academic_year_id: int
    reason: Optional[str] = None


class PromoteStudentRequest(BaseModel):
    student_id: int
    from_class_id: int
    from_academic_year_id: int
    to_class_id: int
    to_academic_year_id: int


class BulkPromoteRequest(BaseModel):
    from_academic_year_id: int
    to_academic_year_id: int


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/class")
def promote_whole_class(
    payload: PromoteClassRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Promote all students in a class to the next class.

    Can exclude specific students who should be held back.
    """
    result = promote_class(
        db=db,
        from_class_id=payload.from_class_id,
        from_academic_year_id=payload.from_academic_year_id,
        to_class_id=payload.to_class_id,
        to_academic_year_id=payload.to_academic_year_id,
        exclude_student_ids=payload.exclude_student_ids,
    )
    return {
        "status": "promotion_completed",
        **result,
    }


@router.post("/hold-back")
def hold_back_student_endpoint(
    payload: HoldBackRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Hold back a student to repeat the same class.

    Student stays in the same class for the next academic year.
    """
    result = hold_back_student(
        db=db,
        student_id=payload.student_id,
        class_id=payload.class_id,
        from_academic_year_id=payload.from_academic_year_id,
        to_academic_year_id=payload.to_academic_year_id,
        reason=payload.reason,
    )
    return {
        "status": "student_held_back",
        **result,
    }


@router.post("/graduate-class-8")
def graduate_class_8_endpoint(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Graduate all Class 8 students.

    Students are marked as GRADUATED and pass out of school.
    No new enrollment is created.
    """
    result = graduate_class_8(
        db=db,
        class_id=class_id,
        academic_year_id=academic_year_id,
    )
    return {
        "status": "class_8_graduated",
        **result,
    }


@router.post("/student")
def promote_single_student(
    payload: PromoteStudentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Promote a single student.

    Useful for late admissions or special cases.
    """
    result = promote_individual_student(
        db=db,
        student_id=payload.student_id,
        from_class_id=payload.from_class_id,
        from_academic_year_id=payload.from_academic_year_id,
        to_class_id=payload.to_class_id,
        to_academic_year_id=payload.to_academic_year_id,
    )
    return {
        "status": "student_promoted",
        **result,
    }


@router.get("/preview/{class_id}")
def get_class_promotion_preview(
    class_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Preview what will happen when a class is promoted.

    Shows:
    - Current class and next class
    - All students to be promoted
    - Their results (if computed)
    """
    preview = get_promotion_preview(
        db=db,
        class_id=class_id,
        academic_year_id=academic_year_id,
    )
    return preview


@router.post("/bulk-all")
def promote_all_classes(
    payload: BulkPromoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Promote all classes for academic year transition.

    This is the end-of-year bulk operation that:
    - Promotes Level I → Level II
    - Promotes Level II → Level III
    - Promotes Level III → Class 1
    - Promotes Class 1 → Class 2
    - ...
    - Promotes Class 7 → Class 8
    - Graduates Class 8 (passout)

    Creates target classes if they don't exist.
    """
    result = bulk_promote_all_classes(
        db=db,
        from_academic_year_id=payload.from_academic_year_id,
        to_academic_year_id=payload.to_academic_year_id,
    )
    return {
        "status": "bulk_promotion_completed",
        **result,
    }
