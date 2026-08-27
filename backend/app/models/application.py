"""
Application ORM Model (PostgreSQL Relational Schema & Indexes)

[PRESENTATION-TAG: POSTGRESQL-STORAGE]
Defines candidate records with partial compound indexing for fast duplicate checks.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Application(Base):
    """
    [PRESENTATION-TAG: POSTGRESQL-STORAGE]
    SQLAlchemy 2.0 Application ORM Model for PostgreSQL.
    """
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    program: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    gpa: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUBMITTED", nullable=False)
    
    # Soft deletion audit flag
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)
    
    # Timezone-aware audit timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    __table_args__ = (
        # [PRESENTATION-TAG: POSTGRESQL-STORAGE]
        # Partial compound index targeting active records (is_deleted = false)
        Index(
            "idx_email_program_active",
            "email",
            "program",
            "is_deleted",
            postgresql_where=(is_deleted.is_(False))
        ),
    )
