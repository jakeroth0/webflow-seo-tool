from celery import Celery
from app.config import settings

# Create Celery app
celery_app = Celery(
    "webflow_seo_tool",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"],  # Import tasks module
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max per task
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks (prevent memory leaks)
)
