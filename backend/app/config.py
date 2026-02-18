from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App Config
    environment: str = "development"
    log_level: str = "INFO"
    api_version: str = "v1"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> object:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["http://localhost:3000"]
            return json.loads(v)
        return v

    # External APIs
    webflow_api_token: Optional[str] = None
    webflow_collection_id: Optional[str] = None
    openai_api_key: Optional[str] = None

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Session / Auth
    session_secret_key: str = "change-me-in-production"
    session_ttl_seconds: int = 86400  # 24 hours

    # Azure Cosmos DB
    cosmos_db_url: Optional[str] = None
    cosmos_db_key: Optional[str] = None
    cosmos_db_database: str = "webflow-seo-tool"
    cosmos_db_jobs_container: str = "jobs"
    cosmos_db_proposals_container: str = "proposals"
    cosmos_db_users_container: str = "users"
    cosmos_db_settings_container: str = "settings"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
