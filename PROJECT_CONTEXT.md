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
  - Clean shadcn/ui dark theme (oklch color defaults)
  - Two-level selection: sidebar (projects) + per-image opt-in checkboxes
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
  - Real login/register pages with shadcn/ui Card, Input, Button components
  - AuthContext: session restore via GET /me, 401 auto-logout
  - Conditional rendering: login/register when unauthenticated, app when logged in
  - Header: user display name, role badge, logout button
- [x] **Phase 5 M5.4: Structured Logging**
  - StructuredJSONFormatter: single-line JSON log output with timestamp, level, logger, message, module, function, line
  - Extra fields via `extra={}` on all log calls (job_id, user_id, duration_ms, etc.)
  - RequestLoggingMiddleware: 8-char hex X-Request-ID on every response, request timing
  - 14 new tests (7 formatter + 7 middleware)
- [x] **Phase 5 M5.5: Admin API Key Management**
  - Fernet encryption (AES-128-CBC + HMAC-SHA256) for keys at rest
  - Centralized key_manager: stored key > env-var fallback, graceful decryption failure
  - Admin endpoints: GET/PUT /api/v1/admin/settings/api-keys (masked values + source)
  - All client factories (items, jobs, tasks) use key_manager instead of direct settings access
  - Frontend Settings page: Card-based form, masked current values, source badges, save/remove
  - 18 new tests (7 encryption + 6 key_manager + 5 admin endpoint integration)
- [x] **Phase 5 M5.6: UX Improvements**
  - Auto-paginate all Webflow items: loadItems loops 100/request until has_more is false
  - Sidebar table: TanStack Table client-side pagination (20/page, Previous/Next, X–Y of Z)
  - Mobile responsive sidebar: slide-in drawer with backdrop overlay; hamburger/close toggle in header; auto-close on item select; desktop layout unchanged
  - Image opt-out fix: generate request passes specific opted-in `image_keys` to backend; Celery task filters to only those fields per item (previously all 4 image slots were always processed)
- [x] **Phase 5 M5.7: Deployment to Render.com**
  - render.yaml: 4 services (API web, Celery worker, Redis, frontend static site)
  - Celery worker Start Command: `celery -A app.celery_app worker --loglevel=info --concurrency=2`
  - CORS_ORIGINS and VITE_API_URL env vars for cross-origin setup
  - SameSite=None cookies for cross-origin production environment
- [x] **Phase 5 M5.8: Invite Code + Demo Access**
  - Invite code gating: admin sets code via Settings UI, new users must enter it to register
  - First user (admin) exempt from invite code requirement
  - Relaxed endpoints: items/generate/apply/jobs open to any authenticated user (was admin-only)
  - Admin endpoints: GET/PUT /api/v1/admin/settings/invite-code
- [x] **Phase 5 M5.9: Mobile Safari Auth Fix**
  - Safari ITP blocks cross-origin cookies — added dual auth: Authorization Bearer header + cookie fallback
  - Login/register return session token in response body
  - Frontend stores token in sessionStorage, sends via Authorization header on all requests
  - Explicit CORS allow_headers (wildcard unreliable with credentials:true on mobile Safari)
  - Network error handling in fetch wrapper (catches CORS blocks, surfaces as ApiError)
- [x] **Phase 5 M5.10: Sync Success Notification**
  - Toast notification (sonner) on successful Webflow sync
  - Error toast with failure count on partial/full failure

## Architecture

### End-to-End Workflow
1. User registers/logs in -- session cookie + Bearer token returned (Redis-backed sessions)
2. Frontend loads CMS items via `GET /api/v1/items` -- displays thumbnails + current alt text
3. User selects projects in sidebar, then opts-in individual images
4. User clicks "Generate Alt Text" -- `POST /api/v1/generate` dispatches Celery task
5. Celery worker fetches items from Webflow, calls OpenAI Vision for each opted-in image field
6. Frontend polls `GET /api/v1/jobs/{job_id}` every 5 seconds, shows progress bar
7. On completion, frontend fetches proposals via `GET /api/v1/jobs/{job_id}/proposals`
8. User reviews, edits proposals (per-image cards, character counter)
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
| GET    | `/api/v1/admin/settings/invite-code`   | Admin    | Get invite code status           |
| PUT    | `/api/v1/admin/settings/invite-code`   | Admin    | Set/clear invite code            |
| GET    | `/api/v1/admin/settings/api-keys`      | Admin    | Get masked API key status        |
| PUT    | `/api/v1/admin/settings/api-keys`      | Admin    | Update stored API keys           |

