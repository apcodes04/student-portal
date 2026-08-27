"""
Pydantic Schema Gatekeepers (Data Validation & Contracts)

[PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
[PRESENTATION-TAG: INPUT-SANITIZATION]
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import html


class ApplicationBase(BaseModel):
    """Base Application Schema Attributes."""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    program: str = Field(..., pattern="^(CS|AI|IT|DATA_SCIENCE|EXTC)$")
    gpa: float = Field(..., ge=0.0, le=10.0)

    @field_validator("full_name")
    def sanitize_name(cls, v: str) -> str:
        """Sanitizes full_name string against XSS injection."""
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long")
        return html.escape(v)


class ApplicationCreate(ApplicationBase):
    """Schema for creating a new admission application."""
    pass


class ApplicationUpdate(BaseModel):
    """Schema for updating an existing admission application."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    program: Optional[str] = Field(None, pattern="^(CS|AI|IT|DATA_SCIENCE|EXTC)$")
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    status: Optional[str] = Field(None, pattern="^(PENDING|VERIFIED|ACCEPTED|REJECTED)$")


class ApplicationStatusUpdate(BaseModel):
    """Schema for updating application status."""
    status: str = Field(..., pattern="^(PENDING|VERIFIED|ACCEPTED|REJECTED)$")


class ApplicationResponse(ApplicationBase):
    """Schema for application response representation."""
    id: str
    status: str = "PENDING"
    created_at: datetime

    class Config:
        from_attributes = True
