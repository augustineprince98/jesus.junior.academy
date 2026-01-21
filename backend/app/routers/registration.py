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
    logger.info(f"Registration attempt: phone={payload.phone}, role={payload.role}")

    # Check for existing phone
    existing = db.query(User).filter(User.phone == payload.phone).first()
    if existing:
        logger.warning(f"Registration failed: Phone {payload.phone} already registered (status: {existing.approval_status})")
        # Provide helpful message based on existing user's status
        if existing.approval_status == ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered and pending approval. Please wait for admin approval or contact the school office.",
            )
        elif existing.approval_status == ApprovalStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number was previously registered but rejected. Please contact the school office.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered. Please login instead.",
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
        logger.info(f"Student registration: class_id={payload.class_id}, father={payload.father_name}, mother={payload.mother_name}")

        # Father's name and mother's name are required for students
        if not payload.father_name or not payload.father_name.strip():
            logger.warning(f"Registration failed: Missing father's name for {payload.phone}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Father's name is required for student registration",
            )
        if not payload.mother_name or not payload.mother_name.strip():
            logger.warning(f"Registration failed: Missing mother's name for {payload.phone}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mother's name is required for student registration",
            )

        if payload.class_id:
            school_class = db.get(SchoolClass, payload.class_id)
            if not school_class:
                logger.warning(f"Registration failed: Invalid class_id={payload.class_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid class selected",
                )
            # Get current academic year
            academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
            if not academic_year:
                logger.error("Registration issue: No current academic year found in database")
                # Don't block registration, but log the issue

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


@router.get("/diagnostics")
def registration_diagnostics(
    db: Session = Depends(get_db),
):
    """
    Public diagnostic endpoint to check if registration system is properly configured.

    Returns information about:
    - Current academic year status
    - Available classes for student registration
    - Database user count
    """
    # Check for current academic year
    academic_year = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()

    # Get available classes
    classes = db.query(SchoolClass).filter(SchoolClass.is_active == True).all()

    # Get user counts for debugging
    total_users = db.query(User).count()
    pending_users = db.query(User).filter(User.approval_status == ApprovalStatus.PENDING).count()
    approved_users = db.query(User).filter(User.approval_status == ApprovalStatus.APPROVED).count()

    # Get list of all phones (masked) for debugging
    all_users = db.query(User).all()
    user_list = [
        {
            "id": u.id,
            "phone_masked": u.phone[-4:].rjust(len(u.phone), "*") if u.phone else "N/A",
            "role": u.role,
            "status": u.approval_status,
            "is_active": u.is_active,
        }
        for u in all_users
    ]

    return {
        "registration_enabled": True,
        "database_status": {
            "total_users": total_users,
            "pending_users": pending_users,
            "approved_users": approved_users,
            "user_list": user_list,
        },
        "academic_year": {
            "configured": academic_year is not None,
            "name": academic_year.name if academic_year else None,
            "id": academic_year.id if academic_year else None,
        } if True else None,
        "classes": {
            "count": len(classes),
            "available": [
                {"id": c.id, "name": c.name, "section": c.section}
                for c in classes
            ],
        },
        "student_registration_ready": academic_year is not None and len(classes) > 0,
        "issues": [
            issue for issue in [
                "No current academic year configured" if not academic_year else None,
                "No active classes available" if len(classes) == 0 else None,
                "No users in database" if total_users == 0 else None,
            ] if issue is not None
        ],
    }


@router.get("/check-phone/{phone}")
def check_phone_exists(
    phone: str,
    db: Session = Depends(get_db),
):
    """
    Debug endpoint to check if a phone number exists in the database.

    Returns detailed information about the user if found.
    """
    # Clean phone number
    clean_phone = re.sub(r"\D", "", phone)
    logger.info(f"Checking phone existence: {clean_phone}")

    user = db.query(User).filter(User.phone == clean_phone).first()

    if not user:
        logger.info(f"Phone {clean_phone} NOT found in database")
        return {
            "exists": False,
            "phone": clean_phone,
            "message": "Phone number NOT found in database",
        }

    logger.info(f"Phone {clean_phone} FOUND: user_id={user.id}, status={user.approval_status}")
    return {
        "exists": True,
        "phone": clean_phone,
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "approval_status": user.approval_status,
        "is_approved": user.is_approved,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "message": f"Phone number found - User ID: {user.id}, Status: {user.approval_status}",
    }


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
