from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
import random
import string
import secrets

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
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Short-lived access token (30 minutes)
REFRESH_TOKEN_EXPIRE_DAYS = 7  # Refresh token valid for 7 days

# Cookie settings
COOKIE_NAME = "access_token"
REFRESH_COOKIE_NAME = "refresh_token"
COOKIE_SECURE = True  # Set to True in production (HTTPS only)
COOKIE_HTTPONLY = True  # Prevents JavaScript access
COOKIE_SAMESITE = "lax"  # CSRF protection


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    """Create a short-lived access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_days: int = REFRESH_TOKEN_EXPIRE_DAYS):
    """Create a long-lived refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=expires_days)
    # Add a unique identifier to allow token revocation
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": secrets.token_urlsafe(16)  # Unique token ID
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    """Decode and validate an access token."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    # Ensure it's an access token, not a refresh token
    if payload.get("type") == "refresh":
        raise jwt.InvalidTokenError("Cannot use refresh token as access token")
    return payload


def decode_refresh_token(token: str):
    """Decode and validate a refresh token."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Invalid refresh token")
    return payload


def get_token_expiry_seconds(token_type: str = "access") -> int:
    """Get token expiry in seconds for cookie max-age."""
    if token_type == "refresh":
        return REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    return ACCESS_TOKEN_EXPIRE_MINUTES * 60


# OTP - FIXED: Added missing function
def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

def otp_expiry() -> datetime:
    """Generate OTP expiry time (5 minutes from now)"""
    return datetime.utcnow() + timedelta(minutes=5)