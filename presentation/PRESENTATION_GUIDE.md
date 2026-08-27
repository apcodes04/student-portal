# System Architecture & Module Presentation Guide

## 1. System High-Level Architecture

```text
[ Client Layer ]              [ Middleware & Security Layer ]         [ Application & DB Layer ]
┌─────────────────────────┐   ┌───────────────────────────────┐   ┌─────────────────────────────┐
│ React.js Frontend       │   │  Security Headers Middleware  │   │ FastAPI APIRouter           │
│  - Controlled Inputs    ├──►│  Double-Submit Anti-CSRF      ├──►│  - Pydantic V2 Schemas      │
│  - Contextual Sanitizer │   │  Idempotency Engine (Cache)   │   │  - Async SQLAlchemy 2.0 ORM │
│  - Real-time Validation │   │  SlowAPI Rate Limiter         │   │  - PostgreSQL (asyncpg)     │
│  - Axios Interceptors   │   └───────────────────────────────┘   └─────────────────────────────┘
└─────────────────────────┘
```

---

## 2. End-to-End Execution Workflow

1. **Initialization Phase**:
   - Client loads React application. Axios interceptor triggers a background `GET /applications/csrf-token` request to acquire an anti-CSRF token cookie and response payload.

2. **User Data Entry Phase**:
   - The candidate enters form data.
   - `sanitizeInput()` instantly strips any dangerous script tags (`<script>`) or HTML angle brackets (`<>`) to block XSS attacks before updating React local state.
   - Synchronous validators run on every keystroke, rendering dynamic field-specific error warnings directly under text zones if Pydantic rules are violated.

3. **Form Submission Phase**:
   - The user clicks **Submit Application**.
   - **Loading State Manager** immediately sets `isLoading = true`, disabling the button to prevent accidental double-clicks.
   - Axios generates a deterministic Base64 `Idempotency-Key` header based on the payload content.
   - Axios attaches the `X-CSRF-Token` header read from cookies.

4. **Backend Processing Phase**:
   - `SecurityHeadersMiddleware` validates HTTP safety headers.
   - `IdempotencyMiddleware` checks if the `Idempotency-Key` exists in cache. If found, it immediately replays the cached 201 response.
   - `verify_csrf_token` compares the header token with the cookie token using constant-time timing-attack safe comparison.
   - `limiter` verifies client IP quota (20 POST requests / min).
   - FastAPI validates body against `ApplicationCreate` Pydantic V2 schema. If invalid, custom 422 JSON is returned with field error mapping.
   - SQLAlchemy Async Engine executes duplicate check query against partial index `idx_email_program_active`.
   - If clear, record is inserted into `applications` table and committed asynchronously.

5. **Response Phase**:
   - Response status `201 Created` is returned to client along with saved record details.
   - Frontend displays success notification banner with full HTTP status code and resets form fields.

---

## 3. Detailed Module Breakdown

### Backend Modules (`backend/app/`)

| Module Path | Primary Responsibility | Key Features & Implementation Details |
| :--- | :--- | :--- |
| `core/config.py` | Configuration Layer | Uses `pydantic-settings` to validate environment variables (`.env`) on boot. Configures DB pool sizes, CORS origins, and Redis URLs. |
| `core/database.py` | Database Layer | Creates SQLAlchemy 2.0 `AsyncEngine` with `asyncpg` driver (auto-falls back to `aiosqlite` if PG port 5432 is inactive). |
| `core/security.py` | Security & Middleware Layer | Implements `SecurityHeadersMiddleware` (OWASP headers), `IdempotencyMiddleware` (prevents double creation), `verify_csrf_token` (anti-CSRF), and `slowapi` rate limiter. |
| `models/application.py` | ORM Data Model Layer | Defines PostgreSQL table schema `applications` with `idx_email_program_active` compound partial index for high-performance duplicate filtering. |
| `schemas/application.py` | Data Validation Layer | Strict Pydantic V2 schemas (`ApplicationCreate`, `ApplicationResponse`, `StandardErrorResponse`). Field regex validators for full name and program enums. |
| `routers/applications.py` | API Controller Endpoints | RESTful endpoints (`POST /applications`, `GET /applications`, `PATCH /applications/{id}/status`, `DELETE /applications/{id}`). Enforces soft deletion. |
| `main.py` | App Instantiation & Pipeline | Instantiates FastAPI, attaches CORS & security middleware, handles database lifespan hooks, and formats custom 422/429 error responses. |

