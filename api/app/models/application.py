"""
Application Database Models (SQLAlchemy ORM)

[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
[PRESENTATION-TAG: POSTGRESQL-STORAGE]
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from app.core.database import Base


class Application(Base):
    """
    Application ORM entity representing student admission filings in Supabase PostgreSQL.
    """
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    program = Column(String(50), nullable=False, index=True)
    gpa = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        """Converts ORM model instance into dictionary representation."""
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "program": self.program,
            "gpa": self.gpa,
            "status": self.status or "PENDING",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
