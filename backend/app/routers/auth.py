from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import jwt

from app.core.database import get_db
from app.core.rate_limit import rate_limit, get_client_identifier
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp,
    otp_expiry,
    get_token_expiry_seconds,
    COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    COOKIE_SECURE,
    COOKIE_HTTPONLY,
    COOKIE_SAMESITE,
)
from app.core.auth import get_current_user
from app.models.user import User, ApprovalStatus
from app.models.password_reset import PasswordResetOTP
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    OTPRequest,
    OTPVerify,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """Set httpOnly cookies for access and refresh tokens."""
    # Access token cookie (short-lived)
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        max_age=get_token_expiry_seconds("access"),
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )
    # Refresh token cookie (long-lived)
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=get_token_expiry_seconds("refresh"),
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/auth",  # Only sent to auth endpoints
    )


def clear_auth_cookies(response: Response):
    """Clear authentication cookies."""
    response.delete_cookie(key=COOKIE_NAME, path="/")
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/auth")


@router.post("/login")
@rate_limit(max_requests=5, window_seconds=60)  # 5 login attempts per minute
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login endpoint that returns tokens both in response body and as httpOnly cookies.

    For web apps: Use the cookies (automatic with credentials: 'include')
    For mobile/API: Use the access_token from the response body
    """
    user = db.query(User).filter(User.phone == payload.phone).first()

    if not user or not verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Check if user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated",
        )

    # Check approval status
    if user.approval_status == ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval. Please wait for admin approval.",
        )

    if user.approval_status == ApprovalStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account registration was rejected. Please contact administrator.",
        )

    # Create tokens
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set httpOnly cookies
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": get_token_expiry_seconds("access"),
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
            "student_id": user.student_id,
            "parent_id": user.parent_id,
            "teacher_id": user.teacher_id,
        }
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    refresh_token_cookie: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    """
    Refresh the access token using the refresh token.

    The refresh token can be sent either:
    1. As an httpOnly cookie (automatic with credentials: 'include')
    2. In the request body as { "refresh_token": "..." }
    """
    refresh_token = refresh_token_cookie

    # Also check request body
    if not refresh_token:
        try:
            body = await request.json()
            refresh_token = body.get("refresh_token")
        except:
            pass

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required",
        )

    # Decode and validate refresh token
    try:
        payload = decode_refresh_token(refresh_token)
    except jwt.ExpiredSignatureError:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired. Please login again.",
        )
    except (jwt.InvalidTokenError, Exception) as e:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Get user
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Create new tokens
    token_data = {"sub": str(user.id)}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    # Set new cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": get_token_expiry_seconds("access"),
    }


@router.post("/logout")
async def logout(response: Response):
    """
    Logout endpoint - clears authentication cookies.
    """
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    Works with both Bearer token and cookie authentication.
    """
    return {
        "id": user.id,
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "student_id": user.student_id,
        "parent_id": user.parent_id,
        "teacher_id": user.teacher_id,
        "is_approved": user.is_approved,
        "available_roles": user.get_available_roles(),
        "can_switch_role": len(user.get_available_roles()) > 1,
    }


class SwitchRoleRequest(BaseModel):
    """Request to switch to a different role."""
    new_role: str


@router.post("/switch-role")
async def switch_role(
    payload: SwitchRoleRequest,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Switch the current user's active role.

    This is useful when:
    - A parent is also a student (e.g., older sibling)
    - A teacher is also a parent
    - Multiple roles are linked to the same account

    Returns new tokens with the switched role.
    """
    new_role = payload.new_role.upper()

    # Check if user can switch to this role
    if not user.can_switch_to(new_role):
        available = user.get_available_roles()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot switch to role '{new_role}'. Available roles: {available}",
        )

    # Update the user's active role
    user.role = new_role
    db.commit()
    db.refresh(user)

    # Generate new tokens with updated role info
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Set new cookies
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "status": "role_switched",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": get_token_expiry_seconds("access"),
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
            "student_id": user.student_id,
            "parent_id": user.parent_id,
            "teacher_id": user.teacher_id,
            "available_roles": user.get_available_roles(),
        }
    }


@router.get("/available-roles")
async def get_available_roles(user: User = Depends(get_current_user)):
    """
    Get the list of roles the current user can switch to.
    """
    return {
        "current_role": user.role,
        "available_roles": user.get_available_roles(),
        "can_switch_role": len(user.get_available_roles()) > 1,
    }


from pydantic import BaseModel as PydanticBaseModel


class LinkRoleRequest(PydanticBaseModel):
    """Request to link additional role to user."""
    role_to_link: str  # PARENT or STUDENT
    entity_id: int  # parent_id or student_id


@router.post("/link-role")
async def link_additional_role(
    payload: LinkRoleRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    [ADMIN] Link an additional role to a user account.

    This allows creating parent-student links where the same person
    needs access as both a student AND a parent (for their siblings).
    """
    # Only admin can link roles (or self-service in future)
    from app.core.roles import Role
    if user.role != Role.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can link additional roles"
        )

    # Get the target user
    target_user_id = payload.entity_id

    role_to_link = payload.role_to_link.upper()

    if role_to_link == "PARENT":
        # Verify parent exists
        from app.models.people import Parent
        parent = db.get(Parent, payload.entity_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent not found")

        user.parent_id = payload.entity_id

    elif role_to_link == "STUDENT":
        # Verify student exists
        from app.models.people import Student
        student = db.get(Student, payload.entity_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        user.student_id = payload.entity_id

    else:
        raise HTTPException(
            status_code=400,
            detail="Can only link PARENT or STUDENT roles"
        )

    db.commit()
    db.refresh(user)

    return {
        "status": "role_linked",
        "user_id": user.id,
        "linked_role": role_to_link,
        "available_roles": user.get_available_roles(),
    }


@router.post("/password-reset/request")
@rate_limit(max_requests=3, window_seconds=600)  # 3 attempts per 10 minutes
async def request_password_reset(
    request: Request, payload: OTPRequest, db: Session = Depends(get_db)
):
    otp = generate_otp()

    record = PasswordResetOTP(
        phone=payload.phone,
        otp_hash=hash_password(otp),
        expires_at=otp_expiry(),  # FIXED: Function now exists
    )

    db.add(record)
    db.commit()

    # TODO: SEND OTP VIA SMS PROVIDER HERE
    # For production: Integrate with SMS gateway (Twilio, AWS SNS, etc.)
    # In development, check database for OTP

    return {"message": "OTP sent if phone exists"}

@router.post("/password-reset/verify")
def verify_password_reset(
    payload: OTPVerify, db: Session = Depends(get_db)
):
    record = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.phone == payload.phone,
            PasswordResetOTP.is_used.is_(False),
            PasswordResetOTP.expires_at > datetime.utcnow(),
        )
        .order_by(PasswordResetOTP.id.desc())
        .first()
    )

    if not record or not verify_password(
        payload.otp, record.otp_hash
    ):
        raise HTTPException(
            status_code=400, detail="Invalid or expired OTP"
        )

    user = db.query(User).filter(User.phone == payload.phone).first()
    user.password_hash = hash_password(payload.new_password)

    record.is_used = True

    db.commit()

    return {"message": "Password reset successful"}