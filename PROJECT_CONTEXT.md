# Webflow SEO Alt Text Tool - Project Context

## What We're Building
Internal web app that:
1. Connects to Webflow CMS collections
2. Shows current alt text in clean UI
3. Generates SEO-friendly alt text using AI (OpenAI Vision)
4. Lets users preview, edit, and selectively apply changes
5. Prevents accidental overwrites with opt-in design

## Current Progress
- [x] **Phase 1: Backend Foundation + Frontend Scaffold + Docker**
  - FastAPI skeleton with health check and root endpoints
  - Pydantic models for CMS items, jobs, proposals
  - Configuration management (env-based settings)
  - Webflow API client with mock support
  - React + Vite + Tailwind CSS frontend scaffold
  - Dockerfiles + docker-compose.yml
- [x] **Phase 2: Core API Endpoints + Frontend Wiring**
  - Items endpoint (GET /api/v1/items) with pagination
  - Job creation/status/proposals endpoints
  - Real Webflow API integration (all 4 image fields)
  - OpenAI Vision integration (gpt-4o-mini)
  - Frontend: load items, select, generate, edit proposals, apply
  - Apply proposals to Webflow CMS with auto-publish
- [x] **Phase 3: Background Processing with Celery + Redis**
  - Redis as message broker and shared state store
  - Celery worker for background job processing
  - Redis-backed storage layer (replaced in-memory dicts)
  - Real-time progress tracking via polling
- [x] **Phase 4: Persistent Storage with Azure Cosmos DB**
  - CosmosStorage class (dict-like interface, drop-in replacement for RedisStorage)
  - Factory function in storage.py: Cosmos DB if configured, falls back to Redis
  - Azure Cosmos DB for NoSQL (serverless) with partition key `/job_id`
  - Jobs and proposals persist across container restarts
  - Redis retained as Celery broker only
  - Init script (`scripts/init_cosmos.py`) for one-time database/container setup
  - 10 new unit tests for CosmosStorage
- [x] **Phase 5 M5.1: Frontend Decomposition + Dark Theme**
  - Decomposed 556-line App.tsx monolith into 15+ component files
  - Discord-like dark theme via CSS custom properties
  - Two-level selection: sidebar (projects) + per-image opt-in checkboxes
  - Draft text persistence in sessionStorage (AI never overwrites user edits)
  - Custom hooks: useItems, useJobs, useApply
  - Character counter (125 max), accept/reject AI suggestions per image
- [x] **Phase 5 M5.2: Backend Auth + User Management**
  - HTTP-only session cookies with HMAC-signed IDs (Redis-backed)
  - bcrypt password hashing, session TTL (24h default)
  - First registered user becomes admin automatically
  - Auth required on all existing endpoints (items, generate, apply, jobs)
  - Admin endpoints: user CRUD, invite, role management, settings
  - Last-admin protection (cannot demote/deactivate sole admin)
  - Cosmos DB containers: users (/user_id), settings (/scope)
  - 72 tests passing (41 new auth/admin tests + 31 existing)
- [x] **Phase 5 M5.3: Frontend Auth Integration**
  - Real login/register pages with dark theme styling
  - AuthContext: session restore via GET /me, 401 auto-logout
  - Conditional rendering: login/register when unauthenticated, app when logged in
  - Header: user display name, role badge, logout button
- [ ] **Phase 5 M5.4: Structured Logging** <-- NEXT
- [ ] **Phase 5 M5.5: Notification System**
- [ ] **Phase 5 M5.6: Deployment to Render.com**

## Architecture

### End-to-End Workflow
1. User registers/logs in -- session cookie set (HttpOnly, Redis-backed)
2. Frontend loads CMS items via `GET /api/v1/items` -- displays thumbnails + current alt text
3. User selects projects in sidebar, then opts-in individual images
4. User clicks "Generate Alt Text" -- `POST /api/v1/generate` dispatches Celery task
5. Celery worker fetches items from Webflow, calls OpenAI Vision for each image
6. Frontend polls `GET /api/v1/jobs/{job_id}` every 5 seconds, shows progress bar
7. On completion, frontend fetches proposals via `GET /api/v1/jobs/{job_id}/proposals`
8. User reviews, edits proposals (per-image cards, character counter, draft persistence)
9. User clicks "Apply to Webflow" -- `POST /api/v1/apply` updates Webflow CMS

### Docker Services (docker-compose.yml)
| Service    | Image/Build     | Port  | Purpose                              |
|------------|-----------------|-------|--------------------------------------|
| redis      | redis:7-alpine  | 6379  | Celery broker + session store        |
| api        | ./backend       | 8000  | FastAPI application                  |
| celery     | ./backend       | -     | Background task worker               |
| frontend   | ./frontend      | 3000  | React app served via Nginx           |

