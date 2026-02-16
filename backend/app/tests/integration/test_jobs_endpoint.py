import pytest
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


def test_create_job_success():
    """Test creating a generation job."""
    response = client.post(
        "/api/v1/generate",
        json={"item_ids": ["item1", "item2", "item3"], "collection_id": "coll123"},
    )

    assert response.status_code == 200
    data = response.json()

    assert "job_id" in data
    assert data["status"] == "queued"
    assert data["progress"]["total"] == 3
    assert data["progress"]["processed"] == 0
    assert data["estimated_duration_seconds"] == 36  # 3 items * 12 sec (4 images * 3s each)


def test_create_job_empty_items():
    """Test that empty item_ids returns validation error."""
    response = client.post(
        "/api/v1/generate",
        json={"item_ids": [], "collection_id": "coll123"},
    )

    assert response.status_code == 422  # Validation error


def test_get_job_status():
    """Test retrieving job status."""
    # First create a job
    create_response = client.post(
        "/api/v1/generate",
        json={"item_ids": ["item1"], "collection_id": "coll123"},
    )
    job_id = create_response.json()["job_id"]

    # Then get its status
    status_response = client.get(f"/api/v1/jobs/{job_id}")

    assert status_response.status_code == 200
    data = status_response.json()
    assert data["job_id"] == job_id
    assert data["status"] == "queued"


def test_get_nonexistent_job():
    """Test that requesting nonexistent job returns 404."""
    response = client.get("/api/v1/jobs/fake-job-id")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
