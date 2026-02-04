"""
Field Obfuscation/Encryption Module

Provides:
1. Symmetric encryption for sensitive database fields (like push notification keys).
2. Masking utilities for PII (emails/phones) for API responses.
"""

import base64
import hashlib
from enum import Enum
from cryptography.fernet import Fernet
from app.core.config import settings


# 1. Encryption (Fernet)
# ----------------------

# Derive a 32-byte URL-safe base64-encoded key from the JWT_SECRET
def _get_fernet_key() -> bytes:
    if not settings.JWT_SECRET:
        raise ValueError("JWT_SECRET is not configured!")
    
    # SHA-256 hash gives 32 bytes
    hashed = hashlib.sha256(settings.JWT_SECRET.encode()).digest()
    # Base64 encode it for Fernet compatibility
    return base64.urlsafe_b64encode(hashed)

# Lazy initialization of cipher to avoid errors during import if config not ready
_cipher = None

def _get_cipher():
    global _cipher
    if _cipher is None:
        _cipher = Fernet(_get_fernet_key())
    return _cipher


def encrypt_value(value: str) -> str:
    """Encrypt a string value."""
    if not value:
        return value
    try:
        return _get_cipher().encrypt(value.encode()).decode()
    except Exception:
        return value

def decrypt_value(value: str) -> str:
    """Decrypt an encrypted string value."""
    if not value:
        return value
    try:
        return _get_cipher().decrypt(value.encode()).decode()
    except Exception:
        # Fallback for unencrypted legacy data or rotation errors
        return value


# 2. Obfuscation (Masking)
# ------------------------

class SecurityLevel(str, Enum):
    """
    Security level for data exposure.
    ADMIN: Full transparency
    USER_API: Partially masked
    PUBLIC: Fully hidden
    """
    ADMIN = "ADMIN"
    USER_API = "USER_API"
    PUBLIC = "PUBLIC"


def mask_email(email: str) -> str:
    """
    Mask email address.
    john.doe@example.com -> j***e@example.com
    """
    if not email or "@" not in email:
        return email
    
    try:
        user, domain = email.split("@")
        if len(user) <= 2:
            masked_user = user[0] + "***"
        else:
            masked_user = user[0] + "***" + user[-1]
        
        return f"{masked_user}@{domain}"
    except Exception:
        return email


def mask_phone(phone: str, security_level: SecurityLevel = SecurityLevel.USER_API) -> str:
    """
    Mask phone number based on security level.
    
    ADMIN: 9876543210 (No mask)
    USER_API: ******3210
    PUBLIC: **********
    """
    if not phone:
        return phone
        
    if security_level == SecurityLevel.ADMIN:
        return phone
    elif security_level == SecurityLevel.USER_API:
        # Show last 4 digits
        if len(phone) > 4:
            return "*" * (len(phone) - 4) + phone[-4:]
        return phone
    else:
        # Hide completely
        return "*" * len(phone)