## Project Structure
```
backend/
  app/
    main.py              # FastAPI app setup, CORS, middleware, router registration
    config.py            # Pydantic Settings (env vars: API keys, Redis, Cosmos, session)
    auth.py              # Password hashing, session CRUD, auth dependencies
    encryption.py        # Fernet encrypt/decrypt/mask helpers (AES-128-CBC + HMAC-SHA256)
    key_manager.py       # Centralized API key retrieval (stored > env-var fallback)
    logging_config.py    # StructuredJSONFormatter, configure_logging()
    middleware.py        # RequestLoggingMiddleware (X-Request-ID, request timing)
    celery_app.py        # Celery config (Redis broker, JSON serialization, 30min timeout)
    cosmos_storage.py    # CosmosStorage class (supports custom partition key fields, list_all)
    storage.py           # Storage factory: CosmosStorage if configured, else RedisStorage
    tasks.py             # Celery task: generate_alt_text_task (async wrapper)
    models/
      __init__.py        # Re-exports all models
      api_keys.py        # ApiKeysUpdate, ApiKeyStatus, ApiKeysResponse
      cms_item.py        # ImageWithAltText, CMSItem, CMSItemResponse
      job.py             # JobStatus enum, CreateJobRequest, JobProgress, Job, JobResponse
      proposal.py        # Proposal, ProposalResponse, ApplyProposalRequest/Response
      user.py            # UserRole, UserCreate, UserLogin, UserInDB, UserResponse, UserUpdate
    routers/
      auth.py            # POST register/login/logout, GET me
      admin.py           # GET/POST/PATCH users, GET/PUT settings + api-keys (admin only)
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
      unit/test_logging.py                 # 14 tests: JSON formatter + request middleware
      unit/test_encryption.py              # 7 tests: encrypt/decrypt roundtrip, masking
      unit/test_key_manager.py             # 6 tests: stored > env fallback, save/remove
      integration/test_items_endpoint.py   # 4 tests: items API
      integration/test_jobs_endpoint.py    # 4 tests: jobs API
      integration/test_auth_endpoints.py   # 16 tests: auth flow + protected endpoints
      integration/test_admin_endpoints.py  # 21 tests: user CRUD, settings, api-keys, last-admin
  scripts/
    init_cosmos.py       # One-time setup: create database + containers
  requirements.txt
  Dockerfile
  .env                   # API keys (not committed)

frontend/
  src/
    App.tsx              # Auth routing: login/register or AppLayout
    api/client.ts        # Centralized fetch wrapper (Bearer token + cookie, 401 broadcast, network error handling)
    types/index.ts       # Shared TS interfaces
    contexts/AuthContext.tsx  # Real auth: login, register, logout, session restore
    hooks/useItems.ts    # Items loading (auto-paginate all pages), project selection, image opt-in
    hooks/useJobs.ts     # Generation (sends image_keys), polling, draft/generated text management
    hooks/useApply.ts    # Apply proposals to Webflow
    components/          # Header (hamburger toggle), Sidebar (mobile drawer), MainPanel, SidebarTable (pagination), ImageRow, ProgressBar, etc.
    pages/               # LoginPage, RegisterPage, SettingsPage
    index.css            # shadcn/ui oklch dark theme defaults
  Dockerfile             # Multi-stage: Node build -> Nginx serve

docker-compose.yml       # 4 services: redis, api, celery, frontend (local dev)
render.yaml              # Render.com deployment: API, worker, Redis, static frontend
PROJECT_CONTEXT.md       # This file
```

