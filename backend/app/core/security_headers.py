"""
Security Headers Middleware

Adds security headers to all HTTP responses to protect against common attacks:
- Clickjacking (X-Frame-Options)
- XSS (X-XSS-Protection, Content-Security-Policy)
- MIME sniffing (X-Content-Type-Options)
- HTTPS enforcement (Strict-Transport-Security)
- Referrer leakage (Referrer-Policy)
- Feature policy (Permissions-Policy)
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all responses.
    
    These headers protect against common web vulnerabilities and are
    recommended by OWASP for production applications.
    """
    
    def __init__(
        self,
        app,
        content_security_policy: str | None = None,
        hsts_max_age: int = 31536000,  # 1 year
        include_subdomains: bool = True,
        is_production: bool = True,
    ):
        super().__init__(app)
        self.is_production = is_production
        self.hsts_max_age = hsts_max_age
        self.include_subdomains = include_subdomains
        
        # Default CSP - restrictive but functional
        self.csp = content_security_policy or self._default_csp()
        
    def _default_csp(self) -> str:
        """Generate default Content-Security-Policy."""
        directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",  # Allow inline for API docs
            "style-src 'self' 'unsafe-inline'",   # Allow inline styles
            "img-src 'self' data: https:",        # Allow images from HTTPS
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self'",
            "frame-ancestors 'none'",             # Prevent framing
            "base-uri 'self'",
            "form-action 'self'",
        ]
        return "; ".join(directives)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS Protection (legacy, but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer Policy - don't leak referrer to third parties
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy - disable unnecessary browser features
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), "
            "gyroscope=(), magnetometer=(), microphone=(), "
            "payment=(), usb=()"
        )
        
        # Content Security Policy
        if self.is_production:
            response.headers["Content-Security-Policy"] = self.csp
        
        # HSTS - Force HTTPS (only in production)
        if self.is_production:
            hsts_value = f"max-age={self.hsts_max_age}"
            if self.include_subdomains:
                hsts_value += "; includeSubDomains"
            response.headers["Strict-Transport-Security"] = hsts_value
        
        # Prevent caching of sensitive data
        if request.url.path.startswith("/auth") or request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
        
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to limit request body size to prevent DoS attacks.
    
    Default limit: 10MB
    """
    
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check Content-Length header
        content_length = request.headers.get("content-length")
        
        if content_length:
            try:
                if int(content_length) > self.max_size:
                    logger.warning(
                        f"Request rejected: body size {content_length} exceeds limit {self.max_size}"
                    )
                    return Response(
                        content='{"error": "Request body too large", "max_size_mb": 10}',
                        status_code=413,
                        media_type="application/json"
                    )
            except ValueError:
                pass  # Invalid content-length, let it through for other validation
        
        return await call_next(request)
