"""
Data Validation Layer (Pydantic V2 Payload Schemas)

[PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
Strict field validation schemas enforcing name regex, email syntax, program enum, and GPA range.
"""

import re
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


class ApplicationBase(BaseModel):
    """
    [PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
    Base candidate payload validator checking required fields and range constraints.
    """
    full_name: str = Field(..., min_length=2, max_length=100, description="Full legal name of the applicant")
    email: EmailStr = Field(..., max_length=255, description="Valid email address")
    program: str = Field(..., min_length=2, max_length=100, description="Degree program code")
    gpa: float = Field(..., ge=0.0, le=10.0, description="GPA on a 0.0 to 10.0 scale")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """[PRESENTATION-TAG: PYDANTIC-GATEKEEPER] Validates name contains only alphabetic characters and spaces."""
        stripped = v.strip()
        if not re.match(r"^[a-zA-Z\s.'-]+$", stripped):
            raise ValueError("Name can only contain alphabetic letters, spaces, dots, hyphens, and apostrophes.")
        return stripped

    @field_validator("program")
    @classmethod
    def validate_program(cls, v: str) -> str:
        """[PRESENTATION-TAG: PYDANTIC-GATEKEEPER] Validates program code against allowed enum whitelist."""
        normalized = v.strip().upper()
        allowed_programs = {"AI", "CS", "IT", "DATA_SCIENCE", "EXTC"}
        if normalized not in allowed_programs:
            raise ValueError(f"Program must be one of: {', '.join(sorted(allowed_programs))}")
        return normalized


class ApplicationCreate(ApplicationBase):
    """Schema for candidate creation requests."""
    pass


class ApplicationUpdate(BaseModel):
    """Schema for updating existing student records."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=255)
    program: Optional[str] = Field(None, min_length=2, max_length=100)
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0)


class ApplicationStatusUpdate(BaseModel):
    """Schema for status state machine transitions."""
    status: str = Field(..., pattern="^(SUBMITTED|UNDER_REVIEW|ACCEPTED|REJECTED)$")


class ApplicationResponse(ApplicationBase):
    """Schema for outbound JSON responses."""
    id: str
    status: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
