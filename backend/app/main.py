import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.logging_config import configure_logging
from app.middleware import RequestLoggingMiddleware
from app.routers import items, jobs, auth, admin

# Configure structured JSON logging before anything else creates loggers
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Webflow SEO Tool API",
    version=settings.api_version,
    description="Generate and apply SEO-friendly alt text for Webflow CMS",
)

# Middleware is applied in reverse order — RequestLogging runs outermost (first in, last out)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
)

# Register routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(items.router)
app.include_router(jobs.router)


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "version": settings.api_version,
        "environment": settings.environment,
        "service": "webflow-seo-api",
    }


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "message": "Webflow SEO Tool API",
        "docs": "/docs",
        "health": "/health",
        "version": settings.api_version,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
