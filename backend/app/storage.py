import json
import redis
from typing import Any, Optional
from app.config import settings

# Redis client (shared across API and Celery workers)
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


# Shared storage instances
jobs_db = RedisStorage("job")
proposals_db = RedisStorage("proposals")
