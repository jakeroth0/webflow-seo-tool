import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.tests.conftest import register_user


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


def register_admin(client):
    """Register first user (admin) and return cookies."""
    resp = register_user(client, "admin@test.com", "adminpass123", "Admin")
    return resp.cookies


def register_regular_user(client, admin_cookies):
    """Register a second user (regular) and return their cookies."""
    resp = register_user(client, "user@test.com", "userpass123", "User")
    return resp.cookies


class TestListUsers:
    def test_admin_can_list_users(self, client):
        admin_cookies = register_admin(client)
        resp = client.get("/api/v1/admin/users", cookies=admin_cookies)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["email"] == "admin@test.com"

    def test_regular_user_cannot_list_users(self, client):
        register_admin(client)
        user_cookies = register_regular_user(client, None)
        resp = client.get("/api/v1/admin/users", cookies=user_cookies)
        assert resp.status_code == 403

    def test_unauthenticated_cannot_list_users(self, client):
        resp = client.get("/api/v1/admin/users")
        assert resp.status_code == 401


class TestInviteUser:
    def test_admin_can_invite_user(self, client):
        admin_cookies = register_admin(client)
        resp = client.post("/api/v1/admin/users/invite", cookies=admin_cookies, json={
            "email": "invited@test.com",
            "password": "invitedpass123",
            "display_name": "Invited",
            "role": "user",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "invited@test.com"
        assert data["role"] == "user"

    def test_admin_can_invite_admin(self, client):
        admin_cookies = register_admin(client)
        resp = client.post("/api/v1/admin/users/invite", cookies=admin_cookies, json={
            "email": "admin2@test.com",
            "password": "admin2pass123",
            "display_name": "Admin 2",
            "role": "admin",
        })
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    def test_invite_duplicate_email(self, client):
        admin_cookies = register_admin(client)
        resp = client.post("/api/v1/admin/users/invite", cookies=admin_cookies, json={
            "email": "admin@test.com",
            "password": "somepass123",
            "display_name": "Dupe",
            "role": "user",
        })
        assert resp.status_code == 409

    def test_regular_user_cannot_invite(self, client):
        register_admin(client)
        user_cookies = register_regular_user(client, None)
        resp = client.post("/api/v1/admin/users/invite", cookies=user_cookies, json={
            "email": "another@test.com",
            "password": "somepass123",
            "display_name": "Another",
            "role": "user",
        })
        assert resp.status_code == 403


class TestUpdateUser:
    def test_admin_can_change_role(self, client, mock_storage):
        admin_cookies = register_admin(client)
        register_user(client, "user@test.com", "userpass123", "User")

        # Find user_id
        users = mock_storage["users"].list_all()
        user = next(u for u in users if u["email"] == "user@test.com")

        resp = client.patch(
            f"/api/v1/admin/users/{user['user_id']}",
            cookies=admin_cookies,
            json={"role": "admin"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    def test_admin_can_deactivate_user(self, client, mock_storage):
        admin_cookies = register_admin(client)
        register_user(client, "user@test.com", "userpass123", "User")

        users = mock_storage["users"].list_all()
        user = next(u for u in users if u["email"] == "user@test.com")

        resp = client.patch(
            f"/api/v1/admin/users/{user['user_id']}",
            cookies=admin_cookies,
            json={"is_active": False},
        )
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False

    def test_cannot_demote_last_admin(self, client, mock_storage):
        admin_cookies = register_admin(client)

        users = mock_storage["users"].list_all()
        admin = next(u for u in users if u["role"] == "admin")

        resp = client.patch(
            f"/api/v1/admin/users/{admin['user_id']}",
            cookies=admin_cookies,
            json={"role": "user"},
        )
        assert resp.status_code == 400
        assert "last admin" in resp.json()["detail"].lower()

    def test_cannot_deactivate_last_admin(self, client, mock_storage):
        admin_cookies = register_admin(client)

        users = mock_storage["users"].list_all()
        admin = next(u for u in users if u["role"] == "admin")

        resp = client.patch(
            f"/api/v1/admin/users/{admin['user_id']}",
            cookies=admin_cookies,
            json={"is_active": False},
        )
        assert resp.status_code == 400
        assert "last admin" in resp.json()["detail"].lower()

    def test_update_nonexistent_user(self, client):
        admin_cookies = register_admin(client)
        resp = client.patch(
            "/api/v1/admin/users/user_nonexistent",
            cookies=admin_cookies,
            json={"role": "admin"},
        )
        assert resp.status_code == 404


class TestSettings:
    def test_get_default_settings(self, client):
        admin_cookies = register_admin(client)
        resp = client.get("/api/v1/admin/settings", cookies=admin_cookies)
        assert resp.status_code == 200
        data = resp.json()
        assert "notifications" in data
        assert data["notifications"]["email_enabled"] is False

    def test_update_notification_settings(self, client):
        admin_cookies = register_admin(client)
        resp = client.put("/api/v1/admin/settings/notifications", cookies=admin_cookies, json={
            "email_enabled": True,
            "email_recipients": ["admin@test.com"],
            "teams_enabled": False,
            "teams_webhook_url": "",
        })
        assert resp.status_code == 200

        # Verify persisted
        resp = client.get("/api/v1/admin/settings", cookies=admin_cookies)
        data = resp.json()
        assert data["notifications"]["email_enabled"] is True

    def test_regular_user_cannot_access_settings(self, client):
        register_admin(client)
        user_cookies = register_regular_user(client, None)
        resp = client.get("/api/v1/admin/settings", cookies=user_cookies)
        assert resp.status_code == 403


class TestApiKeyManagement:
    @pytest.fixture(autouse=True)
    def _clear_env_keys(self):
        """Ensure env-var keys don't leak into API key tests."""
        mock_settings = MagicMock(
            webflow_api_token=None,
            webflow_collection_id=None,
            openai_api_key=None,
            session_secret_key="change-me-in-production",
        )
        with patch("app.key_manager.settings", mock_settings):
            yield

    def test_get_default_empty(self, client):
        admin_cookies = register_admin(client)
        resp = client.get("/api/v1/admin/settings/api-keys", cookies=admin_cookies)
        assert resp.status_code == 200
        data = resp.json()
        assert data["webflow_api_token"]["source"] is None
        assert data["openai_api_key"]["source"] is None

    def test_put_then_get_returns_masked(self, client):
        admin_cookies = register_admin(client)
        resp = client.put("/api/v1/admin/settings/api-keys", cookies=admin_cookies, json={
            "webflow_api_token": "wf-1234567890",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["webflow_api_token"]["source"] == "stored"
        assert data["webflow_api_token"]["masked_value"].endswith("7890")
        assert "wf-" not in data["webflow_api_token"]["masked_value"]

    def test_partial_update_preserves_others(self, client):
        admin_cookies = register_admin(client)
        # Set two keys
        client.put("/api/v1/admin/settings/api-keys", cookies=admin_cookies, json={
            "webflow_api_token": "wf-token",
            "openai_api_key": "sk-openai",
        })
        # Update only one
        client.put("/api/v1/admin/settings/api-keys", cookies=admin_cookies, json={
            "webflow_api_token": "wf-updated",
        })
        resp = client.get("/api/v1/admin/settings/api-keys", cookies=admin_cookies)
        data = resp.json()
        assert data["webflow_api_token"]["source"] == "stored"
        assert data["openai_api_key"]["source"] == "stored"

    def test_empty_string_removes_key(self, client):
        admin_cookies = register_admin(client)
        client.put("/api/v1/admin/settings/api-keys", cookies=admin_cookies, json={
            "webflow_api_token": "wf-token",
        })
        client.put("/api/v1/admin/settings/api-keys", cookies=admin_cookies, json={
            "webflow_api_token": "",
        })
        resp = client.get("/api/v1/admin/settings/api-keys", cookies=admin_cookies)
        data = resp.json()
        assert data["webflow_api_token"]["source"] is None

    def test_non_admin_gets_403(self, client):
        register_admin(client)
        user_cookies = register_regular_user(client, None)
        resp = client.get("/api/v1/admin/settings/api-keys", cookies=user_cookies)
        assert resp.status_code == 403
