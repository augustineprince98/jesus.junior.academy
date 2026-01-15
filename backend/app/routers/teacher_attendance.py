"""Teacher Biometric Attendance Router"""

from datetime import date, time, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.teacher_attendance import TeacherAttendance

router = APIRouter(prefix="/teacher-attendance", tags=["Teacher Attendance"])


class CheckInRequest(BaseModel):
    remarks: Optional[str] = None


class CheckOutRequest(BaseModel):
    remarks: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    teacher_id: int
    date: date
    check_in_time: Optional[time]
    check_out_time: Optional[time]
    status: str


@router.post("/check-in")
def check_in(
    payload: CheckInRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Teacher checks in for the day."""
    if not user.teacher_id:
        raise HTTPException(status_code=400, detail="User not linked to teacher record")

    today = date.today()
    existing = db.query(TeacherAttendance).filter(
        TeacherAttendance.teacher_id == user.teacher_id,
        TeacherAttendance.date == today,
    ).first()

    if existing and existing.check_in_time:
        raise HTTPException(status_code=400, detail="Already checked in today")

    if existing:
        existing.check_in_time = datetime.now().time()
        existing.status = "PRESENT"
    else:
        existing = TeacherAttendance(
            teacher_id=user.teacher_id,
            date=today,
            check_in_time=datetime.now().time(),
            status="PRESENT",
            remarks=payload.remarks,
        )
        db.add(existing)

    db.commit()
    return {"status": "checked_in", "time": existing.check_in_time}


@router.post("/check-out")
def check_out(
    payload: CheckOutRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Teacher checks out for the day."""
    if not user.teacher_id:
        raise HTTPException(status_code=400, detail="User not linked to teacher record")

    today = date.today()
    record = db.query(TeacherAttendance).filter(
        TeacherAttendance.teacher_id == user.teacher_id,
        TeacherAttendance.date == today,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="No check-in found for today")

    if record.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out today")

    record.check_out_time = datetime.now().time()
    if payload.remarks:
        record.remarks = payload.remarks
    db.commit()

    return {"status": "checked_out", "time": record.check_out_time}


@router.get("/my-history")
def get_my_attendance_history(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get own attendance history."""
    if not user.teacher_id:
        raise HTTPException(status_code=400, detail="User not linked to teacher record")

    query = db.query(TeacherAttendance).filter(
        TeacherAttendance.teacher_id == user.teacher_id
    )

    if month and year:
        from datetime import date as d
        start = d(year, month, 1)
        if month == 12:
            end = d(year + 1, 1, 1)
        else:
            end = d(year, month + 1, 1)
        query = query.filter(
            TeacherAttendance.date >= start,
            TeacherAttendance.date < end,
        )

    records = query.order_by(TeacherAttendance.date.desc()).limit(60).all()

    return {
        "records": [
            {
                "date": r.date,
                "check_in": r.check_in_time,
                "check_out": r.check_out_time,
                "status": r.status,
            }
            for r in records
        ]
    }


@router.get("/report")
def get_attendance_report(
    teacher_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Get teacher attendance report."""
    query = db.query(TeacherAttendance)

    if teacher_id:
        query = query.filter(TeacherAttendance.teacher_id == teacher_id)
    if from_date:
        query = query.filter(TeacherAttendance.date >= from_date)
    if to_date:
        query = query.filter(TeacherAttendance.date <= to_date)

    records = query.order_by(TeacherAttendance.date.desc()).all()

    return {
        "records": [
            {
                "teacher_id": r.teacher_id,
                "date": r.date,
                "check_in": r.check_in_time,
                "check_out": r.check_out_time,
                "status": r.status,
                "remarks": r.remarks,
            }
            for r in records
        ],
        "total": len(records),
    }


@router.post("/mark-absent")
def mark_teacher_absent(
    teacher_id: int,
    absent_date: date,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """[ADMIN] Mark a teacher as absent."""
    existing = db.query(TeacherAttendance).filter(
        TeacherAttendance.teacher_id == teacher_id,
        TeacherAttendance.date == absent_date,
    ).first()

    if existing:
        existing.status = "ABSENT"
        existing.remarks = reason
    else:
        existing = TeacherAttendance(
            teacher_id=teacher_id,
            date=absent_date,
            status="ABSENT",
            remarks=reason,
        )
        db.add(existing)

    db.commit()
    return {"status": "marked_absent"}