## API Endpoints
| Method | Endpoint                               | Auth     | Purpose                          |
|--------|----------------------------------------|----------|----------------------------------|
| GET    | `/health`                              | None     | Health check                     |
| GET    | `/docs`                                | None     | Swagger UI                       |
| POST   | `/api/v1/auth/register`                | None     | Register (first = admin)         |
| POST   | `/api/v1/auth/login`                   | None     | Login                            |
| GET    | `/api/v1/auth/me`                      | Session  | Current user profile             |
| POST   | `/api/v1/auth/logout`                  | Session  | Destroy session                  |
| GET    | `/api/v1/items`                        | Session  | List CMS items with images       |
| POST   | `/api/v1/generate`                     | Session  | Create alt text generation job   |
| GET    | `/api/v1/jobs/{job_id}`                | Session  | Get job status + progress        |
| GET    | `/api/v1/jobs/{job_id}/proposals`      | Session  | Get AI-generated proposals       |
| POST   | `/api/v1/apply`                        | Session  | Apply proposals to Webflow CMS   |
| GET    | `/api/v1/admin/users`                  | Admin    | List all users                   |
| POST   | `/api/v1/admin/users/invite`           | Admin    | Create user with role            |
| PATCH  | `/api/v1/admin/users/{id}`             | Admin    | Update role/status               |
| GET    | `/api/v1/admin/settings`               | Admin    | Get app settings                 |
| PUT    | `/api/v1/admin/settings/notifications` | Admin    | Update notification config       |

## Project Structure
```
backend/
  app/
    main.py              # FastAPI app setup, CORS, router registration
    config.py            # Pydantic Settings (env vars: API keys, Redis, Cosmos, session)
    auth.py              # Password hashing, session CRUD, auth dependencies
    celery_app.py        # Celery config (Redis broker, JSON serialization, 30min timeout)
    cosmos_storage.py    # CosmosStorage class (supports custom partition key fields, list_all)
    storage.py           # Storage factory: CosmosStorage if configured, else RedisStorage
    tasks.py             # Celery task: generate_alt_text_task (async wrapper)
    models/
      __init__.py        # Re-exports all models
      cms_item.py        # ImageWithAltText, CMSItem, CMSItemResponse
      job.py             # JobStatus enum, CreateJobRequest, JobProgress, Job, JobResponse
      proposal.py        # Proposal, ProposalResponse, ApplyProposalRequest/Response
      user.py            # UserRole, UserCreate, UserLogin, UserInDB, UserResponse, UserUpdate
    routers/
      auth.py            # POST register/login/logout, GET me
      admin.py           # GET/POST/PATCH users, GET/PUT settings (admin only)
      items.py           # GET /api/v1/items (auth required)
      jobs.py            # POST /generate, GET /jobs/{id}, GET /proposals, POST /apply (auth)
    services/
      webflow_client.py  # WebflowClient (httpx, retry, rate limit) + MockWebflowClient
      openai_client.py   # AltTextGenerator (gpt-4o-mini vision) + MockAltTextGenerator
    tests/
      conftest.py                          # InMemoryStorage, mock fixtures
      test_main.py                         # 2 tests: health, root
      unit/test_models.py                  # 6 tests: model validation
      unit/test_config.py                  # 2 tests: settings defaults/override
      unit/test_webflow_client.py          # 3 tests: mock client
      unit/test_cosmos_storage.py          # 10 tests: CosmosStorage interface
      unit/test_auth.py                    # 9 tests: password hashing, sessions
      integration/test_items_endpoint.py   # 4 tests: items API
      integration/test_jobs_endpoint.py    # 4 tests: jobs API
      integration/test_auth_endpoints.py   # 16 tests: auth flow + protected endpoints
      integration/test_admin_endpoints.py  # 16 tests: user CRUD, settings, last-admin
  scripts/
    init_cosmos.py       # One-time setup: create database + containers
  requirements.txt
  Dockerfile
  .env                   # API keys (not committed)

frontend/
  src/
    App.tsx              # Auth routing: login/register or AppLayout
    api/client.ts        # Centralized fetch wrapper (credentials: include, 401 broadcast)
    types/index.ts       # Shared TS interfaces
    contexts/AuthContext.tsx  # Real auth: login, register, logout, session restore
    hooks/useItems.ts    # Items loading, project selection, image opt-in
    hooks/useJobs.ts     # Generation, polling, draft/generated text management
    hooks/useApply.ts    # Apply proposals to Webflow
    components/          # Header, Sidebar, ImageCard, ImageGrid, ActionBar, etc.
    pages/               # LoginPage, RegisterPage
    index.css            # Dark theme CSS custom properties
  Dockerfile             # Multi-stage: Node build -> Nginx serve

docker-compose.yml       # 4 services: redis, api, celery, frontend
PROJECT_CONTEXT.md       # This file
```

