"""
Database Connection & Async Session Engine

[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
[PRESENTATION-TAG: POSTGRESQL-STORAGE]
"""

import ssl
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Configure connection args with statement_cache_size=0 and SSL for Supabase compatibility
connect_args = {
    "statement_cache_size": 0
}

# Create SSL context for Supabase Cloud PostgreSQL
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
connect_args["ssl"] = ctx

# Instantiate Async Engine with NullPool for Vercel Serverless compatibility
engine = create_async_engine(
    settings.async_database_url,
    echo=settings.DEBUG,
    poolclass=NullPool,
    connect_args=connect_args
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# ORM Base
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency provider for async SQLAlchemy database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
