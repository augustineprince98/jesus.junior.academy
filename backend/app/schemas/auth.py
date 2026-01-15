from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    phone: str = Field(..., examples=["9876543210"])
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str
    new_password: str
