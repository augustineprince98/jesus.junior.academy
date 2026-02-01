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
import asyncio
import signal

# Sentry for error monitoring (production)
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False


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
    settings_router,
)
from app.core.config import settings
from app.core.constants import API_TAGS_METADATA
from app.core.logging_config import setup_logging, get_logger, set_request_id
from app.core.exceptions import register_exception_handlers, AppException
from app.core.security_headers import SecurityHeadersMiddleware, RequestSizeLimitMiddleware
from app.services.scheduler_service import start_scheduler, stop_scheduler
from app.core.database import dispose_engine, check_database_connection


# Setup logging
is_production = settings.APP_ENV == "production"
setup_logging(
    level="INFO" if is_production else "DEBUG",
    json_format=is_production,
)
logger = get_logger(__name__)


# Database warmup task to prevent Neon.tech cold starts
async def database_warmup_task():
    """
    Pings the database every 4 minutes to keep the connection warm.
    Prevents Neon.tech serverless PostgreSQL from going to sleep.
    """
    while True:
        try:
            await asyncio.sleep(240)  # 4 minutes
            if check_database_connection():
                logger.debug("Database warmup ping successful")
            else:
                logger.warning("Database warmup ping failed")
        except asyncio.CancelledError:
            logger.info("Database warmup task cancelled")
            break
        except Exception as e:
            logger.error(f"Database warmup error: {e}")
            await asyncio.sleep(60)  # Retry after 1 minute on error


def _ensure_admin_user():
    """Ensure an admin user exists with correct approval status on every startup."""
    from app.core.database import SessionLocal
    from app.core.security import hash_password, verify_password
    from app.models.user import User, ApprovalStatus

    default_admin_password = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin123")

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.phone == "9999999999").first()
        if not admin:
            logger.info("Creating default admin user...")
            admin = User(
                name="System Administrator",
                phone="9999999999",
                email="admin@jesusja.com",
                password_hash=hash_password(default_admin_password),
                role="ADMIN",
                is_active=True,
                is_approved=True,
                approval_status=ApprovalStatus.APPROVED,
            )
            db.add(admin)
            db.commit()
            logger.info("Admin user created (phone: 9999999999)")
        else:
            # Fix approval status if stuck at PENDING
            changed = False
            if admin.approval_status != ApprovalStatus.APPROVED:
                admin.approval_status = ApprovalStatus.APPROVED
                admin.is_approved = True
                changed = True
                logger.info("Fixed admin approval_status -> APPROVED")
            if not admin.is_active:
                admin.is_active = True
                changed = True
                logger.info("Fixed admin is_active -> True")
            if changed:
                db.commit()
    except Exception as e:
        logger.error(f"Admin user check failed: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop scheduler, database pool."""
    logger.info("Starting Jesus Junior Academy ERP v2.2.0...")
    
    # Initialize Sentry in production
    sentry_dsn = os.getenv("SENTRY_DSN")
    if SENTRY_AVAILABLE and sentry_dsn and is_production:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=0.1,  # 10% of transactions for performance
            profiles_sample_rate=0.1,
            environment=settings.APP_ENV,
            release=f"jja-erp@2.2.0",
        )
        logger.info("Sentry error monitoring initialized")
    
    # Start background scheduler
    start_scheduler()
    
    # Record startup time for uptime tracking
    app.state.startup_time = datetime.utcnow()
    
    # Start database warmup task to prevent cold starts
    warmup_task = asyncio.create_task(database_warmup_task())
    logger.info("Database warmup task started (pings every 4 minutes)")
    
    # Initial database connection check
    if check_database_connection():
        logger.info("Initial database connection verified")
        # Ensure admin user exists with correct approval status
        _ensure_admin_user()
    else:
        logger.warning("Initial database connection check failed")

    yield
    
    # Graceful shutdown
    logger.info("Shutting down application...")
    warmup_task.cancel()
    try:
        await warmup_task
    except asyncio.CancelledError:
        pass
    stop_scheduler()
    dispose_engine()  # Clean up database connections
    logger.info("Shutdown complete")



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

# Security Headers Middleware (after CORS so headers are added to responses)
app.add_middleware(
    SecurityHeadersMiddleware,
    is_production=is_production,
    hsts_max_age=31536000,  # 1 year
)

# Request Size Limit (10MB max)
app.add_middleware(RequestSizeLimitMiddleware, max_size=10 * 1024 * 1024)

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

# System Settings
app.include_router(settings_router)

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
def health(request: Request):
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns server status, database connectivity, pool statistics, and uptime.
    """
    from app.core.database import engine, SessionLocal, get_pool_status
    from sqlalchemy import text

    # Calculate uptime
    uptime_seconds = 0
    if hasattr(request.app.state, "startup_time"):
        uptime_seconds = (datetime.utcnow() - request.app.state.startup_time).total_seconds()

    health_status = {
        "status": "healthy",
        "version": "2.2.0",
        "environment": settings.APP_ENV,
        "database": "disconnected",
        "uptime_seconds": int(uptime_seconds),
        "timestamp": datetime.utcnow().isoformat(),
        "sentry_enabled": SENTRY_AVAILABLE and bool(os.getenv("SENTRY_DSN")) and is_production,
    }

    try:
        # Test database connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            if result.scalar() != 1:
                raise Exception("Database query returned unexpected result")
        
        # Get pool statistics
        health_status["pool"] = get_pool_status()
        
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