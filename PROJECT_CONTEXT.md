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
  - 10 new unit tests for CosmosStorage + conftest.py with InMemoryStorage for test isolation
- [ ] **Phase 5: TBD** <-- NEXT

## Architecture

### End-to-End Workflow
1. Frontend loads CMS items via `GET /api/v1/items` -- displays thumbnails + current alt text
2. User selects items via checkboxes (individual or "Select All")
3. User clicks "Generate Alt Text" -- `POST /api/v1/generate` dispatches Celery task
4. Celery worker fetches items from Webflow, calls OpenAI Vision for each image
5. Frontend polls `GET /api/v1/jobs/{job_id}` every 5 seconds, shows progress bar
6. On completion, frontend fetches proposals via `GET /api/v1/jobs/{job_id}/proposals`
7. User reviews, edits proposals (side-by-side comparison, character counter)
8. User clicks "Apply All" -- `POST /api/v1/apply` updates Webflow CMS

### Docker Services (docker-compose.yml)
| Service    | Image/Build     | Port  | Purpose                              |
|------------|-----------------|-------|--------------------------------------|
| redis      | redis:7-alpine  | 6379  | Celery message broker                |
| api        | ./backend       | 8000  | FastAPI application                  |
| celery     | ./backend       | -     | Background task worker               |
| frontend   | ./frontend      | 3000  | React app served via Nginx           |

- Volume mounts (`backend/app:/app/app`) enable hot-reloading during development
- Redis healthcheck ensures services start in correct order
- Both `api` and `celery` load credentials from `backend/.env` via `env_file`

## API Endpoints
| Method | Endpoint                          | Purpose                          |
|--------|-----------------------------------|----------------------------------|
| GET    | `/`                               | API info (version, docs link)    |
| GET    | `/health`                         | Health check                     |
| GET    | `/api/v1/items`                   | List CMS items with images       |
| POST   | `/api/v1/generate`                | Create alt text generation job   |
| GET    | `/api/v1/jobs/{job_id}`           | Get job status + progress        |
| GET    | `/api/v1/jobs/{job_id}/proposals` | Get AI-generated proposals       |
| POST   | `/api/v1/apply`                   | Apply proposals to Webflow CMS   |
| GET    | `/docs`                           | Swagger UI                       |

## Project Structure
```
backend/
  app/
    main.py              # FastAPI app setup, CORS, health check, router registration
    config.py            # Pydantic Settings (env vars: API keys, Redis URL, Cosmos DB, etc.)
    celery_app.py        # Celery config (Redis broker, JSON serialization, 30min timeout)
    cosmos_storage.py    # CosmosStorage class -- persistent storage via Azure Cosmos DB
    storage.py           # Storage factory: CosmosStorage if configured, else RedisStorage
    tasks.py             # Celery task: generate_alt_text_task (async wrapper)
    models/
      __init__.py        # Re-exports all models
      cms_item.py        # ImageWithAltText, CMSItem, CMSItemResponse
      job.py             # JobStatus enum, CreateJobRequest, JobProgress, Job, JobResponse
      proposal.py        # Proposal, ProposalResponse, ApplyProposalRequest/Response
    routers/
      items.py           # GET /api/v1/items -- list CMS items from Webflow
      jobs.py            # POST /generate, GET /jobs/{id}, GET /proposals, POST /apply
    services/
      webflow_client.py  # WebflowClient (httpx, retry, rate limit) + MockWebflowClient
      openai_client.py   # AltTextGenerator (gpt-4o-mini vision) + MockAltTextGenerator
    tests/
      conftest.py                     # InMemoryStorage, mock fixtures (storage, Celery, Webflow)
      test_main.py                    # 2 tests: health, root
      unit/test_models.py             # 6 tests: model validation
      unit/test_config.py             # 2 tests: settings defaults/override
      unit/test_webflow_client.py     # 3 tests: mock client
      unit/test_cosmos_storage.py     # 10 tests: CosmosStorage dict-like interface
      integration/test_items_endpoint.py  # 4 tests: items API
      integration/test_jobs_endpoint.py   # 4 tests: jobs API
  scripts/
    init_cosmos.py       # One-time setup: create Cosmos DB database + containers
  requirements.txt
  Dockerfile             # Python 3.13-slim, non-root user, Uvicorn
  .env                   # API keys (not committed)

frontend/
  src/
    App.tsx              # Single-page app: all state, API calls, and UI
    main.tsx             # React 19 entry point
    App.css / index.css  # Minimal styles (Tailwind handles most)
  vite.config.ts         # Port 3000, proxies /api and /health to localhost:8000
  package.json           # React 19, Tailwind CSS v4, Vite 7, TypeScript 5.9
  Dockerfile             # Multi-stage: Node build -> Nginx serve

docker-compose.yml       # 4 services: redis, api, celery, frontend
PROJECT_CONTEXT.md       # This file
```

