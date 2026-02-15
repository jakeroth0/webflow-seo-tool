# Webflow SEO Alt Text Tool - Project Context

## What We're Building
Internal web app that:
1. Connects to Webflow CMS collections
2. Shows current alt text in clean UI
3. Generates SEO-friendly alt text using AI
4. Lets users preview and selectively apply changes
5. Prevents accidental overwrites with opt-in

## Current Progress
- [x] Phase 1.1: Project setup
- [x] Phase 1.2: FastAPI skeleton with health check (2 tests)
- [x] Phase 1.3: Pydantic models (6 tests)
- [x] Phase 1.4: Configuration management (2 tests)
- [x] Phase 1.5: Webflow API client mock (3 tests)
- [x] Frontend scaffold: React + Vite + Tailwind CSS
- [x] Docker configuration: Dockerfiles + docker-compose.yml
- [x] Phase 2.1: Items endpoint GET /api/v1/items (4 tests)
- [x] Phase 2.2: Job creation POST /api/v1/generate (4 tests)
- [x] Frontend: Load and display items from API
- [x] Phase 2.3: Real Webflow API integration (all 4 image fields)
- [x] Phase 2.4: OpenAI Vision integration (gpt-4o-mini)
- [x] Phase 2.5: Frontend generate button + editable proposals
- [x] Phase 2.6: Apply proposals to Webflow CMS
- [x] **Phase 3: Background processing with Celery + Redis**
- [ ] **Phase 4: Persistent storage with Cosmos DB** ← NEXT

## Roadmap
**Immediate Next Steps:**
1. ✅ Phase 2.3: Connect to real Webflow API (replace mock)
2. ✅ Phase 2.4: Integrate OpenAI Vision to generate alt text
3. ✅ Phase 2.5: Wire up generate button in frontend with editable proposals
4. ✅ Phase 2.6: Apply selected proposals to Webflow CMS
5. ✅ Phase 3: Add Redis + Celery for background job processing
6. Phase 4: Migrate storage to Cosmos DB

## Active Task
**Current Step:** Phase 3 Complete! 🎉
**Next:** Phase 4 - Persistent storage with Cosmos DB (or test Phase 3 first)

## Test Summary
```
21 passed (backend)
- test_main.py: 2 (health check, root endpoint)
- test_models.py: 6 (CMS item, job request, progress, proposal validation)
- test_config.py: 2 (defaults, env override)
- test_webflow_client.py: 3 (mock get, mock update, close)
- test_items_endpoint.py: 4 (list items, pagination, validation)
- test_jobs_endpoint.py: 4 (create job, get status, validation)
```

## Endpoints Available
- `GET /health` - Health check
- `GET /` - API info
- `GET /api/v1/items?collection_id=X&limit=50` - List CMS items with all images
- `POST /api/v1/generate` - Create alt text generation job
- `GET /api/v1/jobs/{job_id}` - Get job status with progress
- `GET /api/v1/jobs/{job_id}/proposals` - Get AI-generated proposals
- `POST /api/v1/apply` - Apply proposals to Webflow CMS
- `GET /docs` - Swagger UI

## Accounts Set Up
- [x] OpenAI account with API key
- [x] Webflow account with test site
- [x] GitHub repo: https://github.com/jakeroth0/webflow-seo-tool
- [x] Redis (Phase 3) - via Docker
- [ ] Azure Cosmos DB (Phase 4)

## Environment Variables Needed
```bash
# Add to backend/.env
WEBFLOW_API_TOKEN=your_token_here
WEBFLOW_COLLECTION_ID=your_collection_id_here
OPENAI_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379/0  # Auto-configured in Docker
```

## Tech Stack
- Backend: Python 3.13, FastAPI, Pydantic
- Frontend: React 18 + TypeScript, Tailwind CSS v4, Vite
- Database: Cosmos DB (Phase 3)
- Queue: Redis + Celery (Phase 3)
- Containerization: Docker + docker-compose

## How to Run
```bash
# With Docker (recommended - includes Redis + Celery)
docker-compose up --build

# Or individually:

# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload    # http://localhost:8000

# Celery worker (separate terminal)
cd backend
celery -A app.celery_app worker --loglevel=info

# Frontend (separate terminal)
cd frontend
npm run dev                       # http://localhost:3000

# Tests
cd backend
pytest app/tests/ -v
```

## What's Working
- ✅ Backend API serving at localhost:8000 with Swagger docs at /docs
- ✅ Frontend UI at localhost:3000 with live API health check
- ✅ Real Webflow API integration with 217 items, 4 images each (1-after through 4-after)
- ✅ "Load Projects" fetches real CMS items and displays all images with current alt text
- ✅ Item selection with checkboxes (individual + "Select All")
- ✅ **Celery + Redis background job processing** (Phase 3)
- ✅ "Generate Alt Text" button dispatches Celery tasks
- ✅ Real-time progress tracking with visual progress bar
- ✅ OpenAI Vision (gpt-4o-mini) generates SEO-optimized alt text (max 125 chars)
- ✅ Side-by-side comparison of current vs. AI-generated alt text
- ✅ Editable proposals with character counter (150 max) and "edited" badge
- ✅ "Apply All" button updates Webflow CMS with approved alt text
- ✅ Auto-publish items after updating (queues for publish)
- ✅ UI auto-refreshes to show applied alt text

## Phase 3 Details (Celery + Redis)
**What Changed:**
- Added Redis service to docker-compose.yml (alpine image, port 6379)
- Added Celery worker service to docker-compose.yml
- Installed celery[redis] and redis packages
- Created `app/celery_app.py` with Celery configuration
- Created `app/tasks.py` with `generate_alt_text_task` Celery task
- Updated `app/routers/jobs.py` to dispatch Celery tasks instead of FastAPI BackgroundTasks
- Jobs now run in dedicated Celery workers (scalable, persistent, restartable)

**Benefits:**
- Background jobs survive API server restarts
- Can scale Celery workers independently
- Better handling of long-running tasks
- Task retry and failure handling built-in
- Foundation for future features (scheduled jobs, batch processing)
