"""
Jesus Junior Academy ERP - Main Application

Enterprise Resource Planning system for school management.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
from datetime import datetime
import time
import os
import uuid

from app.websocket import websocket_endpoint
from app.routers import (
    admission_router,
    enrollment_router,
    attendance_router,
    auth_router,
    promotion_router,
    fees_router,
    marks_router,
    exams_router,
    marks_edit_router,
    results_router,
    notifications_router,
    homework_router,
    calendar_router,
    teacher_attendance_router,
    teacher_leave_router,
    teacher_subjects_router,
    achievements_router,
    events_router,
    users_router,
    registration_router,
    uploads_router,
    academic_year_router,
    push_subscriptions_router,
    classes_router,
    subjects_router,
)
from app.core.config import settings
from app.core.constants import API_TAGS_METADATA
from app.core.logging_config import setup_logging, get_logger, set_request_id
from app.core.exceptions import register_exception_handlers, AppException
from app.services.scheduler_service import start_scheduler, stop_scheduler

# Setup logging
is_production = settings.APP_ENV == "production"
setup_logging(
    level="INFO" if is_production else "DEBUG",
    json_format=is_production,
)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop scheduler."""
    logger.info("Starting Jesus Junior Academy ERP...")
    start_scheduler()
    yield
    logger.info("Shutting down application...")
    stop_scheduler()


# Application description for documentation
APP_DESCRIPTION = """
# Jesus Junior Academy ERP API

Enterprise Resource Planning system for comprehensive school management.

## Features

- **Authentication** - Secure login with JWT tokens and refresh tokens
- **User Management** - Student, parent, teacher, and admin accounts
- **Attendance Tracking** - Daily attendance for students and teachers
- **Homework System** - Assignment creation, submission, and grading
- **Notifications** - School announcements and targeted notifications
- **Fee Management** - Fee structure, payments, and outstanding tracking
- **Academic Records** - Exams, marks, and result generation
- **Events & Calendar** - School events and academic calendar

## Authentication

Most endpoints require authentication via JWT Bearer token.
Include the token in the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

## Rate Limiting

API requests are rate-limited to ensure fair usage:
- General endpoints: 200 requests/minute
- Authentication: 5 requests/minute
- Write operations: 50 requests/minute
"""

app = FastAPI(
    title="Jesus Junior Academy ERP",
    version="2.1.0",
    description=APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=API_TAGS_METADATA,
    contact={
        "name": "JJA Support",
        "email": "info@jesusja.com",
    },
    license_info={
        "name": "Private",
    },
)

# Register custom exception handlers
register_exception_handlers(app)

# Rate Limiting Configuration
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
cors_origins = settings.CORS_ORIGINS.strip()
if cors_origins == "*":
    logger.warning("CORS_ORIGINS is set to '*' - using restricted defaults for security")
    allow_origins = [
        "https://jesus-junior-academy.vercel.app",
        "http://localhost:3000",
    ]
else:
    allow_origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]

logger.info(f"CORS allowed origins: {allow_origins}")

allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"] if is_production else ["*"]
allowed_headers = ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"] if is_production else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=allowed_methods,
    allow_headers=allowed_headers,
)


# Request tracking and logging middleware
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Add request tracking and performance logging."""
    # Generate request ID
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    set_request_id(request_id)
    
    # Track timing
    start_time = time.perf_counter()
    
    # Log request
    logger.info(f"→ {request.method} {request.url.path}")
    
    # Process request
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Request failed: {str(e)}", exc_info=True)
        raise
    
    # Calculate duration
    duration_ms = (time.perf_counter() - start_time) * 1000
    
    # Add headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration_ms:.0f}ms"
    
    # Log response
    status_emoji = "✓" if response.status_code < 400 else "✗"
    log_level = "warning" if response.status_code >= 400 else "info"
    
    getattr(logger, log_level)(
        f"← {status_emoji} {response.status_code} ({duration_ms:.0f}ms)"
    )
    
    # Warn on slow requests
    if duration_ms > 1000:
        logger.warning(f"Slow request: {request.method} {request.url.path} took {duration_ms:.0f}ms")
    
    return response


# Exception handlers with consistent response format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed field information."""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "errors": exc.errors(),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors securely."""
    logger.error(f"Database error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_code": "DATABASE_ERROR",
            "message": "A database error occurred",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler."""
    import traceback
    traceback.print_exc()
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    # In production, don't expose error details
    detail = str(exc) if not is_production else "An unexpected error occurred"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_code": "INTERNAL_ERROR",
            "message": detail,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Register Routers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Authentication & Users
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(registration_router)

# Academic Management
app.include_router(admission_router)
app.include_router(enrollment_router)
app.include_router(classes_router)
app.include_router(subjects_router)
app.include_router(academic_year_router)
app.include_router(promotion_router)

# Attendance
app.include_router(attendance_router)
app.include_router(teacher_attendance_router)
app.include_router(teacher_leave_router)

# Academic Records
app.include_router(marks_router)
app.include_router(exams_router)
app.include_router(marks_edit_router)
app.include_router(results_router)

# Teaching
app.include_router(homework_router)
app.include_router(teacher_subjects_router)

# Communication
app.include_router(notifications_router)
app.include_router(push_subscriptions_router)
app.include_router(calendar_router)

# Finance
app.include_router(fees_router)

# Public Content
app.include_router(achievements_router)
app.include_router(events_router)

# Files
app.include_router(uploads_router)

# Mount static files for uploads
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
uploads_path = Path(UPLOAD_DIR)
if not uploads_path.exists():
    uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# WebSocket endpoint
app.websocket("/ws")(websocket_endpoint)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health & Status Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/health", tags=["System"])
def health():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns server status, database connectivity, and pool statistics.
    """
    from app.core.database import engine, SessionLocal
    from sqlalchemy import text

    health_status = {
        "status": "healthy",
        "version": "2.1.0",
        "environment": settings.APP_ENV,
        "database": "disconnected",
        "timestamp": datetime.utcnow().isoformat(),
    }

    try:
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            if result.scalar() != 1:
                raise Exception("Database query returned unexpected result")
        
        # Get pool statistics
        pool = engine.pool
        health_status["pool"] = {
            "size": pool.size(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
        }
        
        # Test a session
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db.commit()
            health_status["database"] = "connected"
        except Exception as e:
            logger.error(f"Health check - Transaction test failed: {str(e)}")
            health_status["database"] = "transaction_error"
            health_status["status"] = "degraded"
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Health check - Database error: {str(e)}", exc_info=True)
        health_status["status"] = "unhealthy"
        health_status["database"] = "error"
        if not is_production:
            health_status["error"] = str(e)

    return health_status


@app.get("/", tags=["System"])
def root():
    """Root endpoint with API information."""
    return {
        "name": "Jesus Junior Academy ERP",
        "version": "2.1.0",
        "status": "running",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
        },
        "health": "/health",
    }


@app.get("/api/info", tags=["System"])
def api_info():
    """Get API configuration and status information."""
    return {
        "version": "2.1.0",
        "environment": settings.APP_ENV,
        "features": {
            "authentication": True,
            "websocket": True,
            "push_notifications": True,
            "file_uploads": True,
            "rate_limiting": True,
        },
        "endpoints": {
            "total_routers": 21,
            "categories": [
                "Authentication",
                "Users",
                "Academic",
                "Attendance",
                "Finance",
                "Communication",
            ],
        },
    }