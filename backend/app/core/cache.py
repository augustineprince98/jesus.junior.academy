"""
Caching Module

Provides caching functionality for API responses.
Uses in-memory caching by default, can be extended for Redis.
"""

from functools import wraps
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
import hashlib
import inspect
import threading
import logging

from app.core.constants import CacheTTL

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheStats:
    """Track cache statistics."""
    
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.sets = 0
        self.deletes = 0
        self._lock = threading.Lock()
    
    def record_hit(self):
        with self._lock:
            self.hits += 1
    
    def record_miss(self):
        with self._lock:
            self.misses += 1
    
    def record_set(self):
        with self._lock:
            self.sets += 1
    
    def record_delete(self):
        with self._lock:
            self.deletes += 1
    
    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate as percentage."""
        total = self.hits + self.misses
        if total == 0:
            return 0.0
        return (self.hits / total) * 100
    
    def to_dict(self) -> Dict[str, Any]:
        """Return stats as dictionary."""
        return {
            "hits": self.hits,
            "misses": self.misses,
            "sets": self.sets,
            "deletes": self.deletes,
            "hit_rate": f"{self.hit_rate:.1f}%",
        }


class InMemoryCache:
    """
    Thread-safe in-memory cache with TTL support.

    For production with multiple instances, replace with Redis.
    """

    def __init__(self, max_size: int = 10000):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._max_size = max_size
        self.stats = CacheStats()

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
                self.stats.record_miss()
                return None

            entry = self._cache[hashed_key]
            if entry["expires_at"] < datetime.utcnow():
                del self._cache[hashed_key]
                self.stats.record_miss()
                return None

            self.stats.record_hit()
            return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = CacheTTL.DEFAULT) -> None:
        """Set value in cache with TTL."""
        hashed_key = self._make_key(key)

        with self._lock:
            # Evict old entries if cache is full
            if len(self._cache) >= self._max_size:
                self._evict_expired()
                # If still full, remove oldest entries
                if len(self._cache) >= self._max_size:
                    self._evict_oldest(count=self._max_size // 10)
            
            self._cache[hashed_key] = {
                "value": value,
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl_seconds),
                "created_at": datetime.utcnow(),
            }
            self.stats.record_set()

    def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        hashed_key = self._make_key(key)

        with self._lock:
            if hashed_key in self._cache:
                del self._cache[hashed_key]
                self.stats.record_delete()
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
        with self._lock:
            return self._evict_expired()

    def _evict_expired(self) -> int:
        """Internal: Remove expired entries (must hold lock)."""
        count = 0
        now = datetime.utcnow()
        keys_to_delete = [
            k for k, v in self._cache.items()
            if v["expires_at"] < now
        ]
        for key in keys_to_delete:
            del self._cache[key]
            count += 1
        return count
    
    def _evict_oldest(self, count: int) -> None:
        """Internal: Remove oldest entries (must hold lock)."""
        sorted_entries = sorted(
            self._cache.items(),
            key=lambda x: x[1].get("created_at", datetime.min)
        )
        for key, _ in sorted_entries[:count]:
            del self._cache[key]

    def size(self) -> int:
        """Get current cache size."""
        with self._lock:
            return len(self._cache)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            return {
                **self.stats.to_dict(),
                "size": len(self._cache),
                "max_size": self._max_size,
            }


# Global cache instance
cache = InMemoryCache()


def cached(ttl_seconds: int = CacheTTL.DEFAULT, key_prefix: str = ""):
    """
    Decorator to cache async function results.

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
            cache_key = _build_cache_key(func, key_prefix, args, kwargs)

            # Check cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            logger.debug(f"Cache set: {cache_key}")

            return result

        return wrapper
    return decorator


def cached_sync(ttl_seconds: int = CacheTTL.DEFAULT, key_prefix: str = ""):
    """
    Decorator to cache sync function results.

    Args:
        ttl_seconds: Time to live in seconds
        key_prefix: Prefix for cache key

    Usage:
        @cached_sync(ttl_seconds=600, key_prefix="users")
        def get_user(user_id: int):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = _build_cache_key(func, key_prefix, args, kwargs)

            # Check cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            logger.debug(f"Cache set: {cache_key}")

            return result

        return wrapper
    return decorator


def _build_cache_key(
    func: Callable,
    key_prefix: str,
    args: tuple,
    kwargs: dict
) -> str:
    """Build cache key from function and arguments."""
    key_parts = [key_prefix or func.__name__]

    # Add positional args (skip complex objects)
    for arg in args:
        if hasattr(arg, '__dict__'):
            continue
        key_parts.append(str(arg))

    # Add keyword args (skip non-cacheable args)
    skip_kwargs = {'db', 'request', 'current_user', 'session'}
    for k, v in sorted(kwargs.items()):
        if k not in skip_kwargs:
            key_parts.append(f"{k}={v}")

    return ":".join(key_parts)


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate all cache entries matching a pattern.

    Usage:
        invalidate_cache("events")  # Clear all event-related cache
    """
    count = cache.clear_pattern(pattern)
    logger.debug(f"Invalidated {count} cache entries matching: {pattern}")
    return count


def get_or_set(
    key: str,
    factory: Callable[[], T],
    ttl_seconds: int = CacheTTL.DEFAULT
) -> T:
    """
    Get value from cache or compute and cache it.
    
    Args:
        key: Cache key
        factory: Function to compute value if not cached
        ttl_seconds: Time to live
    
    Usage:
        user = get_or_set(f"user:{user_id}", lambda: db.get(User, user_id))
    """
    cached_value = cache.get(key)
    if cached_value is not None:
        return cached_value
    
    value = factory()
    cache.set(key, value, ttl_seconds)
    return value


# Cache key builders for common patterns
def user_cache_key(user_id: int, resource: str) -> str:
    """Build cache key for user-specific data."""
    return f"user:{user_id}:{resource}"


def public_cache_key(resource: str, *identifiers) -> str:
    """Build cache key for public data."""
    parts = ["public", resource] + [str(i) for i in identifiers]
    return ":".join(parts)


def class_cache_key(class_id: int, resource: str) -> str:
    """Build cache key for class-specific data."""
    return f"class:{class_id}:{resource}"


def academic_year_cache_key(year_id: int, resource: str) -> str:
    """Build cache key for academic year-specific data."""
    return f"academic_year:{year_id}:{resource}"
