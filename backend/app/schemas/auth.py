from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class LoginRequest(BaseModel):
    """Login request with validated phone and password."""
    phone: str = Field(
        ..., 
        min_length=10, 
        max_length=15,
        examples=["9876543210"],
        description="Phone number (10-15 digits)"
    )
    password: str = Field(
        ..., 
        min_length=6, 
        max_length=128,
        description="User password"
    )
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Remove any spaces or dashes
        cleaned = re.sub(r'[\s\-]', '', v)
        # Must be digits only, 10-15 characters
        if not re.match(r'^\d{10,15}$', cleaned):
            raise ValueError("Phone must be 10-15 digits")
        return cleaned


class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    role: str
    student_id: Optional[int] = None
    parent_id: Optional[int] = None
    teacher_id: Optional[int] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class OTPRequest(BaseModel):
    """Request OTP for password reset."""
    phone: str = Field(..., min_length=10, max_length=15)
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r'[\s\-]', '', v)
        if not re.match(r'^\d{10,15}$', cleaned):
            raise ValueError("Phone must be 10-15 digits")
        return cleaned


class OTPVerify(BaseModel):
    """Verify OTP and set new password."""
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6, pattern=r'^\d{6}$')
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="New password (min 8 characters)"
    )
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r'[\s\-]', '', v)
        if not re.match(r'^\d{10,15}$', cleaned):
            raise ValueError("Phone must be 10-15 digits")
        return cleaned
    
    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Enforce basic password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[A-Za-z]', v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one number")
        return v
