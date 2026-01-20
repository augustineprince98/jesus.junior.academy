from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
import logging
import time
import os

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
    # New routers
    notifications_router,
    homework_router,
    calendar_router,
    # Teacher management
    teacher_attendance_router,
    teacher_leave_router,
    teacher_subjects_router,
    # Public website content
    achievements_router,
    events_router,
    # User management
    users_router,
    registration_router,
    # File uploads
    uploads_router,
    # Academic year management
    academic_year_router,
)
from app.core.config import settings
from app.services.scheduler_service import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - start/stop scheduler."""
    logger.info("Starting application...")
    start_scheduler()
    yield
    logger.info("Shutting down application...")
    stop_scheduler()


app = FastAPI(
    title="Jesus Junior Academy ERP",
    version="2.0.0",
    description="Enterprise Resource Planning system for Jesus Junior Academy",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration - Use settings from environment
from app.core.config import settings

# Parse CORS origins from environment variable
cors_origins = settings.CORS_ORIGINS
if cors_origins == "*":
    allow_origins = ["*"]
else:
    # Split comma-separated origins
    allow_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")

    response = await call_next(request)

    # Log response time
    process_time = time.time() - start_time
    logger.info(f"Completed in {process_time:.3f}s - Status: {response.status_code}")

    return response


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error occurred"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},  # Show actual error for debugging
    )

# Register all routers
app.include_router(auth_router)
app.include_router(admission_router)
app.include_router(enrollment_router)
app.include_router(attendance_router)
app.include_router(marks_router)
app.include_router(exams_router)
app.include_router(marks_edit_router)
app.include_router(results_router)
app.include_router(promotion_router)
app.include_router(fees_router)
# New routers
app.include_router(notifications_router)
app.include_router(homework_router)
app.include_router(calendar_router)
# Teacher management
app.include_router(teacher_attendance_router)
app.include_router(teacher_leave_router)
app.include_router(teacher_subjects_router)
# Public website content
app.include_router(achievements_router)
app.include_router(events_router)
# User management
app.include_router(users_router)
app.include_router(registration_router)
# File uploads
app.include_router(uploads_router)
# Academic year management
app.include_router(academic_year_router)

# Mount static files for uploads
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
uploads_path = Path(UPLOAD_DIR)
if not uploads_path.exists():
    uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# WebSocket endpoint for real-time communication
app.websocket("/ws")(websocket_endpoint)

@app.get("/health")
def health():
    """
    Production-ready health check endpoint.
    Returns server status and basic diagnostics.
    """
    from app.core.database import engine, SessionLocal
    from sqlalchemy import text

    health_status = {
        "status": "healthy",
        "version": "2.0.0",
        "database": "disconnected",
        "pool_size": None,
        "pool_checked_out": None,
    }

    # Check database connectivity with more details
    try:
        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            if test_value != 1:
                raise Exception("Database query returned unexpected result")
        
        # Get pool statistics
        pool = engine.pool
        health_status["pool_size"] = pool.size()
        health_status["pool_checked_out"] = pool.checkedout()
        health_status["pool_overflow"] = pool.overflow()
        
        # Test a transaction
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db.commit()
            health_status["database"] = "connected"
        except Exception as e:
            logger.error(f"Health check - Transaction test failed: {str(e)}")
            health_status["database"] = "transaction_error"
            health_status["status"] = "unhealthy"
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Health check - Database error: {str(e)}", exc_info=True)
        health_status["status"] = "unhealthy"
        health_status["database"] = "error"
        health_status["error"] = str(e)

    return health_status


@app.get("/")
def root():
    """Root endpoint redirecting to documentation."""
    return {
        "message": "Jesus Junior Academy ERP API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
    }