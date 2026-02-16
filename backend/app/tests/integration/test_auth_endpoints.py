import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.tests.conftest import register_user, login_user


@pytest.fixture(autouse=True)
def mock_redis_for_sessions():
    """Mock Redis client used by auth module for sessions."""
    data = {}

    def mock_setex(key, ttl, value):
        data[key] = value

    def mock_get(key):
        return data.get(key)

    def mock_delete(key):
        data.pop(key, None)

    mock = MagicMock()
    mock.setex = mock_setex
    mock.get = mock_get
    mock.delete = mock_delete

    with patch("app.auth.redis_client", mock):
        yield


class TestRegister:
    def test_register_first_user_becomes_admin(self, client):
        resp = register_user(client, "admin@test.com", "adminpass123", "Admin")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "admin"
        assert data["email"] == "admin@test.com"
        assert data["display_name"] == "Admin"
        assert data["is_active"] is True
        assert "session_id" in resp.cookies

    def test_register_second_user_becomes_user(self, client):
        register_user(client, "admin@test.com", "adminpass123", "Admin")
        resp = register_user(client, "user@test.com", "userpass123", "User")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "user"

    def test_register_duplicate_email(self, client):
        register_user(client, "dupe@test.com", "pass12345", "Dupe")
        resp = register_user(client, "dupe@test.com", "pass12345", "Dupe2")
        assert resp.status_code == 409

    def test_register_short_password(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "test@test.com",
            "password": "short",
            "display_name": "Test",
        })
        assert resp.status_code == 422

    def test_register_missing_fields(self, client):
        resp = client.post("/api/v1/auth/register", json={
            "email": "test@test.com",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        register_user(client, "login@test.com", "password123", "Login User")
        resp = login_user(client, "login@test.com", "password123")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "login@test.com"
        assert "session_id" in resp.cookies

    def test_login_wrong_password(self, client):
        register_user(client, "login@test.com", "password123", "Login User")
        resp = login_user(client, "login@test.com", "wrongpassword")
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = login_user(client, "nobody@test.com", "password123")
        assert resp.status_code == 401

    def test_login_deactivated_user(self, client, mock_storage):
        register_user(client, "inactive@test.com", "password123", "Inactive")
        # Deactivate user directly in storage
        for key, user in mock_storage["users"]._data.items():
            if user["email"] == "inactive@test.com":
                user["is_active"] = False
                break
        resp = login_user(client, "inactive@test.com", "password123")
        assert resp.status_code == 403


class TestLogout:
    def test_logout(self, client):
        reg_resp = register_user(client, "logout@test.com", "password123", "Logout")
        cookies = reg_resp.cookies
        resp = client.post("/api/v1/auth/logout", cookies=cookies)
        assert resp.status_code == 200

    def test_logout_unauthenticated(self, client):
        resp = client.post("/api/v1/auth/logout")
        assert resp.status_code == 401


class TestGetMe:
    def test_get_me_authenticated(self, client):
        reg_resp = register_user(client, "me@test.com", "password123", "Me User")
        cookies = reg_resp.cookies
        resp = client.get("/api/v1/auth/me", cookies=cookies)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "me@test.com"
        assert data["display_name"] == "Me User"

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401


class TestProtectedEndpoints:
    def test_items_requires_auth(self, client):
        resp = client.get("/api/v1/items")
        assert resp.status_code == 401

    def test_items_with_auth(self, client):
        reg_resp = register_user(client, "items@test.com", "password123", "Items User")
        resp = client.get("/api/v1/items", cookies=reg_resp.cookies)
        assert resp.status_code == 200

    def test_generate_requires_auth(self, client):
        resp = client.post("/api/v1/generate", json={
            "item_ids": ["item1"],
        })
        assert resp.status_code == 401

    def test_apply_requires_auth(self, client):
        resp = client.post("/api/v1/apply", json={
            "updates": [],
        })
        assert resp.status_code == 401
