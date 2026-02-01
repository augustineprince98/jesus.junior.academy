"""
Rate Limiting Module

Provides rate limiting functionality for API endpoints to prevent abuse.
Uses in-memory storage (suitable for single-instance deployments).
For production with multiple instances, use Redis.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional, Callable
from fastapi import HTTPException, Request
from functools import wraps
import time
import threading


class RateLimiter:
    """
    Simple in-memory rate limiter with automatic cleanup.

    For production with multiple backend instances, replace with Redis-based implementation.
    """

    def __init__(self, cleanup_interval: int = 300):
        # key -> list of timestamps
        self._requests: dict = defaultdict(list)
        self._lock = threading.Lock()
        self._last_cleanup = time.time()
        self._cleanup_interval = cleanup_interval  # seconds between full cleanups

    def _clean_old_requests(self, key: str, window_seconds: int):
        """Remove requests older than the time window."""
        cutoff = time.time() - window_seconds
        self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

    def _periodic_cleanup(self):
        """Remove stale keys to prevent unbounded memory growth."""
        now = time.time()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        self._last_cleanup = now
        # Remove keys with no recent requests (older than 1 hour)
        stale_cutoff = now - 3600
        stale_keys = [
            k for k, timestamps in self._requests.items()
            if not timestamps or max(timestamps) < stale_cutoff
        ]
        for k in stale_keys:
            del self._requests[k]

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Check if a request is allowed under the rate limit.

        Args:
            key: Unique identifier (e.g., IP address, user ID)
            max_requests: Maximum number of requests allowed in the window
            window_seconds: Time window in seconds

        Returns:
            True if request is allowed, False if rate limited
        """
        with self._lock:
            self._periodic_cleanup()
            self._clean_old_requests(key, window_seconds)

            if len(self._requests[key]) >= max_requests:
                return False

            self._requests[key].append(time.time())
            return True

    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining requests in the current window."""
        with self._lock:
            self._clean_old_requests(key, window_seconds)
            return max(0, max_requests - len(self._requests[key]))

    def reset(self, key: str):
        """Reset rate limit for a key."""
        with self._lock:
            self._requests[key] = []


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_identifier(request: Request) -> str:
    """
    Get a unique identifier for the client making the request.
    Uses forwarded IP if behind a proxy, otherwise uses direct IP.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Get the first IP in the chain (original client)
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(
    max_requests: int = 10,
    window_seconds: int = 60,
    key_func: Optional[Callable[[Request], str]] = None
):
    """
    Rate limiting decorator for FastAPI endpoints.

    Args:
        max_requests: Maximum number of requests allowed
        window_seconds: Time window in seconds
        key_func: Optional function to extract rate limit key from request

    Usage:
        @router.post("/login")
        @rate_limit(max_requests=5, window_seconds=60)
        async def login(request: Request, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find request in kwargs or args
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if not request:
                # If no request object, skip rate limiting
                return await func(*args, **kwargs)

            # Get rate limit key
            if key_func:
                key = key_func(request)
            else:
                key = f"{func.__name__}:{get_client_identifier(request)}"

            # Check rate limit
            if not rate_limiter.is_allowed(key, max_requests, window_seconds):
                remaining = rate_limiter.get_remaining(key, max_requests, window_seconds)
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Too many requests",
                        "retry_after": window_seconds,
                        "limit": max_requests,
                        "remaining": remaining,
                    },
                    headers={
                        "Retry-After": str(window_seconds),
                        "X-RateLimit-Limit": str(max_requests),
                        "X-RateLimit-Remaining": str(remaining),
                    },
                )

            return await func(*args, **kwargs)

        return wrapper
    return decorator


# Predefined rate limits for common scenarios

def login_rate_limit():
    """Rate limit for login attempts: 5 per minute."""
    return rate_limit(max_requests=5, window_seconds=60)


def registration_rate_limit():
    """Rate limit for registration: 3 per hour."""
    return rate_limit(max_requests=3, window_seconds=3600)


def password_reset_rate_limit():
    """Rate limit for password reset: 3 per 10 minutes."""
    return rate_limit(max_requests=3, window_seconds=600)


def api_rate_limit():
    """General API rate limit: 60 per minute."""
    return rate_limit(max_requests=60, window_seconds=60)
