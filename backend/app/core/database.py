from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# FIXED: Fail explicitly if DATABASE_URL missing
DATABASE_URL = settings.DATABASE_URL

# Optimized connection pool settings for Neon.tech (serverless PostgreSQL)
# Neon recommends:
# - Using connection pooling (pooler endpoint is already in URL)
# - Setting appropriate pool sizes
# - Using pool_pre_ping to check connections
# - Setting pool_recycle to avoid stale connections
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,  # Number of connections to maintain
    max_overflow=10,  # Additional connections that can be created
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour (Neon idle timeout is ~10 minutes)
    connect_args={
        "connect_timeout": 10,  # Connection timeout in seconds
        "sslmode": "require",  # Ensure SSL is required
    },
    echo=False,  # Set to True for SQL query logging in development
)

# Add connection event listeners for better debugging
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Set connection-level settings if needed."""
    pass

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log when a connection is checked out from the pool."""
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Log when a connection is returned to the pool."""
    logger.debug("Connection returned to pool")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

def get_db():
    """
    Database session dependency.
    
    Provides a database session that is automatically closed after use.
    Note: Routers should explicitly call db.commit() or db.rollback() as needed.
    This function ensures the session is properly closed even if exceptions occur.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        # Rollback on any exception if not already rolled back
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