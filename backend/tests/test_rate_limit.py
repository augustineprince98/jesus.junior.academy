"""
Rate Limiting Tests

Tests for the rate limiting functionality.
"""

import pytest
from app.core.rate_limit import RateLimiter, rate_limiter


class TestRateLimiter:
    """Tests for the RateLimiter class."""

    def test_allow_within_limit(self):
        """Test requests within limit are allowed."""
        limiter = RateLimiter()
        key = "test:allow"

        # Should allow up to max_requests
        for i in range(5):
            assert limiter.is_allowed(key, max_requests=5, window_seconds=60)

        # Next request should be denied
        assert not limiter.is_allowed(key, max_requests=5, window_seconds=60)

    def test_get_remaining(self):
        """Test getting remaining requests."""
        limiter = RateLimiter()
        key = "test:remaining"

        assert limiter.get_remaining(key, max_requests=10, window_seconds=60) == 10

        limiter.is_allowed(key, max_requests=10, window_seconds=60)
        assert limiter.get_remaining(key, max_requests=10, window_seconds=60) == 9

    def test_reset(self):
        """Test resetting rate limit for a key."""
        limiter = RateLimiter()
        key = "test:reset"

        # Use up all requests
        for i in range(5):
            limiter.is_allowed(key, max_requests=5, window_seconds=60)

        assert not limiter.is_allowed(key, max_requests=5, window_seconds=60)

        # Reset
        limiter.reset(key)

        # Should be allowed again
        assert limiter.is_allowed(key, max_requests=5, window_seconds=60)

    def test_different_keys_independent(self):
        """Test that different keys have independent limits."""
        limiter = RateLimiter()
        key1 = "test:key1"
        key2 = "test:key2"

        # Use up key1's limit
        for i in range(3):
            limiter.is_allowed(key1, max_requests=3, window_seconds=60)

        assert not limiter.is_allowed(key1, max_requests=3, window_seconds=60)

        # Key2 should still have full limit
        assert limiter.is_allowed(key2, max_requests=3, window_seconds=60)


class TestGlobalRateLimiter:
    """Tests for the global rate limiter instance."""

    def test_global_limiter_exists(self):
        """Test global rate limiter is accessible."""
        assert rate_limiter is not None
        assert isinstance(rate_limiter, RateLimiter)

    def test_global_limiter_cleanup(self):
        """Test cleanup of expired entries."""
        key = "test:cleanup"

        # Add some requests
        rate_limiter.is_allowed(key, max_requests=10, window_seconds=1)

        # Cleanup shouldn't fail
        count = rate_limiter.cleanup_expired()
        assert count >= 0
