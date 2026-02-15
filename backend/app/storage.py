import json
import logging
import redis
from typing import Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

# Redis client -- always needed (Celery broker uses it, and fallback storage)
redis_client = redis.from_url(settings.redis_url, decode_responses=True)


class RedisStorage:
    """Redis-backed storage for jobs and proposals (shared across containers)."""

    def __init__(self, prefix: str):
        self.prefix = prefix

    def get(self, key: str) -> Optional[dict]:
        """Get value from Redis."""
        data = redis_client.get(f"{self.prefix}:{key}")
        if data:
            return json.loads(data)
        return None

    def set(self, key: str, value: Any) -> None:
        """Set value in Redis."""
        redis_client.set(f"{self.prefix}:{key}", json.dumps(value, default=str))

    def delete(self, key: str) -> None:
        """Delete key from Redis."""
        redis_client.delete(f"{self.prefix}:{key}")

    def exists(self, key: str) -> bool:
        """Check if key exists in Redis."""
        return redis_client.exists(f"{self.prefix}:{key}") > 0

    def __contains__(self, key: str) -> bool:
        """Support 'in' operator."""
        return self.exists(key)

    def __getitem__(self, key: str) -> dict:
        """Support dict-like access."""
        data = self.get(key)
        if data is None:
            raise KeyError(key)
        return data

    def __setitem__(self, key: str, value: Any) -> None:
        """Support dict-like assignment."""
        self.set(key, value)


def _create_storage():
    """Factory: create CosmosStorage if configured, otherwise RedisStorage."""
    if settings.cosmos_db_url and settings.cosmos_db_key:
        try:
            from azure.cosmos import CosmosClient
            from app.cosmos_storage import CosmosStorage

            logger.info("Initializing Cosmos DB storage...")
            client = CosmosClient(settings.cosmos_db_url, settings.cosmos_db_key)

            jobs = CosmosStorage(
                client=client,
                database_name=settings.cosmos_db_database,
                container_name=settings.cosmos_db_jobs_container,
            )
            proposals = CosmosStorage(
                client=client,
                database_name=settings.cosmos_db_database,
                container_name=settings.cosmos_db_proposals_container,
            )
            logger.info("Cosmos DB storage initialized successfully")
            return jobs, proposals

        except Exception as e:
            logger.error(f"Failed to initialize Cosmos DB: {e}. Falling back to Redis.")

    logger.info("Using Redis storage (Cosmos DB not configured)")
    return RedisStorage("job"), RedisStorage("proposals")


# Shared storage instances -- used by tasks.py and routers/jobs.py
jobs_db, proposals_db = _create_storage()
