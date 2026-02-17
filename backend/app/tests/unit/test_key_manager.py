"""Tests for key_manager module."""

import pytest
from unittest.mock import patch, MagicMock
from app.key_manager import get_raw_key, get_masked_keys, save_keys
from app.encryption import encrypt_value


@pytest.fixture
def mem_settings():
    """Provide a fresh in-memory settings store for each test."""
    from app.tests.conftest import InMemoryStorage
    store = InMemoryStorage()
    with patch("app.key_manager.settings_db", store):
        yield store


class TestGetRawKey:
    def test_stored_key_takes_priority(self, mem_settings):
        mem_settings.set("api_keys", {
            "webflow_api_token": encrypt_value("stored-token"),
        })
        value, source = get_raw_key("webflow_api_token")
        assert value == "stored-token"
        assert source == "stored"

    def test_falls_back_to_env(self, mem_settings):
        with patch("app.key_manager.settings", MagicMock(webflow_api_token="env-token")):
            value, source = get_raw_key("webflow_api_token")
        assert value == "env-token"
        assert source == "env"

    def test_returns_none_when_neither_set(self, mem_settings):
        with patch("app.key_manager.settings", MagicMock(webflow_api_token=None)):
            value, source = get_raw_key("webflow_api_token")
        assert value is None
        assert source is None

    def test_decryption_failure_falls_back_to_env(self, mem_settings):
        mem_settings.set("api_keys", {
            "openai_api_key": "invalid-ciphertext",
        })
        with patch("app.key_manager.settings", MagicMock(openai_api_key="env-key")):
            value, source = get_raw_key("openai_api_key")
        assert value == "env-key"
        assert source == "env"


class TestSaveKeys:
    def test_save_and_retrieve(self, mem_settings):
        save_keys({"webflow_api_token": "my-token", "openai_api_key": None})
        value, source = get_raw_key("webflow_api_token")
        assert value == "my-token"
        assert source == "stored"

    def test_empty_string_removes_key(self, mem_settings):
        save_keys({"webflow_api_token": "my-token"})
        save_keys({"webflow_api_token": ""})
        with patch("app.key_manager.settings", MagicMock(webflow_api_token=None)):
            value, source = get_raw_key("webflow_api_token")
        assert value is None
