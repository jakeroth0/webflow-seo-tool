from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class JobStatus(str, Enum):
    """Job processing status."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CreateJobRequest(BaseModel):
    """Request to create a new generation job."""

    item_ids: list[str] = Field(
        ..., min_length=1, description="List of item IDs to process"
    )
    collection_id: Optional[str] = Field(
        None, description="Webflow collection ID (uses env default if not provided)"
    )
    image_keys: Optional[list[str]] = Field(
        None, description="Specific 'itemId:fieldName' keys to generate (all images if omitted)"
    )


class JobProgress(BaseModel):
    """Job progress tracking."""

    processed: int = 0
    total: int
    percentage: float = 0.0


class Job(BaseModel):
    """Job metadata."""

    job_id: str
    status: JobStatus
    collection_id: str
    created_at: datetime
    updated_at: datetime
    progress: JobProgress
    error_message: Optional[str] = None


class JobResponse(BaseModel):
    """Response for job status query."""

    job_id: str
    status: JobStatus
    progress: JobProgress
    estimated_duration_seconds: Optional[int] = None
