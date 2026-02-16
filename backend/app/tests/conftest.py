import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
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

    def list_all(self):
        return list(self._data.values())

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
    mem_users = InMemoryStorage()
    mem_settings = InMemoryStorage()
    with (
        patch("app.storage.jobs_db", mem_jobs),
        patch("app.storage.proposals_db", mem_proposals),
        patch("app.storage.users_db", mem_users),
        patch("app.storage.settings_db", mem_settings),
        patch("app.routers.jobs.jobs_db", mem_jobs),
        patch("app.routers.jobs.proposals_db", mem_proposals),
        patch("app.routers.auth.users_db", mem_users),
        patch("app.routers.admin.users_db", mem_users),
        patch("app.routers.admin.settings_db", mem_settings),
        patch("app.tasks.jobs_db", mem_jobs),
        patch("app.tasks.proposals_db", mem_proposals),
    ):
        yield {
            "jobs": mem_jobs,
            "proposals": mem_proposals,
            "users": mem_users,
            "settings": mem_settings,
        }


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


@pytest.fixture
def client():
    """TestClient for making HTTP requests."""
    return TestClient(app)


@pytest.fixture
def mock_redis_client():
    """Mock Redis client for session tests."""
    mock = MagicMock()
    mock_data = {}

    def mock_setex(key, ttl, value):
        mock_data[key] = value

    def mock_get(key):
        return mock_data.get(key)

    def mock_delete(key):
        mock_data.pop(key, None)

    mock.setex = mock_setex
    mock.get = mock_get
    mock.delete = mock_delete

    return mock, mock_data


def register_user(client, email="test@example.com", password="testpass123",
                  display_name="Test User"):
    """Helper: register a user and return the response."""
    return client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "display_name": display_name,
    })


def login_user(client, email="test@example.com", password="testpass123"):
    """Helper: login and return the response."""
    return client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })


def get_auth_cookies(client, email="admin@test.com", password="adminpass123",
                     display_name="Admin"):
    """Helper: register a user and return cookies dict for auth."""
    resp = register_user(client, email, password, display_name)
    return resp.cookies
