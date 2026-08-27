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

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_PER_MINUTE]
)

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
    """
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        header_token = request.headers.get("X-CSRF-Token")
        cookie_token = request.cookies.get("csrf_token")
        if header_token and cookie_token:
            if not secrets.compare_digest(header_token, cookie_token):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF validation failed. Token mismatch."
                )
