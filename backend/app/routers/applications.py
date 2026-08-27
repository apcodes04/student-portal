"""
Application Router Endpoints with Full CRUD & Status Operations

[PRESENTATION-TAG: FASTAPI-FRAMEWORK]
[PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
"""

import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.application import Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationStatusUpdate,
    ApplicationResponse,
)
from app.core.security import verify_csrf_token

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/csrf-token", summary="Retrieve Anti-CSRF Cookie and Token")
def get_csrf_token(response: Response):
    """
    [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
    Generates a secure cryptographically random CSRF token and sets double-submit cookie.
    """
    csrf_token = secrets.token_hex(32)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/"
    )
    return {"csrf_token": csrf_token}


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf_token)],
    summary="Create New Application"
)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
    Persists new application record to Supabase PostgreSQL database.
    """
    new_app = Application(
        full_name=payload.full_name,
        email=payload.email,
        program=payload.program,
        gpa=payload.gpa,
        status="PENDING"
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    return new_app


@router.get("", response_model=List[ApplicationResponse], summary="List All Applications")
async def list_applications(db: AsyncSession = Depends(get_db)):
    """
    [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
    Retrieves all application records ordered by creation timestamp descending.
    """
    result = await db.execute(select(Application).order_by(Application.created_at.desc()))
    return result.scalars().all()


@router.get("/{application_id}", response_model=ApplicationResponse, summary="Get Application Details")
async def get_application(application_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves single application record by UUID."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")
    return app_record


@router.put("/{application_id}", response_model=ApplicationResponse, summary="Update Application Record")
async def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Updates application record parameters."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    if payload.full_name is not None:
        app_record.full_name = payload.full_name
    if payload.email is not None:
        app_record.email = payload.email
    if payload.program is not None:
        app_record.program = payload.program
    if payload.gpa is not None:
        app_record.gpa = payload.gpa
    if payload.status is not None:
        app_record.status = payload.status

    await db.commit()
    await db.refresh(app_record)
    return app_record


@router.patch("/{application_id}/status", response_model=ApplicationResponse, summary="Update Status")
async def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Updates status field (PENDING -> VERIFIED / ACCEPTED / REJECTED)."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    app_record.status = payload.status
    await db.commit()
    await db.refresh(app_record)
    return app_record


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Application Record")
async def delete_application(application_id: str, db: AsyncSession = Depends(get_db)):
    """Deletes application record from database."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    await db.delete(app_record)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
