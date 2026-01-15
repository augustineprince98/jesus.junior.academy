"""
Attendance Router - Class teacher marks daily attendance.

Features:
- Bulk attendance marking for entire class
- Working day validation (can't mark on holidays)
- Attendance summary and reports
- Absent student notifications
"""

from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles, require_role_at_least
from app.core.roles import Role
from app.core.class_teacher import require_class_teacher
from app.models.user import User
from app.models.school_class import SchoolClass
from app.services.attendance_service import (
    mark_bulk_attendance,
    get_attendance_summary,
    get_class_attendance_for_date,
    get_absent_students,
    get_students_below_threshold,
    is_working_day,
)


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AttendanceRecord(BaseModel):
    student_id: int
    is_present: bool


class BulkAttendanceRequest(BaseModel):
    class_id: int
    academic_year_id: int
    date: date
    records: List[AttendanceRecord]


class AttendanceSummaryResponse(BaseModel):
    student_id: int
    academic_year_id: int
    total_working_days: int
    days_present: int
    days_absent: int
    attendance_percentage: float


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/mark-bulk")
def mark_class_attendance(
    payload: BulkAttendanceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    [CLASS_TEACHER] Mark attendance for entire class in bulk.

    - Only works on working days (not holidays/Sundays)
    - Can only be marked once per day per class
    - All students must be enrolled in the class
    """
    # Verify user is class teacher for this class
    school_class = db.get(SchoolClass, payload.class_id)
    if not school_class:
        raise HTTPException(status_code=404, detail="Class not found")

    if user.role != Role.ADMIN.value and school_class.class_teacher_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the class teacher for this class"
        )

    # Convert pydantic models to dicts
    records = [{"student_id": r.student_id, "is_present": r.is_present} for r in payload.records]

    result = mark_bulk_attendance(
        db,
        class_id=payload.class_id,
        academic_year_id=payload.academic_year_id,
        date=payload.date,
        records=records,
        marked_by_id=user.id,
    )

    return {
        "status": "attendance_marked",
        "summary": result,
    }


@router.get("/check-working-day")
def check_working_day(
    academic_year_id: int,
    check_date: date,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Check if a date is a working day.

    Returns whether attendance can be marked on this date.
    """
    is_working, reason = is_working_day(db, academic_year_id=academic_year_id, date=check_date)
    return {
        "date": check_date,
        "is_working_day": is_working,
        "reason": reason,
    }


@router.get("/student/{student_id}/summary")
def get_student_attendance_summary(
    student_id: int,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get attendance summary for a student.

    Shows total days, present days, absent days, and percentage.
    """
    summary = get_attendance_summary(
        db,
        student_id=student_id,
        academic_year_id=academic_year_id,
    )
    return summary


@router.get("/class/{class_id}/date/{check_date}")
def get_class_attendance(
    class_id: int,
    check_date: date,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [CLASS_TEACHER/ADMIN] Get attendance records for a class on a specific date.
    """
    records = get_class_attendance_for_date(
        db,
        class_id=class_id,
        academic_year_id=academic_year_id,
        date=check_date,
    )
    return {
        "class_id": class_id,
        "date": check_date,
        "records": records,
        "total_students": len(records),
    }


@router.get("/class/{class_id}/absent/{check_date}")
def get_absent_students_list(
    class_id: int,
    check_date: date,
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [CLASS_TEACHER/ADMIN] Get list of absent students for a date.

    Useful for sending absence notifications to parents.
    """
    absent_ids = get_absent_students(
        db,
        class_id=class_id,
        academic_year_id=academic_year_id,
        date=check_date,
    )
    return {
        "class_id": class_id,
        "date": check_date,
        "absent_student_ids": absent_ids,
        "total_absent": len(absent_ids),
    }


@router.get("/class/{class_id}/below-threshold")
def get_low_attendance_students(
    class_id: int,
    academic_year_id: int,
    threshold: float = 75.0,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.CLASS_TEACHER)),
):
    """
    [CLASS_TEACHER/ADMIN] Get students with attendance below threshold.

    Default threshold is 75%.
    """
    students = get_students_below_threshold(
        db,
        class_id=class_id,
        academic_year_id=academic_year_id,
        threshold_percentage=threshold,
    )
    return {
        "class_id": class_id,
        "academic_year_id": academic_year_id,
        "threshold_percentage": threshold,
        "students_below_threshold": students,
        "count": len(students),
    }
