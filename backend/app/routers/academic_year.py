"""
Academic Year Management Router - Admin panel for managing academic years.

Allows admins to:
- Create new academic years
- Set the current active year
- View all academic years
- Update year details
- Delete unused years
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user, require_role_at_least
from app.core.roles import Role
from app.models.user import User
from app.models.academic_year import AcademicYear


router = APIRouter(
    prefix="/academic-years",
    tags=["Academic Year Management"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Schemas
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class AcademicYearCreate(BaseModel):
    year: str  # Format: "2025-2026"
    is_active: bool = False

    @validator('year')
    def validate_year_format(cls, v):
        if not v or len(v) != 9:
            raise ValueError('Year must be in format "YYYY-YYYY" (e.g., "2025-2026")')

        parts = v.split('-')
        if len(parts) != 2:
            raise ValueError('Year must contain exactly one hyphen')

        try:
            start_year = int(parts[0])
            end_year = int(parts[1])

            if end_year != start_year + 1:
                raise ValueError('End year must be exactly one year after start year')

            if start_year < 2000 or start_year > 2100:
                raise ValueError('Start year must be between 2000 and 2100')

        except ValueError as e:
            if 'invalid literal for int()' in str(e):
                raise ValueError('Both parts must be valid years')
            raise

        return v


class AcademicYearUpdate(BaseModel):
    year: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('year')
    def validate_year_format(cls, v):
        if v is None:
            return v
        return AcademicYearCreate.validate_year_format(None, v)


class AcademicYearResponse(BaseModel):
    id: int
    year: str
    is_active: bool
    classes_count: int = 0
    enrollments_count: int = 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Admin Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
def create_academic_year(
    payload: AcademicYearCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Create a new academic year.

    If is_active=True, it will deactivate all other years first.
    """
    # Check if year already exists
    existing = db.query(AcademicYear).filter(AcademicYear.year == payload.year).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Academic year {payload.year} already exists"
        )

    # If setting as current, deactivate all others
    if payload.is_current:
        db.query(AcademicYear).update({"is_current": False})

    academic_year = AcademicYear(
        year=payload.year,
        is_current=payload.is_current,
    )
    db.add(academic_year)
    db.commit()
    db.refresh(academic_year)

    return AcademicYearResponse(
        id=academic_year.id,
        year=academic_year.year,
        is_current=academic_year.is_current,
        classes_count=len(academic_year.classes),
        enrollments_count=len(academic_year.enrollments),
    )


@router.get("/", response_model=List[AcademicYearResponse])
def get_all_academic_years(
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Get all academic years with usage statistics.
    """
    years = db.query(AcademicYear).all()

    return [
        AcademicYearResponse(
            id=year.id,
            year=year.year,
            is_current=year.is_current,
            classes_count=len(year.classes),
            enrollments_count=len(year.enrollments),
        )
        for year in years
    ]


@router.get("/current")
def get_current_academic_year(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Get the currently active academic year.

    Available to all authenticated users.
    """
    current_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    if not current_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active academic year found. Please contact administrator."
        )

    return {
        "id": current_year.id,
        "year": current_year.year,
        "is_current": True,
    }


@router.put("/{year_id}", response_model=AcademicYearResponse)
def update_academic_year(
    year_id: int,
    payload: AcademicYearUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Update an academic year.

    If setting is_active=True, it will deactivate all other years.
    Cannot change year if it has associated data.
    """
    academic_year = db.get(AcademicYear, year_id)
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )

    # Prevent changing year name if it has associated data
    if payload.year and payload.year != academic_year.year:
        if academic_year.classes or academic_year.enrollments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change year name - it has associated classes or enrollments"
            )

        # Check if new year name already exists
        existing = db.query(AcademicYear).filter(
            AcademicYear.year == payload.year,
            AcademicYear.id != year_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Academic year {payload.year} already exists"
            )

        academic_year.year = payload.year

    # Handle activation/deactivation
    if payload.is_current is not None:
        if payload.is_current:
            # Deactivate all others
            db.query(AcademicYear).filter(AcademicYear.id != year_id).update({"is_current": False})

        academic_year.is_current = payload.is_current

    db.commit()
    db.refresh(academic_year)

    return AcademicYearResponse(
        id=academic_year.id,
        year=academic_year.year,
        is_current=academic_year.is_current,
        classes_count=len(academic_year.classes),
        enrollments_count=len(academic_year.enrollments),
    )


@router.delete("/{year_id}")
def delete_academic_year(
    year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Delete an academic year.

    Only allowed if no associated classes or enrollments exist.
    """
    academic_year = db.get(AcademicYear, year_id)
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )

    # Check for associated data
    if academic_year.classes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete - {len(academic_year.classes)} classes are associated with this year"
        )

    if academic_year.enrollments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete - {len(academic_year.enrollments)} enrollments are associated with this year"
        )

    db.delete(academic_year)
    db.commit()

    return {"status": "academic_year_deleted", "year": academic_year.year}


@router.post("/{year_id}/set-active")
def set_academic_year_active(
    year_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role_at_least(Role.ADMIN)),
):
    """
    [ADMIN] Set a specific academic year as active.

    Deactivates all other years automatically.
    """
    academic_year = db.get(AcademicYear, year_id)
    if not academic_year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found"
        )

    # Deactivate all years
    db.query(AcademicYear).update({"is_current": False})

    # Activate the selected year
    academic_year.is_current = True
    db.commit()

    return {
        "status": "academic_year_activated",
        "year_id": academic_year.id,
        "year": academic_year.year,
    }
