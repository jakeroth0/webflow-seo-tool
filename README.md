# Webflow SEO Alt Text Tool

Generate and apply SEO-friendly alt text for Webflow CMS images using AI vision models.

Built with FastAPI, React, OpenAI Vision (gpt-4o-mini), Celery, and Azure Cosmos DB.

## What It Does

1. **Connects** to your Webflow CMS collection and displays all images with their current alt text
2. **Generates** optimized alt text using OpenAI's vision model (max 125 characters, SEO-focused)
3. **Lets you review** AI suggestions side-by-side with current text — edit, accept, or reject per image
4. **Applies** approved changes back to Webflow CMS in bulk

The tool uses a safe opt-in design: nothing is written to your CMS unless you explicitly approve it.

## Screenshots

> Dark-themed UI with project sidebar, per-image opt-in controls, and inline editing.
> Login/register flow with role-based access (first user becomes admin).

## Architecture

```
Browser (React) ──> Nginx ──> FastAPI API
                                 ├── Auth (session cookies → Redis)
                                 ├── Webflow CMS API (read items, write alt text)
                                 ├── Celery task dispatch
                                 └── Azure Cosmos DB (users, jobs, proposals, settings)
                                        │
                              Redis ◄────┘ (broker + sessions)
                                │
                           Celery Worker
                              ├── Webflow API (fetch images)
                              └── OpenAI Vision (generate alt text)
```

### Docker Services

| Service  | Purpose                           | Port |
|----------|-----------------------------------|------|
| frontend | React app served via Nginx        | 3000 |
| api      | FastAPI application               | 8000 |
| celery   | Background task worker            | —    |
| redis    | Celery broker + session store     | 6379 |

## Getting Started

### Prerequisites

- Docker and Docker Compose
- A Webflow account with a CMS collection containing images
- An OpenAI API key
- An Azure Cosmos DB account (serverless, NoSQL)

### 1. Clone and configure

```bash
git clone https://github.com/jakeroth0/webflow-seo-tool.git
cd webflow-seo-tool
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```bash
# Required
WEBFLOW_API_TOKEN=your_webflow_api_token
WEBFLOW_COLLECTION_ID=your_collection_id
OPENAI_API_KEY=your_openai_api_key

# Azure Cosmos DB
COSMOS_DB_URL=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your_primary_key

# Session auth (change in production)
SESSION_SECRET_KEY=your-secret-key-here
```

### 2. Initialize Cosmos DB

Create the required database and containers (one-time setup):

```bash
docker compose up -d redis
docker compose build api
docker compose run --rm -v ./backend/scripts:/app/scripts api python -m scripts.init_cosmos
```

This creates the `webflow-seo-tool` database with containers: `jobs`, `proposals`, `users`, `settings`.

### 3. Start the app

```bash
docker compose up --build
```

Open http://localhost:3000 and register your first account (automatically becomes admin).

### 4. Run tests

```bash
# Run all 72 tests inside Docker (no external services needed)
docker compose run --rm api python -m pytest app/tests/ -v
```

## Usage

1. **Register/Login** — First account becomes admin, subsequent accounts are regular users
2. **Load Items** — Click "Load Items" in the sidebar to fetch your CMS collection
3. **Select Projects** — Check projects in the sidebar to view their images
4. **Opt-in Images** — Check individual images you want to generate alt text for (default: off)
5. **Generate** — Click "Generate Alt Text" to start the AI generation job
6. **Review & Edit** — Each image card shows current vs. proposed alt text with a 125-char counter
7. **Apply** — Click "Apply to Webflow" to write approved changes back to your CMS

Draft text you type is persisted in your browser session and is never overwritten by AI generation.

## Tech Stack

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| Frontend     | React 19, TypeScript, Tailwind CSS v4, Vite 7          |
| Backend      | Python 3.13, FastAPI, Pydantic v2, Uvicorn             |
| AI           | OpenAI gpt-4o-mini (Vision API)                        |
| Auth         | bcrypt + HMAC-signed session cookies (Redis-backed)     |
| Storage      | Azure Cosmos DB for NoSQL (serverless)                  |
| Queue        | Celery 5.4 + Redis 7                                   |
| External API | Webflow CMS API v2 (httpx, tenacity retries)           |
| Containers   | Docker + Docker Compose                                 |
| Testing      | pytest (72 tests — unit, integration, auth, admin)      |

## Project Structure

```
backend/
  app/
    main.py              # FastAPI app, CORS, router registration
    config.py            # Pydantic Settings (env vars)
    auth.py              # Password hashing, sessions, auth dependencies
    celery_app.py        # Celery configuration
    cosmos_storage.py    # Azure Cosmos DB storage adapter
    storage.py           # Storage factory (Cosmos DB or Redis fallback)
    tasks.py             # Celery task for alt text generation
    models/              # Pydantic models (CMS items, jobs, proposals, users)
    routers/
      auth.py            # Register, login, logout, me
      admin.py           # User management, settings (admin only)
      items.py           # CMS item listing
      jobs.py            # Job creation, status, proposals, apply
    services/
      webflow_client.py  # Webflow API client + mock
      openai_client.py   # OpenAI Vision client + mock
    tests/               # 72 tests (unit + integration)
  scripts/
    init_cosmos.py       # One-time Cosmos DB setup

