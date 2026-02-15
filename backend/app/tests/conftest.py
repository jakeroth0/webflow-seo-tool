import pytest
from unittest.mock import patch, MagicMock
from app.main import app
from app.routers.items import get_webflow_client as items_get_client
from app.routers.jobs import get_webflow_client as jobs_get_client
from app.services.webflow_client import MockWebflowClient


class InMemoryStorage:
    """Simple dict wrapper matching the RedisStorage/CosmosStorage interface.

    Used in tests to avoid depending on Redis or Cosmos DB.
    """

    def __init__(self):
        self._data = {}

    def get(self, key):
        return self._data.get(key)

    def set(self, key, value):
        self._data[key] = value

    def delete(self, key):
        self._data.pop(key, None)

    def exists(self, key):
        return key in self._data

    def __contains__(self, key):
        return key in self._data

    def __getitem__(self, key):
        if key not in self._data:
            raise KeyError(key)
        return self._data[key]

    def __setitem__(self, key, value):
        self._data[key] = value


@pytest.fixture(autouse=True)
def mock_storage():
    """Replace storage backends with in-memory dicts for all tests."""
    mem_jobs = InMemoryStorage()
    mem_proposals = InMemoryStorage()
    with (
        patch("app.storage.jobs_db", mem_jobs),
        patch("app.storage.proposals_db", mem_proposals),
        patch("app.routers.jobs.jobs_db", mem_jobs),
        patch("app.routers.jobs.proposals_db", mem_proposals),
        patch("app.tasks.jobs_db", mem_jobs),
        patch("app.tasks.proposals_db", mem_proposals),
    ):
        yield mem_jobs, mem_proposals


@pytest.fixture(autouse=True)
def mock_celery_task():
    """Mock Celery task dispatch so tests don't need a Redis broker."""
    mock_task = MagicMock()
    with patch("app.routers.jobs.generate_alt_text_task", mock_task):
        yield mock_task


@pytest.fixture(autouse=True)
def mock_webflow_client():
    """Use MockWebflowClient for all tests so they don't hit real Webflow API."""
    app.dependency_overrides[items_get_client] = MockWebflowClient
    app.dependency_overrides[jobs_get_client] = MockWebflowClient
    yield
    app.dependency_overrides.clear()
