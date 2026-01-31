"""
Data Obfuscation Utilities

Security utilities for masking sensitive data in API responses.
Protects against OSINT attacks by hiding full phone numbers, emails, etc.
"""

from typing import Optional
import re


def mask_phone(phone: Optional[str], show_last: int = 4) -> Optional[str]:
    """
    Mask a phone number, showing only the last N digits.
    
    Example:
        mask_phone("9876543210") -> "******3210"
        mask_phone("9876543210", show_last=2) -> "********10"
    """
    if not phone:
        return None
    
    # Remove any non-digit characters for processing
    digits_only = re.sub(r'[^\d]', '', phone)
    
    if len(digits_only) <= show_last:
        return phone  # Too short to mask meaningfully
    
    masked_length = len(digits_only) - show_last
    return '*' * masked_length + digits_only[-show_last:]


def mask_email(email: Optional[str]) -> Optional[str]:
    """
    Mask an email address, showing only first 2 chars and domain.
    
    Example:
        mask_email("john.doe@example.com") -> "jo***@example.com"
    """
    if not email or '@' not in email:
        return email
    
    local, domain = email.rsplit('@', 1)
    
    if len(local) <= 2:
        masked_local = local[0] + '*'
    else:
        masked_local = local[:2] + '*' * min(len(local) - 2, 5)
    
    return f"{masked_local}@{domain}"


def mask_dob(dob: Optional[str]) -> Optional[str]:
    """
    Mask date of birth, showing only the year.
    
    Example:
        mask_dob("2010-05-15") -> "2010-**-**"
    """
    if not dob:
        return None
    
    # Handle various date formats
    if len(dob) >= 4:
        return dob[:4] + "-**-**"
    return "****-**-**"


def mask_aadhaar(aadhaar: Optional[str]) -> Optional[str]:
    """
    Mask Aadhaar number, showing only last 4 digits.
    
    Example:
        mask_aadhaar("123456789012") -> "XXXX-XXXX-9012"
    """
    if not aadhaar:
        return None
    
    digits_only = re.sub(r'[^\d]', '', aadhaar)
    
    if len(digits_only) < 12:
        return aadhaar  # Invalid format, return as-is
    
    return f"XXXX-XXXX-{digits_only[-4:]}"


def obfuscate_user_data(user_dict: dict, full_access: bool = False) -> dict:
    """
    Obfuscate sensitive fields in a user dictionary.
    
    Args:
        user_dict: Dictionary containing user data
        full_access: If True, return unmasked data (for admin view of own data)
    
    Returns:
        Dictionary with sensitive fields masked
    """
    if full_access:
        return user_dict
    
    result = user_dict.copy()
    
    # Mask sensitive fields if present
    if 'phone' in result:
        result['phone'] = mask_phone(result['phone'])
    
    if 'email' in result:
        result['email'] = mask_email(result['email'])
    
    if 'dob' in result or 'date_of_birth' in result:
        key = 'dob' if 'dob' in result else 'date_of_birth'
        result[key] = mask_dob(str(result[key])) if result[key] else None
    
    if 'aadhaar' in result or 'aadhaar_number' in result:
        key = 'aadhaar' if 'aadhaar' in result else 'aadhaar_number'
        result[key] = mask_aadhaar(result[key])
    
    # Remove highly sensitive fields entirely
    sensitive_to_remove = ['password', 'password_hash', 'hashed_password']
    for field in sensitive_to_remove:
        result.pop(field, None)
    
    return result


# For use with Pydantic response serialization
class MaskedPhone(str):
    """Custom type for masked phone numbers in API responses."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if v is None:
            return None
        return mask_phone(str(v))
