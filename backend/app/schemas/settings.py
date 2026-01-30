from pydantic import BaseModel
from typing import Optional, Dict, Any

class SchoolSettings(BaseModel):
    name: str = "Jesus Junior Academy"
    tagline: str = "The Truth Shall Make You Free"
    email: str = "info@jesusja.com"
    phone: str = "+91-8059589595"
    address: str = "Church House, Near SBI Bank, Rewari, Haryana"
    logo_url: str = ""
    established_year: str = "1994"

class NotificationSettings(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    email_provider: str = "smtp"
    sms_provider: str = "none"
    auto_notify_homework: bool = True
    auto_notify_attendance: bool = True
    auto_notify_fees: bool = True
    auto_notify_events: bool = True

class SecuritySettings(BaseModel):
    min_password_length: int = 8
    require_uppercase: bool = True
    require_numbers: bool = True
    require_special_chars: bool = False
    session_timeout_minutes: int = 30
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 15
    two_factor_enabled: bool = False

class SystemSettingsResponse(BaseModel):
    school: SchoolSettings
    notifications: NotificationSettings
    security: SecuritySettings
    updated_at: Optional[str] = None

class SystemSettingsUpdate(BaseModel):
    school: Optional[SchoolSettings] = None
    notifications: Optional[NotificationSettings] = None
    security: Optional[SecuritySettings] = None
