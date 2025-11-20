"""
CSRF Protection Middleware for FastAPI
Implements double-submit cookie pattern for CSRF protection.
"""
import secrets
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import MutableHeaders


CSRF_TOKEN_LENGTH = 32
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}


class CSRFProtectMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection using double-submit cookie pattern.

    For state-changing requests (POST, PUT, DELETE, PATCH):
    1. Client must have CSRF cookie (set on first GET)
    2. Client must send matching token in X-CSRF-Token header

    Exceptions:
    - Health check endpoints
    - Metrics endpoint
    - API documentation
    """

    def __init__(self, app, exempt_paths: list[str] = None):
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            "/healthz",
            "/api/healthz",
            "/readyz",
            "/metrics",
            "/api/docs",
            "/api/redoc",
            "/openapi.json",
        ]

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF for safe methods
        if request.method in SAFE_METHODS:
            response = await call_next(request)

            # Set CSRF cookie if not present
            if CSRF_COOKIE_NAME not in request.cookies:
                csrf_token = secrets.token_hex(CSRF_TOKEN_LENGTH)
                response.set_cookie(
                    key=CSRF_COOKIE_NAME,
                    value=csrf_token,
                    httponly=True,
                    secure=True,  # Only over HTTPS in production
                    samesite="lax",
                    max_age=3600 * 24,  # 24 hours
                )

            return response

        # Skip CSRF for exempt paths
        if any(request.url.path.startswith(path) for path in self.exempt_paths):
            return await call_next(request)

        # Verify CSRF token for state-changing requests
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
        csrf_header = request.headers.get(CSRF_HEADER_NAME)

        if not csrf_cookie:
            raise HTTPException(
                status_code=403,
                detail="CSRF cookie missing. Please refresh the page."
            )

        if not csrf_header:
            raise HTTPException(
                status_code=403,
                detail="CSRF token missing in request header (X-CSRF-Token)"
            )

        # Constant-time comparison to prevent timing attacks
        if not secrets.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(
                status_code=403,
                detail="CSRF token mismatch. Please refresh the page."
            )

        # CSRF validation passed
        response = await call_next(request)
        return response


def get_csrf_token(request: Request) -> str:
    """Helper to get CSRF token from request cookies."""
    return request.cookies.get(CSRF_COOKIE_NAME, "")