### Frontend Modules (`frontend/src/`)

| Module Path | Primary Responsibility | Key Features & Implementation Details |
| :--- | :--- | :--- |
| `utils/sanitize.js` | Anti-XSS Sanitizer | Trims whitespace and strips executable HTML/script tags from user text input before state storage. |
| `api/client.js` | Network Client | Axios instance configured with CORS credentials, automated anti-CSRF token fetching, and deterministic `Idempotency-Key` generation. |
| `components/AdmissionForm.jsx` | Controlled Form Component | Controlled input state, real-time dynamic error rendering matching Pydantic rules, instant submit button disabling (loading state), and backend 422 field error mapping. |
| `App.jsx` | Main Application View | Layout component mounting `AdmissionForm` and Applications Registry table with real-time status updates and single Delete action (soft delete). |

---

## 4. Special Presentation Topic: Soft Delete vs. Hard Delete Architecture

### Why Production Systems Enforce Soft Delete on User-Facing UI
In modern enterprise applications, user-facing interfaces should **NEVER** trigger hard physical deletion of database rows. The user-facing **Delete** button triggers a **Soft Delete** by setting `is_deleted = True`.

**Key Benefits of Soft Deletion**:
1. **Data Auditability & Compliance**: Preserves historical candidate records for regulatory audits (e.g., higher education admission standards).
2. **Accidental Deletion Recovery**: Enables database administrators to restore accidentally deleted applications (`UPDATE applications SET is_deleted = false WHERE id = '...';`).
3. **Relational Data Integrity**: Prevents broken foreign-key constraint cascades across related tables (e.g., student documents, payment receipts, test scores).

---

### How to Perform Hard Deletion (Permanent Row Removal)

When a permanent purge is legally required (e.g., GDPR "Right to be Forgotten" or database maintenance), DBAs and authorized services execute **Hard Deletes**.

#### Option A: Direct SQL Command (via PostgreSQL `psql` or Database GUI)
```sql
-- 1. Hard delete a specific candidate application by ID
DELETE FROM applications 
WHERE id = '7bd240de-1ac4-4c29-afc3-ed73efdad179';

-- 2. Hard delete all soft-deleted records older than 90 days (Automated Data Retention Cleanup)
DELETE FROM applications 
WHERE is_deleted = true 
  AND updated_at < NOW() - INTERVAL '90 days';
```

#### Option B: Admin Maintenance Script (Python Async SQLAlchemy)
```python
from sqlalchemy import delete
from app.core.database import AsyncSessionLocal
from app.models.application import Application

async def hard_delete_candidate(application_id: str):
    """Admin utility function to permanently purge a row from database."""
    async with AsyncSessionLocal() as session:
        stmt = delete(Application).where(Application.id == application_id)
        result = await session.execute(stmt)
        await session.commit()
        print(f"Hard deleted {result.rowcount} row(s) for ID: {application_id}")
```

---

## 5. Key Security & Performance Highlights for Slides / Presentation

1. **Fail-Fast Environment Validation**: `pydantic-settings` prevents the server from starting with missing credentials or misconfigured DB URLs.
2. **High-Concurrency Non-Blocking I/O**: `asyncpg` + `SQLAlchemy 2.0` handles thousands of concurrent requests with low latency memory overhead.
3. **OWASP Security Alignment**: Double-submit CSRF protection, OWASP security headers, and anti-XSS client sanitization.
4. **Network Resilience & Idempotency**: Guaranteed zero duplicate submissions under network jitter due to deterministic idempotency key tracking.
5. **Real-time UX**: Instant field feedback before submission reduces server load and improves candidate submission success rates.