frontend/
  src/
    App.tsx              # Root component with auth routing
    api/client.ts        # Fetch wrapper with cookie auth
    contexts/            # AuthContext (login, register, session restore)
    components/          # Header, Sidebar, ImageCard, ImageGrid, etc.
    hooks/               # useItems, useJobs, useApply
    pages/               # LoginPage, RegisterPage
    types/               # Shared TypeScript interfaces

docker-compose.yml       # 4 services: redis, api, celery, frontend
```

## API Endpoints

### Public
| Method | Endpoint  | Purpose        |
|--------|-----------|----------------|
| GET    | `/health` | Health check   |
| GET    | `/docs`   | Swagger UI     |

### Auth (no session required)
| Method | Endpoint                  | Purpose                    |
|--------|---------------------------|----------------------------|
| POST   | `/api/v1/auth/register`   | Register (first = admin)   |
| POST   | `/api/v1/auth/login`      | Login                      |

### Protected (session cookie required)
| Method | Endpoint                          | Purpose                      |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/v1/auth/me`                 | Current user profile         |
| POST   | `/api/v1/auth/logout`             | Destroy session              |
| GET    | `/api/v1/items`                   | List CMS items with images   |
| POST   | `/api/v1/generate`                | Start alt text generation    |
| GET    | `/api/v1/jobs/{job_id}`           | Job status + progress        |
| GET    | `/api/v1/jobs/{job_id}/proposals` | Generated proposals          |
| POST   | `/api/v1/apply`                   | Apply changes to Webflow     |

### Admin only (admin session required)
| Method | Endpoint                              | Purpose                |
|--------|---------------------------------------|------------------------|
| GET    | `/api/v1/admin/users`                 | List all users         |
| POST   | `/api/v1/admin/users/invite`          | Create user with role  |
| PATCH  | `/api/v1/admin/users/{id}`            | Update role/status     |
| GET    | `/api/v1/admin/settings`              | Get app settings       |
| PUT    | `/api/v1/admin/settings/notifications`| Update notification config |

## Environment Variables

| Variable                  | Required | Default               | Description                    |
|---------------------------|----------|-----------------------|--------------------------------|
| `WEBFLOW_API_TOKEN`       | Yes      | —                     | Webflow API v2 token           |
| `WEBFLOW_COLLECTION_ID`   | Yes      | —                     | Target CMS collection ID       |
| `OPENAI_API_KEY`          | Yes      | —                     | OpenAI API key                 |
| `COSMOS_DB_URL`           | Yes      | —                     | Cosmos DB endpoint URL         |
| `COSMOS_DB_KEY`           | Yes      | —                     | Cosmos DB primary key          |
| `REDIS_URL`               | No       | `redis://localhost:6379` | Redis connection URL         |
| `SESSION_SECRET_KEY`      | No       | `change-me-in-production` | HMAC signing key for sessions |
| `SESSION_TTL_SECONDS`     | No       | `86400`               | Session lifetime (24 hours)    |
| `COSMOS_DB_DATABASE`      | No       | `webflow-seo-tool`    | Database name                  |
| `ENVIRONMENT`             | No       | `development`         | `development` or `production`  |

## Development

### Running without Docker

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=info

# Frontend
cd frontend
npm install
npm run dev
```

### Running tests

Tests use in-memory storage and mock clients — no Redis, Cosmos DB, or API keys needed:

```bash
# Via Docker (recommended)
docker compose run --rm api python -m pytest app/tests/ -v

# Locally (requires Python 3.13 with deps installed)
cd backend && pytest app/tests/ -v
```

## License

MIT
