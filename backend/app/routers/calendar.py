"""
School Calendar Router - Working days and holidays management.

Admin sets up the calendar. Class teachers can only mark attendance on working days.
Also triggers holiday notifications to parents.
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.school_calendar import SchoolCalendar, DayType
from app.services.notification_service import create_holiday_notification, send_notification


router = APIRouter(
    prefix="/calendar",
    tags=["School Calendar"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class CalendarEntryRequest(BaseModel):
    academic_year_id: int
    date: date
    is_working_day: bool = True
    day_type: str = "REGULAR"  # REGULAR, HOLIDAY, HALF_DAY, EXAM_DAY, VACATION
    reason: Optional[str] = None
    send_notification: bool = False  # Auto-send holiday notification


class BulkCalendarRequest(BaseModel):
    academic_year_id: int
    entries: List[CalendarEntryRequest]


class CalendarEntryResponse(BaseModel):
    id: int
    date: date
    is_working_day: bool
    day_type: str
    reason: Optional[str]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Admin Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/entry")
def create_calendar_entry(
    payload: CalendarEntryRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Create a calendar entry (holiday, half-day, etc.).

    If send_notification=True, automatically sends holiday notification to parents.
    """
    try:
        day_type = DayType(payload.day_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid day_type. Must be one of: {[d.value for d in DayType]}"
        )

    # Check if entry already exists
    existing = db.query(SchoolCalendar).filter(
        SchoolCalendar.academic_year_id == payload.academic_year_id,
        SchoolCalendar.date == payload.date,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Calendar entry already exists for this date"
        )

    entry = SchoolCalendar(
        academic_year_id=payload.academic_year_id,
        date=payload.date,
        is_working_day=payload.is_working_day,
        day_type=day_type.value,
        reason=payload.reason,
        created_by_id=user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    notification_sent = False

    # Send holiday notification if requested
    if payload.send_notification and not payload.is_working_day:
        notification = create_holiday_notification(
            db,
            calendar_entry=entry,
            created_by_id=user.id,
        )
        send_notification(db, notification_id=notification.id)
        notification_sent = True

    return {
        "status": "calendar_entry_created",
        "entry_id": entry.id,
        "date": entry.date,
        "day_type": entry.day_type,
        "notification_sent": notification_sent,
    }


@router.post("/bulk")
def create_bulk_calendar_entries(
    payload: BulkCalendarRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Create multiple calendar entries at once.

    Useful for setting up vacation periods or known holidays.
    """
    created = 0
    skipped = 0

    for entry_data in payload.entries:
        existing = db.query(SchoolCalendar).filter(
            SchoolCalendar.academic_year_id == payload.academic_year_id,
            SchoolCalendar.date == entry_data.date,
        ).first()

        if existing:
            skipped += 1
            continue

        try:
            day_type = DayType(entry_data.day_type)
        except ValueError:
            day_type = DayType.REGULAR

        entry = SchoolCalendar(
            academic_year_id=payload.academic_year_id,
            date=entry_data.date,
            is_working_day=entry_data.is_working_day,
            day_type=day_type.value,
            reason=entry_data.reason,
            created_by_id=user.id,
        )
        db.add(entry)
        created += 1

    db.commit()

    return {
        "status": "bulk_entries_created",
        "created": created,
        "skipped": skipped,
    }


@router.put("/entry/{entry_id}")
def update_calendar_entry(
    entry_id: int,
    is_working_day: Optional[bool] = None,
    day_type: Optional[str] = None,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Update a calendar entry.
    """
    entry = db.get(SchoolCalendar, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    if is_working_day is not None:
        entry.is_working_day = is_working_day
    if day_type is not None:
        try:
            entry.day_type = DayType(day_type).value
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid day_type")
    if reason is not None:
        entry.reason = reason

    db.commit()
    db.refresh(entry)

    return {
        "status": "entry_updated",
        "entry_id": entry.id,
        "date": entry.date,
        "is_working_day": entry.is_working_day,
        "day_type": entry.day_type,
    }


@router.delete("/entry/{entry_id}")
def delete_calendar_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Delete a calendar entry.
    """
    entry = db.get(SchoolCalendar, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    db.delete(entry)
    db.commit()

    return {"status": "entry_deleted"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# View Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/year/{academic_year_id}")
def get_calendar_for_year(
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get full calendar for an academic year.
    """
    entries = db.query(SchoolCalendar).filter(
        SchoolCalendar.academic_year_id == academic_year_id,
    ).order_by(SchoolCalendar.date).all()

    return {
        "academic_year_id": academic_year_id,
        "entries": [
            {
                "id": e.id,
                "date": e.date,
                "is_working_day": e.is_working_day,
                "day_type": e.day_type,
                "reason": e.reason,
            }
            for e in entries
        ],
        "total_entries": len(entries),
    }


@router.get("/year/{academic_year_id}/holidays")
def get_holidays(
    academic_year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get only holidays for an academic year.
    """
    holidays = db.query(SchoolCalendar).filter(
        SchoolCalendar.academic_year_id == academic_year_id,
        SchoolCalendar.is_working_day.is_(False),
    ).order_by(SchoolCalendar.date).all()

    return {
        "academic_year_id": academic_year_id,
        "holidays": [
            {
                "date": h.date,
                "reason": h.reason,
                "day_type": h.day_type,
            }
            for h in holidays
        ],
        "total_holidays": len(holidays),
    }


@router.get("/year/{academic_year_id}/month/{month}")
def get_calendar_for_month(
    academic_year_id: int,
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get calendar for a specific month.
    """
    from datetime import date as date_type

    start_date = date_type(year, month, 1)
    if month == 12:
        end_date = date_type(year + 1, 1, 1)
    else:
        end_date = date_type(year, month + 1, 1)

    entries = db.query(SchoolCalendar).filter(
        SchoolCalendar.academic_year_id == academic_year_id,
        SchoolCalendar.date >= start_date,
        SchoolCalendar.date < end_date,
    ).order_by(SchoolCalendar.date).all()

    return {
        "year": year,
        "month": month,
        "entries": [
            {
                "date": e.date,
                "is_working_day": e.is_working_day,
                "day_type": e.day_type,
                "reason": e.reason,
            }
            for e in entries
        ],
    }
