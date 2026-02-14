from fastapi import APIRouter, HTTPException
from app.models import CreateJobRequest, JobResponse, JobStatus, JobProgress
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["jobs"])

# In-memory job storage (will move to Redis/Cosmos later)
jobs_db = {}


@router.post("/generate", response_model=JobResponse)
async def create_generation_job(request: CreateJobRequest):
    """
    Create a new job to generate alt text for selected items.

    Returns a job_id that can be used to poll for status.
    """
    # Generate unique job ID
    job_id = str(uuid.uuid4())

    # Calculate estimated duration (rough: 2 seconds per item)
    estimated_duration = len(request.item_ids) * 2

    # Create job metadata
    job = {
        "job_id": job_id,
        "status": JobStatus.QUEUED,
        "collection_id": request.collection_id,
        "item_ids": request.item_ids,
        "created_at": datetime.now(),
        "progress": JobProgress(
            processed=0,
            total=len(request.item_ids),
            percentage=0.0,
        ),
    }

    # Store in memory (temporary)
    jobs_db[job_id] = job

    logger.info(f"Created job {job_id} for {len(request.item_ids)} items")

    return JobResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        progress=job["progress"],
        estimated_duration_seconds=estimated_duration,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(job_id: str):
    """
    Get the status of a generation job.

    Use this to poll for job completion.
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_db[job_id]

    return JobResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        estimated_duration_seconds=None,  # Not available after creation
    )
