"""
Application Constants

Centralized constants for configuration, defaults, and magic values.
"""

from enum import Enum


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pagination Defaults
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MIN_PAGE_SIZE = 1


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cache TTL (Time To Live) in seconds
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class CacheTTL:
    """Cache expiration times in seconds."""
    
    # Short-lived cache (1-5 minutes)
    VERY_SHORT = 60  # 1 minute
    SHORT = 300  # 5 minutes
    
    # Medium-lived cache (15-30 minutes)
    MEDIUM = 900  # 15 minutes
    DEFAULT = 1800  # 30 minutes
    
    # Long-lived cache (1-24 hours)
    LONG = 3600  # 1 hour
    VERY_LONG = 86400  # 24 hours
    
    # Specific use cases
    USER_SESSION = 1800  # 30 minutes
    PUBLIC_DATA = 600  # 10 minutes
    STATIC_DATA = 86400  # 24 hours
    NOTIFICATIONS = 60  # 1 minute


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Rate Limiting
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class RateLimits:
    """Rate limit configurations."""
    
    # Authentication endpoints
    LOGIN_MAX = 5
    LOGIN_WINDOW = 60  # per minute
    
    PASSWORD_RESET_MAX = 3
    PASSWORD_RESET_WINDOW = 600  # per 10 minutes
    
    # General API
    API_DEFAULT_MAX = 200
    API_DEFAULT_WINDOW = 60  # per minute
    
    # Write operations
    WRITE_MAX = 50
    WRITE_WINDOW = 60  # per minute


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# File Upload Limits
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class FileUploadLimits:
    """File upload size limits in bytes."""
    
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
    MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_BULK_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB
    
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", 
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              "application/vnd.ms-excel",
                              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Error Messages
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ErrorMessages:
    """Standardized error message templates."""
    
    # Authentication
    INVALID_CREDENTIALS = "Invalid phone number or password"
    ACCOUNT_INACTIVE = "Account has been deactivated"
    ACCOUNT_PENDING = "Account pending approval. Please wait for admin approval."
    ACCOUNT_REJECTED = "Account registration was rejected. Please contact administrator."
    TOKEN_EXPIRED = "Token expired. Please login again."
    TOKEN_INVALID = "Invalid token"
    
    # Authorization
    PERMISSION_DENIED = "You don't have permission to perform this action"
    ADMIN_REQUIRED = "Administrator access required"
    TEACHER_REQUIRED = "Teacher access required"
    
    # Resources
    NOT_FOUND = "{resource} not found"
    ALREADY_EXISTS = "{resource} already exists"
    CANNOT_DELETE = "Cannot delete {resource}"
    
    # Validation
    INVALID_FORMAT = "Invalid {field} format"
    REQUIRED_FIELD = "{field} is required"
    INVALID_VALUE = "Invalid value for {field}"
    
    # Operations
    OPERATION_FAILED = "Operation failed. Please try again."
    DATABASE_ERROR = "Database error occurred"
    SERVICE_UNAVAILABLE = "Service temporarily unavailable"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Success Messages
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class SuccessMessages:
    """Standardized success message templates."""
    
    CREATED = "{resource} created successfully"
    UPDATED = "{resource} updated successfully"
    DELETED = "{resource} deleted successfully"
    
    # Authentication
    LOGIN_SUCCESS = "Login successful"
    LOGOUT_SUCCESS = "Logged out successfully"
    PASSWORD_RESET = "Password reset successful"
    
    # Operations
    SENT = "{resource} sent successfully"
    APPROVED = "{resource} approved successfully"
    REJECTED = "{resource} rejected successfully"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Date/Time Formats
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DateFormats:
    """Date and time format strings."""
    
    ISO_DATE = "%Y-%m-%d"
    ISO_DATETIME = "%Y-%m-%dT%H:%M:%S"
    ISO_DATETIME_TZ = "%Y-%m-%dT%H:%M:%S%z"
    
    DISPLAY_DATE = "%d %b %Y"  # 01 Jan 2024
    DISPLAY_DATETIME = "%d %b %Y %H:%M"  # 01 Jan 2024 14:30
    
    # Indian formats
    INDIAN_DATE = "%d/%m/%Y"
    INDIAN_DATETIME = "%d/%m/%Y %I:%M %p"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API Tags for Documentation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API_TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "Login, logout, token management, and password reset operations.",
    },
    {
        "name": "Users",
        "description": "User management and profile operations.",
    },
    {
        "name": "Students",
        "description": "Student enrollment, attendance, and academic records.",
    },
    {
        "name": "Teachers",
        "description": "Teacher management, attendance, and subject assignments.",
    },
    {
        "name": "Classes",
        "description": "Class and section management.",
    },
    {
        "name": "Attendance",
        "description": "Student and teacher attendance tracking.",
    },
    {
        "name": "Homework",
        "description": "Homework assignment and submission management.",
    },
    {
        "name": "Notifications",
        "description": "School announcements and notifications system.",
    },
    {
        "name": "Fees",
        "description": "Fee structure, payments, and account management.",
    },
    {
        "name": "Events",
        "description": "School events and calendar management.",
    },
    {
        "name": "Achievements",
        "description": "Student achievements and awards.",
    },
    {
        "name": "Admin",
        "description": "Administrative operations and system settings.",
    },
]
