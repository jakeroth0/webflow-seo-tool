"""Tests for encryption helpers."""

import pytest
from app.encryption import encrypt_value, decrypt_value, mask_value


class TestEncryptDecrypt:
    def test_roundtrip(self):
        plaintext = "sk-abc123xyz"
        ciphertext = encrypt_value(plaintext)
        assert decrypt_value(ciphertext) == plaintext

    def test_different_ciphertexts_for_same_value(self):
        """Fernet includes a timestamp, so encrypting the same value twice yields different ciphertexts."""
        a = encrypt_value("same")
        b = encrypt_value("same")
        assert a != b

    def test_invalid_ciphertext_raises(self):
        from cryptography.fernet import InvalidToken
        with pytest.raises(InvalidToken):
            decrypt_value("not-valid-ciphertext")

    def test_empty_string_roundtrip(self):
        ciphertext = encrypt_value("")
        assert decrypt_value(ciphertext) == ""


class TestMaskValue:
    def test_long_string_fixed_width(self):
        result = mask_value("sk-abcdefghijklmnop")
        assert result == "****mnop"
        assert len(result) == 8

    def test_short_string(self):
        assert mask_value("ab") == "**"
        assert mask_value("abcd") == "****"

    def test_five_chars(self):
        # Any value > 4 chars becomes ****<last4>
        result = mask_value("12345")
        assert result == "****2345"
