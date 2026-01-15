from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.rate_limit import rate_limit, get_client_identifier
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    generate_otp,
    otp_expiry,  # FIXED: Now exists
)
from app.models.user import User, ApprovalStatus
from app.models.password_reset import PasswordResetOTP
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    OTPRequest,
    OTPVerify,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
@rate_limit(max_requests=5, window_seconds=60)  # 5 login attempts per minute
async def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
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

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "token_type": "bearer",
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