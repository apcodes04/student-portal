# Architectural Migration Guide & Master Prompt

## 1. Executive Summary & Architecture Refactor
This document outlines the end-to-end refactoring of the **Student Admission System** from a basic single-file SQLite script into a production-grade, multi-tier micro-architecture.

### Core Architectural Upgrades
- **Database Engine**: Migrated from synchronous SQLite (`sqlite3`) to high-throughput **PostgreSQL** using non-blocking `asyncpg` and connection pooling (`pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`).
- **Schema & Migrations**: Integrated **Alembic** for automated SQL schema migrations and version tracking.
- **Configuration Management**: 12-Factor compliant setup using `pydantic-settings` to validate environment variables at startup.
- **Security Middleware Suite**:
  - OWASP Security Headers (HSTS, NoSniff, FrameGuard, XSS Protection).
  - Double-Submit Cookie Anti-CSRF verification (`X-CSRF-Token` header + `csrf_token` cookie).
  - Distributed / In-Memory `Idempotency-Key` caching to prevent duplicate record generation on network retries.
  - IP Rate Limiting via `slowapi` (20 req/min for mutations, 60 req/min for reads).
- **React Frontend**:
  - Controlled component state.
  - Client-side Anti-XSS contextual input sanitization.
  - Real-time inline dynamic field validation matching backend Pydantic schemas.
  - Instant loading state button disabler preventing double submissions.
  - Axios HTTP client with automated CSRF & Idempotency key interceptors.

---

## 2. Docker & Local Execution Guide

### Running with Docker Compose (Recommended)
```bash
# Spin up PostgreSQL, Redis, and FastAPI Backend containers
docker-compose up --build -d

# Verify container health
docker-compose ps
```

### Running Locally without Docker
```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Run Alembic Database Migrations (ensure PostgreSQL is running)
alembic upgrade head

# 3. Launch FastAPI Server
uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload

# 4. Launch React Frontend
cd ../frontend
npm install
npm run dev
```

---

## 3. Anti-Gravity Master Prompt

```text
Act as a Principal Full-Stack Engineer. Refactor or scale the Student Admission System adhering strictly to these constraints:

1. FastAPI Backend Architecture:
   - Use asyncpg driver with SQLAlchemy 2.0 AsyncSession and connection pooling.
   - Enforce 12-factor configuration using pydantic-settings.
   - Implement slowapi rate limiting, double-submit cookie anti-CSRF, and idempotency key caching middleware.

2. React Frontend Component Layer:
   - Controlled Component Pattern: map every form input directly to local component state.
   - Real-Time Dynamic Validation: render inline error messages matching backend Pydantic V2 schemas (Name min 2 chars alpha-only, Email syntax, Program enum, GPA float 0.00-10.00).
   - Anti-XSS Sanitization: strip script tags and angle brackets before updating state.
   - Loading State Manager: disable submit button immediately on click.
   - Axios Interceptors: auto-fetch X-CSRF-Token and compute deterministic Idempotency-Key.
```