## Tech Stack
- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn
- **AI:** OpenAI gpt-4o-mini (Vision) -- generates SEO alt text, max 125 chars
- **External API:** Webflow CMS API v2 (httpx client, tenacity retries)
- **Auth:** bcrypt password hashing + HMAC-signed sessions (Redis-backed, dual: HttpOnly cookie + Bearer token)
- **Encryption:** Fernet (AES-128-CBC + HMAC-SHA256) for API keys at rest
- **Storage:** Azure Cosmos DB for NoSQL (serverless, containers: jobs, proposals, users, settings)
- **Queue:** Celery 5.4 + Redis 7 (broker + result backend + sessions)
- **Frontend:** React 19 + TypeScript, shadcn/ui, Tailwind CSS v4, Vite 7
- **Containerization:** Docker + docker-compose (4 services)
- **Testing:** pytest, pytest-asyncio, FastAPI TestClient (104 tests passing)

## Test Summary (104 passing)
```
test_main.py:                2 (health check, root endpoint)
test_models.py:              6 (CMS item, job request, progress, proposal validation)
test_config.py:              2 (defaults, env override)
test_webflow_client.py:      3 (mock get, mock update, close)
test_cosmos_storage.py:     10 (get, set, delete, contains, getitem, setitem, KeyError)
test_auth.py:                9 (password hashing, session create/get/delete)
test_logging.py:            14 (JSON formatter, request middleware, X-Request-ID)
test_encryption.py:          7 (encrypt/decrypt roundtrip, invalid ciphertext, masking)
test_key_manager.py:         6 (stored > env fallback, decryption failure, save/remove)
test_items_endpoint.py:      4 (list items, pagination, validation)
test_jobs_endpoint.py:       4 (create job, get status, validation)
test_auth_endpoints.py:     16 (register, login, logout, me, protected endpoints)
test_admin_endpoints.py:    21 (user CRUD, invite, roles, settings, api-keys, last-admin)
```

## Environment Variables (backend/.env)
```bash
WEBFLOW_API_TOKEN=your_token_here        # Can also be set via admin UI
WEBFLOW_COLLECTION_ID=your_collection_id # Can also be set via admin UI
OPENAI_API_KEY=your_key_here             # Can also be set via admin UI
REDIS_URL=redis://localhost:6379/0  # Auto-configured in Docker as redis://redis:6379/0
COSMOS_DB_URL=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your_primary_key_here
SESSION_SECRET_KEY=change-me-in-production  # Also used to derive Fernet encryption key
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
- [x] Redis via Docker locally / Render Redis in production (Celery broker + session store)
- [x] Azure Cosmos DB for NoSQL (serverless, West US 2, resource group `webflow-seo-tool-rg`)
- [x] Render.com: API (webflow-seo-api), Worker (webflow-seo-celery), Redis (webflow-seo-redis), Frontend (webflow-seo-frontend)

## Key Design Decisions
- **Opt-in apply:** Users must explicitly select images and click apply -- no automatic CMS writes
- **Two-level selection:** Sidebar selects projects (visibility), per-image checkboxes control inclusion
- **Dual auth (cookie + token):** HttpOnly session cookies for desktop, Bearer token in sessionStorage for mobile Safari (ITP blocks cross-origin cookies)
- **Explicit CORS headers:** `allow_headers=["Content-Type", "Authorization", "Cookie"]` — wildcard unreliable with `credentials:true` on mobile Safari
- **First user = admin:** Single-tenant model, first registered user gets admin role
- **Invite code gating:** Admin sets invite code via Settings UI; second+ users must provide it to register
- **Encrypted API keys:** Admin can store keys via UI (Fernet encrypted in settings_db), env vars as fallback
- **Key retrieval priority:** Stored (encrypted) key > environment variable > None
- **Mock fallbacks:** All external services (Webflow, OpenAI) have mock clients for dev/testing
- **Cosmos DB with Redis fallback:** Storage factory tries Cosmos DB first, falls back to Redis
- **Dict-like storage interface:** CosmosStorage, RedisStorage, and InMemoryStorage share same API
- **Component decomposition:** Frontend split into hooks + components for maintainability
- **4 image fields per item:** Hardcoded field pattern `{1-4}-after` with alt text in `{1-4}-after-alt-text`
- **Per-image generation filtering:** `image_keys` (list of `"itemId:fieldName"`) passed from frontend to backend; Celery task skips any field not in the opted-in set
- **Full collection load:** loadItems auto-fetches all pages (100/request) on load; sidebar uses client-side pagination (20/page) for display
