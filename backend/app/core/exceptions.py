"""
Custom Exceptions

Centralized exception definitions with consistent error handling.
"""

from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base exception for application-specific errors."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


class NotFoundError(AppException):
    """Resource not found."""
    
    def __init__(
        self,
        resource: str = "Resource",
        resource_id: Optional[int] = None,
        detail: Optional[str] = None,
    ):
        message = detail or f"{resource} not found"
        if resource_id:
            message = f"{resource} with ID {resource_id} not found"
        
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
            error_code="NOT_FOUND",
        )


class ValidationError(AppException):
    """Request validation failed."""
    
    def __init__(
        self,
        detail: str = "Validation failed",
        errors: Optional[List[Dict[str, Any]]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
        )
        self.errors = errors or []


class AuthenticationError(AppException):
    """Authentication failed."""
    
    def __init__(
        self,
        detail: str = "Authentication required",
    ):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_REQUIRED",
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(AppException):
    """Authorization failed - user lacks permissions."""
    
    def __init__(
        self,
        detail: str = "Permission denied",
        required_role: Optional[str] = None,
    ):
        message = detail
        if required_role:
            message = f"Permission denied. Required role: {required_role}"
        
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
            error_code="PERMISSION_DENIED",
        )


class ConflictError(AppException):
    """Resource conflict - e.g., duplicate entry."""
    
    def __init__(
        self,
        detail: str = "Resource conflict",
        resource: Optional[str] = None,
    ):
        message = detail
        if resource:
            message = f"{resource} already exists"
        
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
            error_code="CONFLICT",
        )


class BadRequestError(AppException):
    """Bad request - invalid parameters or state."""
    
    def __init__(
        self,
        detail: str = "Bad request",
    ):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BAD_REQUEST",
        )


class RateLimitError(AppException):
    """Rate limit exceeded."""
    
    def __init__(
        self,
        detail: str = "Too many requests. Please try again later.",
        retry_after: Optional[int] = None,
    ):
        headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_code="RATE_LIMIT_EXCEEDED",
            headers=headers if headers else None,
        )


class ServiceUnavailableError(AppException):
    """External service unavailable."""
    
    def __init__(
        self,
        detail: str = "Service temporarily unavailable",
        service: Optional[str] = None,
    ):
        message = detail
        if service:
            message = f"{service} is temporarily unavailable"
        
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=message,
            error_code="SERVICE_UNAVAILABLE",
        )


class DatabaseError(AppException):
    """Database operation failed."""
    
    def __init__(
        self,
        detail: str = "Database operation failed",
    ):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="DATABASE_ERROR",
        )


# Exception handler registration helper
def register_exception_handlers(app):
    """Register custom exception handlers with the FastAPI app."""
    from fastapi import Request
    from fastapi.responses import JSONResponse
    from datetime import datetime
    
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": exc.error_code,
                "detail": exc.detail,
                "timestamp": datetime.utcnow().isoformat(),
            },
            headers=exc.headers,
        )
    
    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error_code": exc.error_code,
                "detail": exc.detail,
                "errors": exc.errors,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
