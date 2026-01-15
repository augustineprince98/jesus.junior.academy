"""
Attendance Service - Bulk attendance marking with working days validation.

Features:
- Validates attendance can only be marked on working days
- Bulk marking for entire class
- Attendance summary and percentage calculation
- Absent student notification triggers
"""

from datetime import date as date_type
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException

from app.models.attendance import Attendance
from app.models.school_class import SchoolClass
from app.models.school_calendar import SchoolCalendar, DayType
from app.models.enrollment import Enrollment


def is_working_day(db: Session, *, academic_year_id: int, date: date_type) -> tuple[bool, str | None]:
    """
    Check if a date is a working day.

    Returns:
        (is_working, reason) - reason is set if not a working day
    """
    calendar_entry = db.query(SchoolCalendar).filter(
        SchoolCalendar.academic_year_id == academic_year_id,
        SchoolCalendar.date == date,
    ).first()

    if not calendar_entry:
        # No entry means it's a regular working day (unless weekend)
        if date.weekday() == 6:  # Sunday
            return False, "Sunday - school closed"
        return True, None

    if not calendar_entry.is_working_day:
        return False, calendar_entry.reason or f"Holiday: {calendar_entry.day_type}"

    return True, None


def mark_bulk_attendance(
    db: Session,
    *,
    class_id: int,
    academic_year_id: int,
    date: date_type,
    records: list[dict],
    marked_by_id: int,
):
    """
    Mark attendance for entire class in bulk.

    Args:
        class_id: The class ID
        academic_year_id: The academic year ID
        date: The date for attendance
        records: List of {student_id: int, is_present: bool}
        marked_by_id: The user ID who is marking attendance

    Raises:
        HTTPException: If not a working day or already marked
    """
    # Check if it's a working day
    is_working, reason = is_working_day(db, academic_year_id=academic_year_id, date=date)
    if not is_working:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot mark attendance: {reason}"
        )

    # Check if attendance already marked for this class today
    existing = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.academic_year_id == academic_year_id,
        Attendance.date == date,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this class on this date"
        )

    # Validate all students are enrolled in this class
    student_ids = [r["student_id"] for r in records]
    enrolled_students = db.query(Enrollment.student_id).filter(
        Enrollment.class_id == class_id,
        Enrollment.academic_year_id == academic_year_id,
        Enrollment.status == "ACTIVE",
    ).all()
    enrolled_ids = {e.student_id for e in enrolled_students}

    invalid_students = set(student_ids) - enrolled_ids
    if invalid_students:
        raise HTTPException(
            status_code=400,
            detail=f"Students not enrolled in this class: {invalid_students}"
        )

    # Mark attendance for all students
    for record in records:
        attendance = Attendance(
            student_id=record["student_id"],
            class_id=class_id,
            academic_year_id=academic_year_id,
            date=date,
            is_present=record["is_present"],
        )
        db.add(attendance)

    db.commit()

    # Return summary
    present_count = sum(1 for r in records if r["is_present"])
    absent_count = len(records) - present_count

    return {
        "date": date,
        "class_id": class_id,
        "total_students": len(records),
        "present": present_count,
        "absent": absent_count,
    }


def get_attendance_summary(
    db: Session,
    *,
    student_id: int,
    academic_year_id: int,
):
    """Get attendance summary for a student."""
    total_days = db.query(func.count(Attendance.id)).filter(
        Attendance.student_id == student_id,
        Attendance.academic_year_id == academic_year_id,
    ).scalar() or 0

    present_days = db.query(func.count(Attendance.id)).filter(
        Attendance.student_id == student_id,
        Attendance.academic_year_id == academic_year_id,
        Attendance.is_present.is_(True),
    ).scalar() or 0

    absent_days = total_days - present_days
    percentage = round((present_days / total_days * 100), 2) if total_days > 0 else 0.0

    return {
        "student_id": student_id,
        "academic_year_id": academic_year_id,
        "total_working_days": total_days,
        "days_present": present_days,
        "days_absent": absent_days,
        "attendance_percentage": percentage,
    }


def get_class_attendance_for_date(
    db: Session,
    *,
    class_id: int,
    academic_year_id: int,
    date: date_type,
):
    """Get attendance records for a class on a specific date."""
    records = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.academic_year_id == academic_year_id,
        Attendance.date == date,
    ).all()

    return [
        {
            "student_id": r.student_id,
            "is_present": r.is_present,
        }
        for r in records
    ]


def get_absent_students(
    db: Session,
    *,
    class_id: int,
    academic_year_id: int,
    date: date_type,
):
    """Get list of absent students for notification purposes."""
    absent = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.academic_year_id == academic_year_id,
        Attendance.date == date,
        Attendance.is_present.is_(False),
    ).all()

    return [a.student_id for a in absent]


def get_students_below_threshold(
    db: Session,
    *,
    class_id: int,
    academic_year_id: int,
    threshold_percentage: float = 75.0,
):
    """
    Get students whose attendance is below threshold.

    Used for:
    - Fee deduction eligibility
    - Promotion eligibility
    - Parent alerts
    """
    # Get all enrolled students
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id,
        Enrollment.academic_year_id == academic_year_id,
        Enrollment.status == "ACTIVE",
    ).all()

    below_threshold = []

    for enrollment in enrollments:
        summary = get_attendance_summary(
            db,
            student_id=enrollment.student_id,
            academic_year_id=academic_year_id,
        )

        if summary["attendance_percentage"] < threshold_percentage:
            below_threshold.append({
                "student_id": enrollment.student_id,
                "roll_number": enrollment.roll_number,
                "attendance_percentage": summary["attendance_percentage"],
                "days_present": summary["days_present"],
                "total_working_days": summary["total_working_days"],
            })

    return below_threshold
