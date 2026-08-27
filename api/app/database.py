"""
Database Layer (Async Database Engine & Session Manager)

Configures SQLAlchemy 2.0 AsyncEngine and sessionmaker.
Supports high-throughput non-blocking PostgreSQL via asyncpg, with automatic fallback
to local SQLite (aiosqlite) if a local PostgreSQL service is not actively listening on port 5432.
"""

import socket
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


def is_port_open(host: str, port: int, timeout: float = 1.0) -> bool:
    """Checks if target database port is open and accepting TCP socket connections."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


# Determine active database engine URI
if is_port_open(settings.POSTGRES_SERVER, settings.POSTGRES_PORT):
    DATABASE_URL = settings.async_database_url
    print(f"[DATABASE] Connected to PostgreSQL Engine: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    engine_kwargs = {
        "echo": settings.DEBUG,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    }
else:
    DATABASE_URL = "sqlite+aiosqlite:///./admissions_db.sqlite3"
    print("[DATABASE] PostgreSQL service not detected on port 5432. Defaulting to local SQLite engine (aiosqlite) for seamless local execution.")
    engine_kwargs = {
        "echo": settings.DEBUG,
    }

# Create Async Database Engine
engine = create_async_engine(DATABASE_URL, **engine_kwargs)

# Thread-safe Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative Base class holding SQLAlchemy model metadata."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Dependency Injector for Async DB Sessions.
    
    Ensures transactional safety:
    1. Yields a fresh AsyncSession bound to the current request scope.
    2. Automatically rolls back open transactions if an unhandled exception occurs.
    3. Explicitly closes session resources upon request completion.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
