"""
Database Configuration

Optimized SQLAlchemy setup with connection pooling for Neon.tech PostgreSQL.
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
import logging
import time

from app.core.config import settings

logger = logging.getLogger(__name__)

# Database URL from settings
DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured. Please check your .env file.")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Engine Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Optimized connection pool settings for Neon.tech (serverless PostgreSQL)
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,  # Number of connections to maintain
    max_overflow=10,  # Additional connections that can be created
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_timeout=30,  # Wait up to 30s for a connection
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "sslmode": "require",  # Ensure SSL is required
        "options": "-c statement_timeout=30000",  # 30s query timeout
    },
    echo=False,  # Set to True for SQL query logging
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Connection Event Listeners
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@event.listens_for(engine, "connect")
def on_connect(dbapi_conn, connection_record):
    """Called when a new database connection is established."""
    logger.debug("New database connection established")


@event.listens_for(engine, "checkout")
def on_checkout(dbapi_conn, connection_record, connection_proxy):
    """Called when a connection is checked out from the pool."""
    connection_record.info["checkout_time"] = time.time()
    logger.debug("Connection checked out from pool")


@event.listens_for(engine, "checkin")
def on_checkin(dbapi_conn, connection_record):
    """Called when a connection is returned to the pool."""
    checkout_time = connection_record.info.pop("checkout_time", None)
    if checkout_time:
        duration = time.time() - checkout_time
        if duration > 5:  # Log if connection held for > 5 seconds
            logger.warning(f"Connection held for {duration:.1f}s before return")
    logger.debug("Connection returned to pool")


@event.listens_for(engine, "invalidate")
def on_invalidate(dbapi_conn, connection_record, exception):
    """Called when a connection is invalidated."""
    logger.warning(f"Connection invalidated: {exception}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Session Configuration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Don't expire objects after commit
)

Base = declarative_base()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Session Dependencies
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_db() -> Generator:
    """
    Database session dependency for FastAPI routes.
    
    Provides a database session that is automatically closed after use.
    Handles rollback on exceptions and proper session cleanup.
    
    Usage:
        @router.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        # Rollback on any exception
        if db.is_active:
            try:
                db.rollback()
            except Exception as rollback_error:
                logger.error(f"Error during rollback: {str(rollback_error)}")
        logger.error(f"Database session error: {str(e)}", exc_info=True)
        raise
    finally:
        # Always close the session
        try:
            db.close()
        except Exception as close_error:
            logger.error(f"Error closing database session: {str(close_error)}")


@contextmanager
def get_db_context():
    """
    Context manager for database sessions outside of FastAPI routes.
    
    Usage:
        with get_db_context() as db:
            user = db.query(User).first()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Database Utilities
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_pool_status() -> dict:
    """Get current connection pool status."""
    pool = engine.pool
    return {
        "pool_size": pool.size(),
        "checked_in": pool.checkedin(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "invalid": pool.invalidatedcount() if hasattr(pool, 'invalidatedcount') else 0,
    }


def check_database_connection() -> bool:
    """
    Test database connectivity.
    
    Returns True if database is reachable, False otherwise.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return result.scalar() == 1
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


def dispose_engine() -> None:
    """
    Dispose of the connection pool.
    
    Should be called during application shutdown.
    """
    engine.dispose()
    logger.info("Database connection pool disposed")