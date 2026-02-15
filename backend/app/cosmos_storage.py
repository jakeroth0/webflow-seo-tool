import json
import logging
from typing import Any, Optional

from azure.cosmos import CosmosClient
from azure.cosmos.exceptions import CosmosResourceNotFoundError

logger = logging.getLogger(__name__)


class CosmosStorage:
    """Azure Cosmos DB-backed storage with dict-like interface.

    Drop-in replacement for RedisStorage. Each instance maps to one
    Cosmos DB container. Documents are keyed by job_id (also the
    partition key), with the payload stored in a 'data' field.
    """

    def __init__(self, client: CosmosClient, database_name: str, container_name: str):
        self._database = client.get_database_client(database_name)
        self._container = self._database.get_container_client(container_name)

    def get(self, key: str) -> Optional[dict]:
        """Get value by key. Returns None if not found."""
        try:
            item = self._container.read_item(item=key, partition_key=key)
            return item.get("data")
        except CosmosResourceNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Cosmos DB read error for key '{key}': {e}")
            raise

    def set(self, key: str, value: Any) -> None:
        """Set value by key (upsert semantics)."""
        document = {
            "id": key,
            "job_id": key,
            "data": json.loads(json.dumps(value, default=str)),
        }
        self._container.upsert_item(document)

    def delete(self, key: str) -> None:
        """Delete item by key."""
        try:
            self._container.delete_item(item=key, partition_key=key)
        except CosmosResourceNotFoundError:
            pass

    def exists(self, key: str) -> bool:
        """Check if key exists."""
        try:
            self._container.read_item(item=key, partition_key=key)
            return True
        except CosmosResourceNotFoundError:
            return False

    def __contains__(self, key: str) -> bool:
        return self.exists(key)

    def __getitem__(self, key: str) -> dict:
        data = self.get(key)
        if data is None:
            raise KeyError(key)
        return data

    def __setitem__(self, key: str, value: Any) -> None:
        self.set(key, value)
