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
- [ ] Phase 2.1: Items endpoint (GET /api/v1/items)
- [ ] Phase 2.2: Job creation endpoint (POST /api/v1/generate)

## Active Task
**Current Step:** Phase 1 Complete - 13 tests passing
**Next:** Phase 2 - Core API endpoints + frontend wiring

## Test Summary
```
13 passed (backend)
- test_main.py: 2 (health check, root endpoint)
- test_models.py: 6 (CMS item, job request, progress, proposal validation)
- test_config.py: 2 (defaults, env override)
- test_webflow_client.py: 3 (mock get, mock update, close)
```

## Accounts Set Up
- [x] OpenAI account with API key
- [x] Webflow account with test site
- [x] GitHub repo: https://github.com/jakeroth0/webflow-seo-tool
- [ ] Redis (needed Phase 3)
- [ ] Azure Cosmos DB (needed Phase 3)

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
