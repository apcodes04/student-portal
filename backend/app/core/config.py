"""
Application System Configuration Settings

[PRESENTATION-TAG: FASTAPI-FRAMEWORK]
[PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    [PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
    Type-safe configuration gatekeeper parsing environment variables.
    """
    PROJECT_NAME: str = "Student Admission System - Enterprise API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: Optional[str] = None

    # IPv4 Pooler configuration for Supabase PostgreSQL (IPv4 compatible with Render/AWS/Vercel)
    POSTGRES_USER: str = "postgres.kljmfwzinfdyemuvglvw"
    POSTGRES_PASSWORD: str = "SuperSecretPass123!"
    POSTGRES_SERVER: str = "aws-0-ap-south-1.pooler.supabase.com"
    POSTGRES_PORT: int = 6543
    POSTGRES_DB: str = "postgres"

    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_TIMEOUT: int = 30

    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_PER_MINUTE: str = "60/minute"
    RATE_LIMIT_MUTATION_PER_MINUTE: str = "20/minute"

    CORS_ORIGINS: List[str] = ["*"]
    CSRF_SECRET_KEY: str = "SUPER_SECRET_CSRF_KEY_CHANGE_IN_PRODUCTION_MIN_32_CHARS"
    
    IDEMPOTENCY_EXPIRE_SECONDS: int = 86400

    @property
    def async_database_url(self) -> str:
        """Constructs asyncpg async database URL for SQLAlchemy engine."""
        if self.DATABASE_URL:
            url = self.DATABASE_URL.strip().strip("'").strip('"')
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
