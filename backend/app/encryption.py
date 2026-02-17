"""Symmetric encryption helpers for storing API keys at rest.

Uses Fernet (AES-128-CBC + HMAC-SHA256) from the ``cryptography`` package,
which is already installed as a transitive dependency of ``python-jose[cryptography]``.
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


def _get_fernet() -> Fernet:
    """Derive a Fernet key from the application's session secret."""
    digest = hashlib.sha256(settings.session_secret_key.encode()).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_value(plaintext: str) -> str:
    """Encrypt *plaintext* and return a URL-safe base-64 ciphertext string."""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_value(ciphertext: str) -> str:
    """Decrypt a value previously produced by :func:`encrypt_value`.

    Raises ``cryptography.fernet.InvalidToken`` on tampered / invalid data.
    """
    return _get_fernet().decrypt(ciphertext.encode()).decode()


def mask_value(value: str) -> str:
    """Return a fixed-width masked representation showing only the last 4 characters.

    Always returns ``****xxxx`` (8 chars) for values longer than 4 characters,
    regardless of the actual key length, so long keys don't overflow the UI.
    """
    if len(value) <= 4:
        return "*" * len(value)
    return "****" + value[-4:]
