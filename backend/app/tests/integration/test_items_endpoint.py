import pytest
from fastapi.testclient import TestClient
from app.main import app

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
    """Test that missing collection_id returns 422."""
    response = client.get("/api/v1/items")

    assert response.status_code == 422  # Validation error


def test_list_items_invalid_limit():
    """Test that invalid limit returns 422."""
    response = client.get("/api/v1/items?collection_id=test&limit=200")

    assert response.status_code == 422  # Limit must be <= 100
