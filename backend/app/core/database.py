"""
Database Layer (Async PostgreSQL Engine & Session Manager)

[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
Configures SQLAlchemy 2.0 AsyncEngine and sessionmaker exclusively for PostgreSQL
using the high-throughput non-blocking asyncpg driver with PgBouncer compatibility.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# [PRESENTATION-TAG: POSTGRESQL-STORAGE] Enforce PostgreSQL Async Connection URL
DATABASE_URL = settings.async_database_url

# [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG] Async Engine and Connection Pool Tuning
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=True,      # Tests connection health before checkout
    pool_recycle=1800,       # Recycles connections every 30 mins
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }
)

# [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG] Thread-safe Async Session Factory
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
    [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
    FastAPI Dependency Injector for Async DB Sessions.
    
    1. Yields a fresh non-blocking AsyncSession bound to request scope.
    2. Auto-rolls back open transactions on unhandled exceptions.
    3. Closes session resources cleanly upon request completion.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
