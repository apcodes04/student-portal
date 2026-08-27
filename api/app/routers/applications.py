"""
Application Router Endpoints with Full CRUD & Dual Path Matching

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

router = APIRouter(tags=["Applications"])


@router.get("/csrf-token", summary="Retrieve Anti-CSRF Cookie and Token")
@router.get("/applications/csrf-token", summary="Retrieve Anti-CSRF Token")
def get_csrf_token(response: Response):
    """Generates secure Anti-CSRF double-submit token."""
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
@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf_token)],
    summary="Create New Application Direct"
)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Persists new application record to Supabase PostgreSQL database."""
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


@router.get("", summary="List All Applications")
@router.get("/", summary="List All Applications Root")
@router.get("/applications", summary="List All Applications Path")
async def list_applications(db: AsyncSession = Depends(get_db)):
    """Retrieves all application records ordered by creation timestamp descending."""
    try:
        result = await db.execute(select(Application).order_by(Application.created_at.desc()))
        records = result.scalars().all()
        return [r.to_dict() for r in records]
    except Exception as e:
        print("Database query exception:", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database Connection Error: {str(e)}"
        )


@router.get("/{application_id}", summary="Get Application Details")
@router.get("/applications/{application_id}", summary="Get Application Details Path")
async def get_application(application_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves single application record by UUID."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")
    return app_record.to_dict()


@router.put("/{application_id}", summary="Update Application Record")
@router.put("/applications/{application_id}", summary="Update Application Record Path")
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
    return app_record.to_dict()


@router.patch("/{application_id}/status", summary="Update Status")
@router.patch("/applications/{application_id}/status", summary="Update Status Path")
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
    return app_record.to_dict()


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Application Record")
@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Application Record Path")
async def delete_application(application_id: str, db: AsyncSession = Depends(get_db)):
    """Deletes application record from database."""
    result = await db.execute(select(Application).where(Application.id == application_id))
    app_record = result.scalar_one_or_none()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application record not found")

    await db.delete(app_record)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
