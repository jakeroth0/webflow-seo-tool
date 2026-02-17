"""Centralised API-key retrieval with stored > env-var fallback.

Keys stored via the admin UI are encrypted at rest in ``settings_db``.
If decryption fails (e.g. secret rotation), the manager silently falls
back to the environment variable.
"""

import logging
from typing import Optional

from cryptography.fernet import InvalidToken

from app.config import settings
from app.encryption import decrypt_value, encrypt_value, mask_value
from app.models.api_keys import ApiKeyStatus, ApiKeysResponse
from app.storage import settings_db

logger = logging.getLogger(__name__)

SETTINGS_KEY = "api_keys"

# Maps logical key name → Settings attribute for env-var fallback
_ENV_FALLBACK = {
    "webflow_api_token": "webflow_api_token",
    "webflow_collection_id": "webflow_collection_id",
    "openai_api_key": "openai_api_key",
}


def _load_stored() -> dict:
    """Return the raw stored dict from settings_db (or empty dict)."""
    return settings_db.get(SETTINGS_KEY) or {}


def get_raw_key(key_name: str) -> tuple[Optional[str], Optional[str]]:
    """Return ``(value, source)`` for *key_name*.

    Checks the encrypted store first, then falls back to the env var.
    Returns ``(None, None)`` when neither source provides a value.
    """
    stored = _load_stored()
    ciphertext = stored.get(key_name)
    if ciphertext:
        try:
            return decrypt_value(ciphertext), "stored"
        except (InvalidToken, Exception):
            logger.warning("Failed to decrypt stored key %s, falling back to env", key_name)

    env_value = getattr(settings, _ENV_FALLBACK.get(key_name, ""), None)
    if env_value:
        return env_value, "env"

    return None, None


# --- Convenience helpers used by routers / tasks ---

def get_webflow_api_token() -> Optional[str]:
    value, _ = get_raw_key("webflow_api_token")
    return value


def get_webflow_collection_id() -> Optional[str]:
    value, _ = get_raw_key("webflow_collection_id")
    return value


def get_openai_api_key() -> Optional[str]:
    value, _ = get_raw_key("openai_api_key")
    return value


# --- Admin UI helpers ---

def get_masked_keys() -> ApiKeysResponse:
    """Return masked values + sources for all keys (used by GET endpoint)."""
    statuses = {}
    for key_name in _ENV_FALLBACK:
        value, source = get_raw_key(key_name)
        if value:
            statuses[key_name] = ApiKeyStatus(masked_value=mask_value(value), source=source)
        else:
            statuses[key_name] = ApiKeyStatus()
    return ApiKeysResponse(**statuses)


def save_keys(updates: dict[str, Optional[str]]) -> None:
    """Persist key updates.  Empty string = remove; None = skip."""
    stored = _load_stored()
    for key_name, raw_value in updates.items():
        if raw_value is None:
            continue  # leave unchanged
        if raw_value == "":
            stored.pop(key_name, None)  # remove
        else:
            stored[key_name] = encrypt_value(raw_value)
    settings_db.set(SETTINGS_KEY, stored)
