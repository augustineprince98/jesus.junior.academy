"""
Public Registration Router

Allows new users to register for accounts which require admin approval.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
import re

from app.core.database import get_db
from app.core.security import hash_password
from app.core.rate_limit import rate_limit
from app.core.roles import Role
from app.models.user import User, ApprovalStatus
from app.models.people import Student
from app.models.enrollment import Enrollment
from app.models.school_class import SchoolClass
from app.models.academic_year import AcademicYear
from datetime import date
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/register", tags=["Registration"])


class RegistrationRequest(BaseModel):
    """Public registration request"""
    name: str
    phone: str
    password: str
    email: Optional[EmailStr] = None
    role: str  # PARENT or STUDENT only for public registration
    class_id: Optional[int] = None  # Required for STUDENT role
    dob: Optional[str] = None  # Date of birth for students (YYYY-MM-DD)
    gender: Optional[str] = None  # Gender for students
    father_name: Optional[str] = None  # Required for students
    mother_name: Optional[str] = None  # Required for students

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        # Remove any non-digit characters
        digits = re.sub(r"\D", "", v)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Phone number must be 10-15 digits")
        return digits

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        allowed_roles = [Role.PARENT.value, Role.STUDENT.value]
        if v.upper() not in allowed_roles:
            raise ValueError(f"Public registration only allowed for roles: {allowed_roles}")
        return v.upper()


class RegistrationResponse(BaseModel):
    """Response after successful registration"""
    status: str
    message: str
    user_id: int


@router.post("/", response_model=RegistrationResponse)
@rate_limit(max_requests=3, window_seconds=3600)  # 3 registrations per hour per IP
async def register_user(
    request: Request,
    payload: RegistrationRequest,
    db: Session = Depends(get_db),
):
    """
    Public user registration endpoint.

    - Only PARENT and STUDENT roles can self-register
    - Account requires admin approval before login is allowed
    - Duplicate phone numbers are not allowed
    """
    # Check for existing phone
    existing = db.query(User).filter(User.phone == payload.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # Check for existing email if provided
    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # For STUDENT role, validate required fields
    school_class = None
    academic_year = None
    if payload.role == Role.STUDENT.value:
        # Father's name and mother's name are required for students
        if not payload.father_name or not payload.father_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Father's name is required for student registration",
            )
        if not payload.mother_name or not payload.mother_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mother's name is required for student registration",
            )

        if payload.class_id:
            school_class = db.get(SchoolClass, payload.class_id)
            if not school_class:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid class selected",
                )
            # Get current academic year
            academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    # Create new user with pending approval
    new_user = User(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
        is_approved=False,
        approval_status=ApprovalStatus.PENDING,
    )

    db.add(new_user)
    db.flush()  # Get user ID

    # For STUDENT role with class_id, create Student and Enrollment records
    if payload.role == Role.STUDENT.value and school_class and academic_year:
        # Create student record with parent information
        student = Student(
            name=payload.name,
            dob=date.fromisoformat(payload.dob) if payload.dob else date(2010, 1, 1),
            gender=payload.gender or "Not Specified",
            father_name=payload.father_name.strip(),
            mother_name=payload.mother_name.strip(),
        )
        db.add(student)
        db.flush()

        # Link user to student
        new_user.student_id = student.id

        # Create enrollment
        enrollment = Enrollment(
            student_id=student.id,
            class_id=school_class.id,
            academic_year_id=academic_year.id,
            status="ACTIVE",
        )
        db.add(enrollment)

    try:
        db.commit()
        db.refresh(new_user)
        logger.info(f"New user registered: {new_user.id} ({new_user.phone})")
    except Exception as e:
        db.rollback()
        logger.error(f"Registration failed during commit: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed due to database error",
        )

    # TODO: Send SMS/notification to admins about new registration

    return RegistrationResponse(
        status="pending_approval",
        message="Registration successful! Your account is pending admin approval. You will be notified once approved.",
        user_id=new_user.id,
    )


@router.get("/status/{phone}")
def check_registration_status(
    phone: str,
    db: Session = Depends(get_db),
):
    """
    Check registration status by phone number.

    Returns the approval status without revealing sensitive information.
    """
    # Clean phone number
    clean_phone = re.sub(r"\D", "", phone)

    user = db.query(User).filter(User.phone == clean_phone).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registration found for this phone number",
        )

    status_messages = {
        ApprovalStatus.PENDING: "Your registration is pending admin approval",
        ApprovalStatus.APPROVED: "Your account has been approved! You can now login",
        ApprovalStatus.REJECTED: "Your registration was not approved. Please contact the school office",
    }

    return {
        "phone": clean_phone[-4:].rjust(len(clean_phone), "*"),  # Mask phone
        "status": user.approval_status,
        "message": status_messages.get(user.approval_status, "Unknown status"),
    }
