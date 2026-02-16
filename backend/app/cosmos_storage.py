import json
import logging
from typing import Any, Optional

from azure.cosmos import CosmosClient
from azure.cosmos.exceptions import CosmosResourceNotFoundError

logger = logging.getLogger(__name__)


class CosmosStorage:
    """Azure Cosmos DB-backed storage with dict-like interface.

    Drop-in replacement for RedisStorage. Each instance maps to one
    Cosmos DB container. Documents are keyed by id (also the
    partition key), with the payload stored in a 'data' field.
    """

    def __init__(self, client: CosmosClient, database_name: str, container_name: str,
                 partition_key_field: str = "job_id"):
        self._database = client.get_database_client(database_name)
        self._container = self._database.get_container_client(container_name)
        self._pk_field = partition_key_field

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
            self._pk_field: key,
            "data": json.loads(json.dumps(value, default=str)),
        }
        self._container.upsert_item(document)

    def list_all(self) -> list[dict]:
        """Return all documents' data payloads."""
        items = list(self._container.query_items(
            query="SELECT * FROM c",
            enable_cross_partition_query=True,
        ))
        return [item.get("data") for item in items if item.get("data") is not None]

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
