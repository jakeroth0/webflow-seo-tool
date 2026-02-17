"""Pydantic models for admin API key management."""

from typing import Optional, Literal
from pydantic import BaseModel


class ApiKeysUpdate(BaseModel):
    """Request body for PUT /api/v1/admin/settings/api-keys.

    ``None`` means "leave unchanged"; empty string means "remove stored key".
    """
    webflow_api_token: Optional[str] = None
    webflow_collection_id: Optional[str] = None
    openai_api_key: Optional[str] = None


class ApiKeyStatus(BaseModel):
    """Status of a single API key field."""
    masked_value: Optional[str] = None
    source: Optional[Literal["stored", "env"]] = None


class ApiKeysResponse(BaseModel):
    """Response body for GET /api/v1/admin/settings/api-keys."""
    webflow_api_token: ApiKeyStatus
    webflow_collection_id: ApiKeyStatus
    openai_api_key: ApiKeyStatus
