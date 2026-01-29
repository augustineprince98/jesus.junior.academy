"""
Database Retry Utilities

Provides retry logic for database operations to handle transient failures
from serverless PostgreSQL (Neon.tech) cold starts.
"""

import functools
import time
import logging
from typing import TypeVar, Callable, Any
from sqlalchemy.exc import OperationalError, InterfaceError

logger = logging.getLogger(__name__)

T = TypeVar('T')


def with_db_retry(
    max_retries: int = 3,
    initial_delay: float = 0.5,
    backoff_factor: float = 2.0,
    max_delay: float = 5.0,
) -> Callable:
    """
    Decorator that retries a function on database connection errors.
    
    Useful for handling Neon.tech cold starts and transient connection issues.
    
    Args:
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay between retries (seconds)
        backoff_factor: Multiplier for delay after each retry
        max_delay: Maximum delay between retries (seconds)
    
    Usage:
        @with_db_retry(max_retries=3)
        def get_user(db, user_id):
            return db.query(User).get(user_id)
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            delay = initial_delay
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (OperationalError, InterfaceError) as e:
                    last_exception = e
                    error_msg = str(e).lower()
                    
                    # Check if it's a retryable error
                    retryable_errors = [
                        "connection refused",
                        "connection reset",
                        "connection timed out",
                        "server closed the connection",
                        "ssl connection has been closed",
                        "could not connect to server",
                        "connection is closed",
                        "connection was reset",
                    ]
                    
                    is_retryable = any(err in error_msg for err in retryable_errors)
                    
                    if not is_retryable or attempt == max_retries:
                        logger.error(
                            f"Database operation failed after {attempt + 1} attempts: {e}"
                        )
                        raise
                    
                    logger.warning(
                        f"Database connection error (attempt {attempt + 1}/{max_retries + 1}): "
                        f"{e}. Retrying in {delay:.1f}s..."
                    )
                    
                    time.sleep(delay)
                    delay = min(delay * backoff_factor, max_delay)
            
            # Should never reach here, but just in case
            if last_exception:
                raise last_exception
            raise RuntimeError("Unexpected retry loop exit")
        
        return wrapper
    return decorator


class DatabaseRetrySession:
    """
    Context manager that provides automatic retry for database session operations.
    
    Usage:
        with DatabaseRetrySession(db) as session:
            user = session.query(User).first()
    """
    
    def __init__(self, session, max_retries: int = 2):
        self.session = session
        self.max_retries = max_retries
    
    def __enter__(self):
        return self.session
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            if isinstance(exc_val, (OperationalError, InterfaceError)):
                # Let the retry decorator handle it
                return False
            # Rollback on other errors
            try:
                self.session.rollback()
            except Exception:
                pass
        return False