## Tech Stack
- **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn
- **AI:** OpenAI gpt-4o-mini (Vision) -- generates SEO alt text, max 125 chars
- **External API:** Webflow CMS API v2 (httpx client, tenacity retries)
- **Storage:** Azure Cosmos DB for NoSQL (serverless, sync SDK `azure-cosmos` 4.9)
- **Queue:** Celery 5.4 + Redis 7 (broker + result backend)
- **Frontend:** React 19 + TypeScript, Tailwind CSS v4, Vite 7
- **Containerization:** Docker + docker-compose (4 services)
- **Testing:** pytest, pytest-asyncio, FastAPI TestClient (31 tests passing)

## Test Summary (31 passing)
```
test_main.py:               2 (health check, root endpoint)
test_models.py:             6 (CMS item, job request, progress, proposal validation)
test_config.py:             2 (defaults, env override)
test_webflow_client.py:     3 (mock get, mock update, close)
test_cosmos_storage.py:    10 (get, set, delete, contains, getitem, setitem, KeyError)
test_items_endpoint.py:     4 (list items, pagination, validation)
test_jobs_endpoint.py:      4 (create job, get status, validation)
```

## Environment Variables (backend/.env)
```bash
WEBFLOW_API_TOKEN=your_token_here
WEBFLOW_COLLECTION_ID=your_collection_id_here
OPENAI_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379/0  # Auto-configured in Docker as redis://redis:6379/0
COSMOS_DB_URL=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your_primary_key_here
# Optional (defaults shown):
# COSMOS_DB_DATABASE=webflow-seo-tool
# COSMOS_DB_JOBS_CONTAINER=jobs
# COSMOS_DB_PROPOSALS_CONTAINER=proposals
```

## How to Run
```bash
# First-time Cosmos DB setup (requires COSMOS_DB_URL and COSMOS_DB_KEY in backend/.env)
cd backend && python -m scripts.init_cosmos

# Docker (recommended -- runs all 4 services)
docker compose up --build

# Or run individually:
cd backend && source venv/bin/activate
uvicorn app.main:app --reload                     # API at http://localhost:8000
celery -A app.celery_app worker --loglevel=info   # Worker (separate terminal)
cd frontend && npm run dev                        # UI at http://localhost:3000

# Tests (no external services needed -- uses InMemoryStorage + mocks)
cd backend && pytest app/tests/ -v
```

## Accounts & Services
- [x] OpenAI account with API key
- [x] Webflow account with test site (217 CMS items, 4 images each)
- [x] GitHub repo: https://github.com/jakeroth0/webflow-seo-tool
- [x] Redis via Docker (Celery broker)
- [x] Azure Cosmos DB for NoSQL (serverless, West US 2, resource group `webflow-seo-tool-rg`)

## Key Design Decisions
- **Opt-in apply:** Users must explicitly click "Apply All" -- no automatic CMS writes
- **Editable proposals:** AI suggestions can be refined before applying (150 char textarea)
- **Mock fallbacks:** All external services (Webflow, OpenAI) have mock clients for dev/testing
- **Cosmos DB with Redis fallback:** Storage factory tries Cosmos DB first, falls back to Redis if not configured
- **Dict-like storage interface:** CosmosStorage, RedisStorage, and InMemoryStorage (tests) all share same API (`get`, `set`, `delete`, `__getitem__`, `__setitem__`, `__contains__`)
- **Upsert semantics:** Cosmos DB upserts match Redis SET behavior (create or overwrite)
- **Single-page frontend:** All UI logic in App.tsx for simplicity (no routing needed)
- **4 image fields per item:** Hardcoded field pattern `{1-4}-after` with alt text in `{1-4}-after-alt-text`
