"""
Application Router (Production API Endpoints)

[PRESENTATION-TAG: FASTAPI-FRAMEWORK]
[PRESENTATION-TAG: SLOWAPI-RATE-LIMITING]
[PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
[PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
[PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
"""

import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.application import Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationStatusUpdate
)
from app.core.security import limiter, verify_csrf_token, IDEMPOTENCY_STORE, settings

# [PRESENTATION-TAG: FASTAPI-FRAMEWORK] FastAPI Router Instantiation
router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/csrf-token")
def get_csrf_token(response: Response):
    """[PRESENTATION-TAG: ANTI-CSRF-PROTECTION] Generates and issues anti-CSRF token cookie."""
    token = secrets.token_hex(32)
    response.set_cookie(key="csrf_token", value=token, httponly=False, samesite="lax")
    return {"csrf_token": token}


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf_token)])
@limiter.limit(settings.RATE_LIMIT_MUTATION_PER_MINUTE)
async def create_application(
    request: Request,
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    [PRESENTATION-TAG: FASTAPI-FRAMEWORK]
    [PRESENTATION-TAG: PYDANTIC-GATEKEEPER]
    [PRESENTATION-TAG: SLOWAPI-RATE-LIMITING]
    [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
    [PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
    [PRESENTATION-TAG: SQLALCHEMY-ASYNCPG]
    Creates a new student admission application in PostgreSQL database.
    """
    # Check for active duplicate application (email + program)
    query = select(Application).where(
        and_(
            Application.email == payload.email,
            Application.program == payload.program,
            Application.is_deleted.is_(False)
        )
    )
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Active application already exists for {payload.email} in {payload.program}."
        )

    # Instantiate ORM record and save to PostgreSQL
    app_record = Application(**payload.model_dump())
    db.add(app_record)
    await db.commit()
    await db.refresh(app_record)

    # Store in Idempotency cache for double-submit prevention
    idempotency_key = request.headers.get("Idempotency-Key")
    if idempotency_key:
        IDEMPOTENCY_STORE[idempotency_key] = {
            "status_code": 201,
            "body": ApplicationResponse.model_validate(app_record).model_dump_json()
        }

    return app_record


@router.get("", response_model=List[ApplicationResponse])
@limiter.limit(settings.RATE_LIMIT_PER_MINUTE)
async def list_applications(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """[PRESENTATION-TAG: FASTAPI-FRAMEWORK] Returns paginated active student records."""
    query = select(Application).where(Application.is_deleted.is_(False)).offset(skip).limit(limit).order_by(Application.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application_by_id(app_id: str, db: AsyncSession = Depends(get_db)):
    """[PRESENTATION-TAG: FASTAPI-FRAMEWORK] Returns individual student record details."""
    query = select(Application).where(and_(Application.id == app_id, Application.is_deleted.is_(False)))
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Student record not found.")
    return record


@router.put("/{app_id}", response_model=ApplicationResponse, dependencies=[Depends(verify_csrf_token)])
async def update_application(app_id: str, payload: ApplicationUpdate, db: AsyncSession = Depends(get_db)):
    """[PRESENTATION-TAG: FASTAPI-FRAMEWORK] Updates an existing student record."""
    query = select(Application).where(and_(Application.id == app_id, Application.is_deleted.is_(False)))
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Student record not found.")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, key, value)
    await db.commit()
    await db.refresh(record)
    return record


@router.patch("/{app_id}/status", response_model=ApplicationResponse, dependencies=[Depends(verify_csrf_token)])
async def update_application_status(app_id: str, payload: ApplicationStatusUpdate, db: AsyncSession = Depends(get_db)):
    """[PRESENTATION-TAG: FASTAPI-FRAMEWORK] Transition candidate application status."""
    query = select(Application).where(and_(Application.id == app_id, Application.is_deleted.is_(False)))
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Application not found.")
    record.status = payload.status
    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_csrf_token)])
async def delete_application(app_id: str, db: AsyncSession = Depends(get_db)):
    """[PRESENTATION-TAG: POSTGRESQL-STORAGE] Performs audit-compliant soft deletion."""
    query = select(Application).where(and_(Application.id == app_id, Application.is_deleted.is_(False)))
    result = await db.execute(query)
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Application not found.")
    record.is_deleted = True
    await db.commit()
