"""
Configuration Module (12-Factor App Architecture)

[PRESENTATION-TAG: REDIS-CACHING]
Configuration for Redis cache, slowapi rate limits, and live Supabase PostgreSQL connection params.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized Application Settings.
    """
    PROJECT_NAME: str = "Student Admission System - Enterprise API"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    DEBUG: bool = False

    # Server Network Binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Single Database URL override for Vercel/Supabase
    DATABASE_URL: Optional[str] = None

    # PostgreSQL Connection Parameters (Supabase Direct DB Host)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "SuperSecretPass123!"
    POSTGRES_SERVER: str = "db.kljmfwzinfdyemuvglvw.supabase.co"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "postgres"

    # Connection Pool Tuning
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_TIMEOUT: int = 30

    # Redis Cache & Rate Limit Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_PER_MINUTE: str = "60/minute"
    RATE_LIMIT_MUTATION_PER_MINUTE: str = "20/minute"

    # Anti-CSRF Token Credentials & Universal CORS
    CORS_ORIGINS: List[str] = ["*"]
    CSRF_SECRET_KEY: str = "SUPER_SECRET_CSRF_KEY_CHANGE_IN_PRODUCTION_MIN_32_CHARS"
    
    # Idempotency Expiry
    IDEMPOTENCY_EXPIRE_SECONDS: int = 86400

    @property
    def async_database_url(self) -> str:
        """[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG] Asynchronous PostgreSQL connection string using asyncpg driver."""
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """Returns a cached instance of settings configuration object."""
    return Settings()


settings = get_settings()
