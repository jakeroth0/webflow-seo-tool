import os
from app.config import Settings


def test_default_settings():
    """Test that default settings load correctly."""
    s = Settings()
    assert s.environment == "development"
    assert s.log_level == "INFO"
    assert "http://localhost:3000" in s.cors_origins


def test_environment_override():
    """Test that environment variables override defaults."""
    os.environ["ENVIRONMENT"] = "production"
    os.environ["LOG_LEVEL"] = "WARNING"

    s = Settings()
    assert s.environment == "production"
    assert s.log_level == "WARNING"

    del os.environ["ENVIRONMENT"]
    del os.environ["LOG_LEVEL"]
