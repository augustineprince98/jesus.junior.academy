"""
Cache Tests

Tests for the caching functionality.
"""

import pytest
import time
from app.core.cache import InMemoryCache, cache, invalidate_cache, user_cache_key, public_cache_key


class TestInMemoryCache:
    """Tests for the InMemoryCache class."""

    def test_set_and_get(self):
        """Test setting and getting a value."""
        test_cache = InMemoryCache()
        test_cache.set("test:key", "test_value", ttl_seconds=300)

        result = test_cache.get("test:key")
        assert result == "test_value"

    def test_get_nonexistent(self):
        """Test getting a key that doesn't exist."""
        test_cache = InMemoryCache()

        result = test_cache.get("nonexistent:key")
        assert result is None

    def test_ttl_expiry(self):
        """Test that values expire after TTL."""
        test_cache = InMemoryCache()
        test_cache.set("test:expire", "value", ttl_seconds=1)

        # Should be available immediately
        assert test_cache.get("test:expire") == "value"

        # Wait for expiry
        time.sleep(1.1)

        # Should be expired
        assert test_cache.get("test:expire") is None

    def test_delete(self):
        """Test deleting a key."""
        test_cache = InMemoryCache()
        test_cache.set("test:delete", "value")

        assert test_cache.get("test:delete") == "value"

        result = test_cache.delete("test:delete")
        assert result is True

        assert test_cache.get("test:delete") is None

    def test_delete_nonexistent(self):
        """Test deleting a nonexistent key."""
        test_cache = InMemoryCache()

        result = test_cache.delete("nonexistent:key")
        assert result is False

    def test_clear(self):
        """Test clearing all cache."""
        test_cache = InMemoryCache()
        test_cache.set("key1", "value1")
        test_cache.set("key2", "value2")

        test_cache.clear()

        assert test_cache.get("key1") is None
        assert test_cache.get("key2") is None

    def test_clear_pattern(self):
        """Test clearing keys matching a pattern."""
        test_cache = InMemoryCache()
        test_cache.set("events:1", "event1")
        test_cache.set("events:2", "event2")
        test_cache.set("users:1", "user1")

        count = test_cache.clear_pattern("events")

        assert count == 2
        assert test_cache.get("events:1") is None
        assert test_cache.get("events:2") is None
        assert test_cache.get("users:1") == "user1"

    def test_complex_values(self):
        """Test caching complex values like dicts and lists."""
        test_cache = InMemoryCache()

        complex_value = {
            "id": 1,
            "items": [1, 2, 3],
            "nested": {"key": "value"}
        }

        test_cache.set("complex", complex_value)
        result = test_cache.get("complex")

        assert result == complex_value
        assert result["nested"]["key"] == "value"


class TestGlobalCache:
    """Tests for the global cache instance."""

    def test_global_cache_exists(self):
        """Test global cache is accessible."""
        assert cache is not None
        assert isinstance(cache, InMemoryCache)


class TestCacheKeyBuilders:
    """Tests for cache key builder functions."""

    def test_user_cache_key(self):
        """Test building user-specific cache keys."""
        key = user_cache_key(123, "results")
        assert key == "user:123:results"

    def test_public_cache_key(self):
        """Test building public cache keys."""
        key = public_cache_key("events", "upcoming")
        assert key == "public:events:upcoming"

        key_with_id = public_cache_key("event", 42)
        assert key_with_id == "public:event:42"


class TestInvalidateCache:
    """Tests for cache invalidation."""

    def test_invalidate_cache(self):
        """Test invalidating cache by pattern."""
        # Set some values in global cache
        cache.set("test:inv:1", "value1")
        cache.set("test:inv:2", "value2")
        cache.set("other:1", "other")

        count = invalidate_cache("test:inv")

        assert count == 2
        assert cache.get("test:inv:1") is None
        assert cache.get("other:1") == "other"