## Tech Stack
- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn
- **AI:** OpenAI gpt-4o-mini (Vision) -- generates SEO alt text, max 125 chars
- **External API:** Webflow CMS API v2 (httpx client, tenacity retries)
- **Auth:** bcrypt password hashing + HMAC-signed session cookies (Redis-backed, HttpOnly)
- **Storage:** Azure Cosmos DB for NoSQL (serverless, containers: jobs, proposals, users, settings)
- **Queue:** Celery 5.4 + Redis 7 (broker + result backend + sessions)
- **Frontend:** React 19 + TypeScript, Tailwind CSS v4, Vite 7
- **Containerization:** Docker + docker-compose (4 services)
- **Testing:** pytest, pytest-asyncio, FastAPI TestClient (72 tests passing)

## Test Summary (72 passing)
```
test_main.py:                2 (health check, root endpoint)
test_models.py:              6 (CMS item, job request, progress, proposal validation)
test_config.py:              2 (defaults, env override)
test_webflow_client.py:      3 (mock get, mock update, close)
test_cosmos_storage.py:     10 (get, set, delete, contains, getitem, setitem, KeyError)
test_auth.py:                9 (password hashing, session create/get/delete)
test_items_endpoint.py:      4 (list items, pagination, validation)
test_jobs_endpoint.py:       4 (create job, get status, validation)
test_auth_endpoints.py:     16 (register, login, logout, me, protected endpoints)
test_admin_endpoints.py:    16 (user CRUD, invite, roles, settings, last-admin protection)
```

## Environment Variables (backend/.env)
```bash
WEBFLOW_API_TOKEN=your_token_here
WEBFLOW_COLLECTION_ID=your_collection_id_here
OPENAI_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379/0  # Auto-configured in Docker as redis://redis:6379/0
COSMOS_DB_URL=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your_primary_key_here
SESSION_SECRET_KEY=change-me-in-production
# Optional (defaults shown):
# SESSION_TTL_SECONDS=86400
# COSMOS_DB_DATABASE=webflow-seo-tool
# COSMOS_DB_JOBS_CONTAINER=jobs
# COSMOS_DB_PROPOSALS_CONTAINER=proposals
# COSMOS_DB_USERS_CONTAINER=users
# COSMOS_DB_SETTINGS_CONTAINER=settings
```

## How to Run
```bash
# First-time Cosmos DB setup (requires COSMOS_DB_URL and COSMOS_DB_KEY in backend/.env)
docker compose up -d redis && docker compose build api
docker compose run --rm -v ./backend/scripts:/app/scripts api python -m scripts.init_cosmos

# Docker (recommended -- runs all 4 services)
docker compose up --build

# Tests (no external services needed -- uses InMemoryStorage + mocks)
docker compose run --rm api python -m pytest app/tests/ -v
```

## Accounts & Services
- [x] OpenAI account with API key
- [x] Webflow account with test site (217 CMS items, 4 images each)
- [x] GitHub repo: https://github.com/jakeroth0/webflow-seo-tool
- [x] Redis via Docker (Celery broker + session store)
- [x] Azure Cosmos DB for NoSQL (serverless, West US 2, resource group `webflow-seo-tool-rg`)

## Key Design Decisions
- **Opt-in apply:** Users must explicitly select images and click apply -- no automatic CMS writes
- **Draft persistence:** User-typed text stored in sessionStorage, never overwritten by AI generation
- **Two-level selection:** Sidebar selects projects (visibility), per-image checkboxes control inclusion
- **HTTP-only session cookies:** XSS-immune, Redis-backed sessions with HMAC-signed IDs (not JWT)
- **First user = admin:** Single-tenant model, first registered user gets admin role
- **Mock fallbacks:** All external services (Webflow, OpenAI) have mock clients for dev/testing
- **Cosmos DB with Redis fallback:** Storage factory tries Cosmos DB first, falls back to Redis
- **Dict-like storage interface:** CosmosStorage, RedisStorage, and InMemoryStorage share same API
- **Component decomposition:** Frontend split into hooks + components for maintainability
- **4 image fields per item:** Hardcoded field pattern `{1-4}-after` with alt text in `{1-4}-after-alt-text`
