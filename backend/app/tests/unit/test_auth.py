import pytest
from unittest.mock import patch, MagicMock
from app.auth import hash_password, verify_password, create_session, get_session, delete_session


class TestPasswordHashing:
    def test_hash_returns_string(self):
        h = hash_password("mypassword")
        assert isinstance(h, str)
        assert h != "mypassword"

    def test_verify_correct_password(self):
        h = hash_password("mypassword")
        assert verify_password("mypassword", h) is True

    def test_verify_wrong_password(self):
        h = hash_password("mypassword")
        assert verify_password("wrongpassword", h) is False

    def test_different_passwords_different_hashes(self):
        h1 = hash_password("password1")
        h2 = hash_password("password2")
        assert h1 != h2

    def test_same_password_different_salts(self):
        h1 = hash_password("samepass")
        h2 = hash_password("samepass")
        assert h1 != h2  # bcrypt uses random salts


class TestSessionManagement:
    @pytest.fixture(autouse=True)
    def setup_mock_redis(self):
        """Mock redis_client for session tests."""
        self.redis_data = {}

        def mock_setex(key, ttl, value):
            self.redis_data[key] = value

        def mock_get(key):
            return self.redis_data.get(key)

        def mock_delete(key):
            self.redis_data.pop(key, None)

        mock = MagicMock()
        mock.setex = mock_setex
        mock.get = mock_get
        mock.delete = mock_delete

        with patch("app.auth.redis_client", mock):
            yield

    def test_create_and_get_session(self):
        signed = create_session("user_123", "admin", "test@example.com")
        assert isinstance(signed, str)

        session = get_session(signed)
        assert session is not None
        assert session["user_id"] == "user_123"
        assert session["role"] == "admin"
        assert session["email"] == "test@example.com"

    def test_get_session_invalid_token(self):
        session = get_session("invalid-token")
        assert session is None

    def test_delete_session(self):
        signed = create_session("user_123", "admin", "test@example.com")
        assert get_session(signed) is not None

        delete_session(signed)
        assert get_session(signed) is None

    def test_delete_session_invalid_token(self):
        # Should not raise
        delete_session("invalid-token")
