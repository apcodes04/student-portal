"""
FastAPI Application Entry Point & Lifespan Hooks

[PRESENTATION-TAG: FASTAPI-FRAMEWORK]
[PRESENTATION-TAG: SLOWAPI-RATE-LIMITING]
[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
"""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base
from app.core.security import limiter, SecurityHeadersMiddleware, IdempotencyMiddleware
from app.routers import applications

# Service boot timestamp for uptime observability
START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
    Application Lifespan Event Handler.
    Executes database schema migration table creation on startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


# [PRESENTATION-TAG: FASTAPI-FRAMEWORK] Instantiate FastAPI Core Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# [PRESENTATION-TAG: SLOWAPI-RATE-LIMITING] Bind SlowAPI Limiter State
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# [PRESENTATION-TAG: FASTAPI-FRAMEWORK] Security & Idempotency Middlewares
app.add_middleware(IdempotencyMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# [PRESENTATION-TAG: FASTAPI-FRAMEWORK] Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    [PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
    Custom Exception Handler mapping 422 schema validation errors cleanly for frontend display.
    """
    formatted_errors = []
    for error in exc.errors():
        field_name = " -> ".join([str(loc) for loc in error["loc"] if loc != "body"])
        formatted_errors.append({
            "field": field_name,
            "message": error["msg"].replace("Value error, ", "")
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status_code": 422,
            "error": "Unprocessable Entity - Schema Validation Failed",
            "details": formatted_errors
        }
    )


# Register Application Routers
app.include_router(applications.router)


@app.get("/", tags=["Health"])
def read_root():
    return {"message": "Student Admission System API is running cleanly."}


@app.get("/health", tags=["Health"])
def health_check():
    """Enterprise Uptime Observability Endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "database": "PostgreSQL (asyncpg driver)",
        "environment": settings.ENVIRONMENT
    }
