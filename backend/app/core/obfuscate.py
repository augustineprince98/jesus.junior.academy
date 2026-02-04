
"""
Field Obfuscation/Encryption Module

Provides symmetric encryption for sensitive database fields (like push notification keys)
using Fernet (AES-128-CBC with HMAC-SHA256).

Uses a key derived from the application JWT_SECRET.
"""

import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

# Derive a 32-byte URL-safe base64-encoded key from the JWT_SECRET
# This ensures a consistent key across restarts/re-deploys as long as JWT_SECRET is constant.
def _get_fernet_key() -> bytes:
    if not settings.JWT_SECRET:
        raise ValueError("JWT_SECRET is not configured!")
    
    # SHA-256 hash gives 32 bytes
    hashed = hashlib.sha256(settings.JWT_SECRET.encode()).digest()
    # Base64 encode it for Fernet compatibility
    return base64.urlsafe_b64encode(hashed)

_cipher = Fernet(_get_fernet_key())

def encrypt_value(value: str) -> str:
    """Encrypt a string value."""
    if not value:
        return value
    return _cipher.encrypt(value.encode()).decode()

def decrypt_value(value: str) -> str:
    """Decrypt an encrypted string value."""
    if not value:
        return value
    try:
        return _cipher.decrypt(value.encode()).decode()
    except Exception:
        # Fallback for unencrypted legacy data (if any) or rotation errors
        return value
