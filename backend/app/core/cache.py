"""
Caching Module

Provides caching functionality for API responses.
Uses in-memory caching by default, can be extended for Redis.
"""

from functools import wraps
from datetime import datetime, timedelta
from typing import Any, Optional, Callable
import hashlib
import json
import threading


class InMemoryCache:
    """
    Simple in-memory cache with TTL support.

    For production with multiple instances, replace with Redis.
    """

    def __init__(self):
        self._cache: dict = {}
        self._lock = threading.Lock()

    def _make_key(self, key: str) -> str:
        """Create a hash key for longer strings."""
        if len(key) > 100:
            return hashlib.md5(key.encode()).hexdigest()
        return key

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired."""
        hashed_key = self._make_key(key)

        with self._lock:
            if hashed_key not in self._cache:
                return None

            entry = self._cache[hashed_key]
            if entry["expires_at"] < datetime.utcnow():
                del self._cache[hashed_key]
                return None

            return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        """Set value in cache with TTL."""
        hashed_key = self._make_key(key)

        with self._lock:
            self._cache[hashed_key] = {
                "value": value,
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds),
            }

    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        hashed_key = self._make_key(key)

        with self._lock:
            if hashed_key in self._cache:
                del self._cache[hashed_key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cached data."""
        with self._lock:
            self._cache.clear()

    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern prefix."""
        count = 0
        with self._lock:
            keys_to_delete = [
                k for k in self._cache.keys()
                if k.startswith(pattern)
            ]
            for key in keys_to_delete:
                del self._cache[key]
                count += 1
        return count

    def cleanup_expired(self) -> int:
        """Remove all expired entries. Returns count of removed entries."""
        count = 0
        now = datetime.utcnow()

        with self._lock:
            keys_to_delete = [
                k for k, v in self._cache.items()
                if v["expires_at"] < now
            ]
            for key in keys_to_delete:
                del self._cache[key]
                count += 1

        return count


# Global cache instance
cache = InMemoryCache()


def cached(ttl_seconds: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results.

    Args:
        ttl_seconds: Time to live in seconds
        key_prefix: Prefix for cache key

    Usage:
        @cached(ttl_seconds=600, key_prefix="events")
        async def get_events():
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]

            # Add positional args (skip first arg if it's self/cls)
            for arg in args:
                if hasattr(arg, '__dict__'):
                    # Skip complex objects like Request
                    continue
                key_parts.append(str(arg))

            # Add keyword args (skip common non-cacheable args)
            skip_kwargs = {'db', 'request', 'current_user'}
            for k, v in sorted(kwargs.items()):
                if k not in skip_kwargs:
                    key_parts.append(f"{k}={v}")

            cache_key = ":".join(key_parts)

            # Check cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)

            return result

        return wrapper
    return decorator


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate all cache entries matching a pattern.

    Usage:
        invalidate_cache("events")  # Clear all event-related cache
    """
    return cache.clear_pattern(pattern)


# Cache key builders for common patterns
def user_cache_key(user_id: int, resource: str) -> str:
    """Build cache key for user-specific data."""
    return f"user:{user_id}:{resource}"


def public_cache_key(resource: str, *identifiers) -> str:
    """Build cache key for public data."""
    parts = ["public", resource] + [str(i) for i in identifiers]
    return ":".join(parts)
