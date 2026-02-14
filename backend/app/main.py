from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Webflow SEO Tool API",
    version=settings.api_version,
    description="Generate and apply SEO-friendly alt text for Webflow CMS",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
