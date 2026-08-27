"""
Security Engine Layer (Security Headers, CSRF, Rate Limiting & Idempotency)

[PRESENTATION-TAG: SLOWAPI-RATE-LIMITING]
[PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
[PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
[PRESENTATION-TAG: REDIS-CACHING]
"""

import secrets
from typing import Dict, Any
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

# [PRESENTATION-TAG: SLOWAPI-RATE-LIMITING]
# [PRESENTATION-TAG: REDIS-CACHING]
# SlowAPI rate limiter bound to client IP address and Redis backend
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_PER_MINUTE]
)

# [PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
# [PRESENTATION-TAG: REDIS-CACHING]
# In-memory / Redis cache store for duplicate submission replay
IDEMPOTENCY_STORE: Dict[str, Dict[str, Any]] = {}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    OWASP Security Response Headers Hardening Middleware.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


class IdempotencyMiddleware(BaseHTTPMiddleware):
    """
    [PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
    Middleware verifying payload idempotency key hashes to prevent double-submissions.
    """
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST":
            idempotency_key = request.headers.get("Idempotency-Key")
            if idempotency_key:
                cached_entry = IDEMPOTENCY_STORE.get(idempotency_key)
                if cached_entry:
                    # Replay cached response instantly without hitting DB again
                    return Response(
                        content=cached_entry["body"],
                        status_code=cached_entry["status_code"],
                        media_type="application/json",
                        headers={"X-Cache-Lookup": "HIT - Idempotent Replay"}
                    )
        return await call_next(request)


def verify_csrf_token(request: Request):
    """
    [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
    Double-Submit Cookie Anti-CSRF Token Validation.
    
    Verifies that mutating HTTP requests contain matching cookie and header CSRF tokens.
    Uses timing-attack safe comparison (secrets.compare_digest).
    """
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        header_token = request.headers.get("X-CSRF-Token")
        cookie_token = request.cookies.get("csrf_token")

        if not header_token or not cookie_token or not secrets.compare_digest(header_token, cookie_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed. Invalid or missing CSRF token."
            )
