import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user

STUB_USER = {"user_id": "test_user", "role": "admin", "email": "test@test.com"}


@pytest.fixture(autouse=True)
def override_auth():
    """Override auth dependency so existing tests pass without session cookies."""
    app.dependency_overrides[get_current_user] = lambda: STUB_USER
    yield
    app.dependency_overrides.pop(get_current_user, None)


client = TestClient(app)


def test_list_items_success():
    """Test successful items retrieval."""
    response = client.get("/api/v1/items?collection_id=test123")

    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    assert "total" in data
    assert "has_more" in data
    assert len(data["items"]) == 2  # Mock returns 2 items


def test_list_items_with_pagination():
    """Test pagination parameters."""
    response = client.get("/api/v1/items?collection_id=test123&limit=10&offset=0")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 0


def test_list_items_missing_collection_id():
    """Test that missing collection_id returns 400 when env var also unset."""
    with patch("app.routers.items.settings") as mock_settings:
        mock_settings.webflow_collection_id = None
        response = client.get("/api/v1/items")

    assert response.status_code == 400


def test_list_items_invalid_limit():
    """Test that invalid limit returns 422."""
    response = client.get("/api/v1/items?collection_id=test&limit=200")

    assert response.status_code == 422  # Limit must be <= 100
