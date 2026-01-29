"""
Database Configuration

Optimized SQLAlchemy setup with connection pooling.
Auto-detects Supabase vs Neon.tech and uses optimal settings for each.
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
# Auto-detect Database Provider
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def detect_db_provider(url: str) -> str:
    """Detect database provider from connection URL."""
    url_lower = url.lower()
    if "supabase.co" in url_lower:
        return "supabase"
    elif "neon.tech" in url_lower:
        return "neon"
    elif "railway.app" in url_lower:
        return "railway"
    elif "localhost" in url_lower or "127.0.0.1" in url_lower:
        return "local"
    else:
        return "unknown"

DB_PROVIDER = detect_db_provider(DATABASE_URL)
logger.info(f"Database provider detected: {DB_PROVIDER}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Engine Configuration (Provider-Optimized)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Provider-specific pool settings
if DB_PROVIDER == "supabase":
    # Supabase: Always-on, larger pool, no cold starts
    POOL_SETTINGS = {
        "pool_size": 5,  # More connections for always-on DB
        "max_overflow": 10,
        "pool_recycle": 1800,  # 30 minutes
        "pool_timeout": 30,
        "connect_timeout": 10,
    }
    logger.info("Using Supabase-optimized connection pool (always-on mode)")
elif DB_PROVIDER == "neon":
    # Neon.tech: Serverless, smaller pool, faster timeouts
    POOL_SETTINGS = {
        "pool_size": 3,  # Smaller for serverless
        "max_overflow": 7,
        "pool_recycle": 300,  # 5 minutes
        "pool_timeout": 15,
        "connect_timeout": 5,
    }
    logger.info("Using Neon.tech-optimized connection pool (serverless mode)")
else:
    # Default settings for Railway, local, or unknown
    POOL_SETTINGS = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_recycle": 1800,
        "pool_timeout": 30,
        "connect_timeout": 10,
    }
    logger.info("Using default connection pool settings")

# Create engine with provider-optimized settings
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=POOL_SETTINGS["pool_size"],
    max_overflow=POOL_SETTINGS["max_overflow"],
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=POOL_SETTINGS["pool_recycle"],
    pool_timeout=POOL_SETTINGS["pool_timeout"],
    connect_args={
        "connect_timeout": POOL_SETTINGS["connect_timeout"],
        "sslmode": "require",  # Ensure SSL for all cloud DBs
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
    echo=False,
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