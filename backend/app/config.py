from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App Config
    environment: str = "development"
    log_level: str = "INFO"
    api_version: str = "v1"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # External APIs
    webflow_api_token: Optional[str] = None
    webflow_collection_id: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Redis (for later phases)
    redis_url: str = "redis://localhost:6379"

    # Database (for later phases)
    cosmos_db_url: Optional[str] = None
    cosmos_db_key: Optional[str] = None

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
