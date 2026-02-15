from fastapi import APIRouter, HTTPException
from app.models import (
    CreateJobRequest,
    JobResponse,
    JobStatus,
    JobProgress,
    ApplyProposalRequest,
    ApplyProposalResponse,
)
from app.services.webflow_client import WebflowClient, MockWebflowClient
from app.config import settings
from app.tasks import generate_alt_text_task, jobs_db, proposals_db
import uuid
from datetime import datetime
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["jobs"])


def get_webflow_client():
    """Get Webflow client (real if token available, otherwise mock)."""
    if settings.webflow_api_token:
        return WebflowClient(api_token=settings.webflow_api_token)
    return MockWebflowClient()


@router.post("/generate", response_model=JobResponse)
async def create_generation_job(request: CreateJobRequest):
    """
    Create a new job to generate alt text for selected items.

    Returns immediately with a job_id. Alt text generation happens in background.
    Use GET /jobs/{job_id} to poll for completion.
    """
    # Use collection_id from request or env
    collection_id = request.collection_id or settings.webflow_collection_id
    if not collection_id:
        raise HTTPException(
            status_code=400,
            detail="collection_id required",
        )

    # Generate unique job ID
    job_id = str(uuid.uuid4())

    # Calculate estimated duration (rough: 3 seconds per item with 4 images)
    estimated_duration = len(request.item_ids) * 12  # 4 images * 3 sec each

    # Create job metadata
    job = {
        "job_id": job_id,
        "status": JobStatus.QUEUED,
        "collection_id": collection_id,
        "item_ids": request.item_ids,
        "created_at": datetime.now(),
        "progress": JobProgress(
            processed=0,
            total=len(request.item_ids),
            percentage=0.0,
        ),
    }

    # Store in memory
    jobs_db[job_id] = job

    # Dispatch Celery task for background processing
    generate_alt_text_task.delay(job_id, collection_id, request.item_ids)

    logger.info(f"Created job {job_id} for {len(request.item_ids)} items (dispatched to Celery)")

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

    Poll this endpoint to check if generation is complete.
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_db[job_id]

    return JobResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        estimated_duration_seconds=None,
    )


@router.get("/jobs/{job_id}/proposals")
async def get_job_proposals(job_id: str):
    """
    Get generated alt text proposals for a completed job.

    Returns list of proposals with generated alt text for each image.
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_db[job_id]
    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Job not complete. Current status: {job['status']}",
        )

    proposals = proposals_db.get(job_id, [])

    return {
        "job_id": job_id,
        "proposals": [p.model_dump() for p in proposals],
        "total": len(proposals),
    }


@router.post("/apply", response_model=ApplyProposalResponse)
async def apply_proposals(request: ApplyProposalRequest):
    """
    Apply approved alt text proposals to Webflow CMS.

    Groups updates by item_id and applies all field changes per item in a single request.
    Returns success/failure counts and detailed results.
    """
    collection_id = settings.webflow_collection_id
    if not collection_id:
        raise HTTPException(
            status_code=400,
            detail="WEBFLOW_COLLECTION_ID not configured",
        )

    webflow_client = get_webflow_client()

    # Group updates by item_id
    updates_by_item = defaultdict(dict)
    for update in request.updates:
        item_id = update["item_id"]
        field_name = update["field_name"]
        alt_text = update["alt_text"]
        updates_by_item[item_id][field_name] = alt_text

    results = []
    success_count = 0
    failure_count = 0

    # Apply updates item by item
    for item_id, field_data in updates_by_item.items():
        try:
            logger.info(f"Updating item {item_id} with {len(field_data)} fields")
            response = await webflow_client.update_item(
                collection_id=collection_id,
                item_id=item_id,
                field_data=field_data,
            )

            success_count += len(field_data)
            results.append({
                "item_id": item_id,
                "success": True,
                "fields_updated": list(field_data.keys()),
                "message": f"Successfully updated {len(field_data)} field(s)",
            })

        except Exception as e:
            logger.error(f"Failed to update item {item_id}: {str(e)}")
            failure_count += len(field_data)
            results.append({
                "item_id": item_id,
                "success": False,
                "fields_attempted": list(field_data.keys()),
                "error": str(e),
            })

    await webflow_client.close()

    return ApplyProposalResponse(
        success_count=success_count,
        failure_count=failure_count,
        results=results,
    )
