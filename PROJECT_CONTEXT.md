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
- [ ] **Phase 2.3: Real Webflow API integration** ← CURRENT
- [ ] Phase 2.4: OpenAI integration for alt text generation
- [ ] Phase 2.5: Frontend generate button + display proposals
- [ ] Phase 3: Background processing with Celery + Redis

## Roadmap
**Immediate Next Steps:**
1. Phase 2.3: Connect to real Webflow API (replace mock)
2. Phase 2.4: Integrate OpenAI to generate alt text
3. Phase 2.5: Wire up generate button in frontend
4. Phase 3: Add Redis + Celery for background job processing

## Active Task
**Current Step:** Phase 2.3 - Real Webflow API Integration
**Goal:** Replace MockWebflowClient with real API calls using user's Webflow token

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
- `GET /api/v1/items?collection_id=X` - List CMS items
- `POST /api/v1/generate` - Create generation job
- `GET /api/v1/jobs/{job_id}` - Get job status
- `GET /docs` - Swagger UI

## Accounts Set Up
- [x] OpenAI account with API key
- [x] Webflow account with test site
- [x] GitHub repo: https://github.com/jakeroth0/webflow-seo-tool
- [ ] Redis (Phase 3)
- [ ] Azure Cosmos DB (Phase 3)

## Environment Variables Needed
```bash
# Add to backend/.env
WEBFLOW_API_TOKEN=your_token_here
WEBFLOW_COLLECTION_ID=your_collection_id_here
OPENAI_API_KEY=your_key_here
```

## Tech Stack
- Backend: Python 3.13, FastAPI, Pydantic
- Frontend: React 18 + TypeScript, Tailwind CSS v4, Vite
- Database: Cosmos DB (Phase 3)
- Queue: Redis + Celery (Phase 3)
- Containerization: Docker + docker-compose

## How to Run
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload    # http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm run dev                       # http://localhost:3000

# Tests
cd backend
pytest app/tests/ -v
```

## What's Working
- Backend API serving at localhost:8000 with Swagger docs at /docs
- Frontend UI at localhost:3000 with live API health check
- "Load Items" button fetches mock CMS items and displays them
- Job creation endpoint ready (no worker processing yet)
