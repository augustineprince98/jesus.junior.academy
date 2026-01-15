from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    phone: str = Field(..., examples=["9876543210"])
    password: str


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
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str
    new_password: str
