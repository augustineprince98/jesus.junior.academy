"""
Core Module

Centralized exports for core functionality.
"""

# Database
from .database import Base, SessionLocal, get_db, get_db_context, engine

# Configuration
from .config import settings

# Authentication
from .auth import get_current_user

# Security
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
)

# Roles and Permissions
from .roles import Role

# Caching
from .cache import cache, cached, cached_sync, invalidate_cache

# Constants
from .constants import (
    CacheTTL,
    RateLimits,
    ErrorMessages,
    SuccessMessages,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
)

# Exceptions
from .exceptions import (
    AppException,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    BadRequestError,
    ConflictError,
)

# Logging
from .logging_config import get_logger, setup_logging

__all__ = [
    # Database
    "Base",
    "SessionLocal",
    "get_db",
    "get_db_context",
    "engine",
    # Config
    "settings",
    # Auth
    "get_current_user",
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    # Roles
    "Role",
    # Cache
    "cache",
    "cached",
    "cached_sync",
    "invalidate_cache",
    # Constants
    "CacheTTL",
    "RateLimits",
    "ErrorMessages",
    "SuccessMessages",
    "DEFAULT_PAGE_SIZE",
    "MAX_PAGE_SIZE",
    # Exceptions
    "AppException",
    "NotFoundError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "BadRequestError",
    "ConflictError",
    # Logging
    "get_logger",
    "setup_logging",
]
