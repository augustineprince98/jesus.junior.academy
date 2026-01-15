from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import random
import string

from app.core.config import settings  # FIXED: Use centralized config

# Password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT Config - FIXED: Use settings instead of hardcoded
SECRET_KEY = settings.JWT_SECRET
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

# OTP - FIXED: Added missing function
def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

def otp_expiry() -> datetime:
    """Generate OTP expiry time (5 minutes from now)"""
    return datetime.utcnow() + timedelta(minutes=5)