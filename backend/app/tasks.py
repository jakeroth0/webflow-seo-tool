import asyncio
import logging
import uuid
from datetime import datetime
from app.celery_app import celery_app
from app.models import JobStatus, JobProgress, Proposal
from app.services.openai_client import AltTextGenerator, MockAltTextGenerator
from app.services.webflow_client import WebflowClient, MockWebflowClient
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory storage (shared with routers/jobs.py)
# In future phases, this will be replaced with Redis/Cosmos
jobs_db = {}
proposals_db = {}


def get_alt_text_generator():
    """Get OpenAI client (real if API key available, otherwise mock)."""
    if settings.openai_api_key:
        return AltTextGenerator(api_key=settings.openai_api_key)
    logger.warning("No OpenAI API key found, using mock generator")
    return MockAltTextGenerator()


def get_webflow_client():
    """Get Webflow client (real if token available, otherwise mock)."""
    if settings.webflow_api_token:
        return WebflowClient(api_token=settings.webflow_api_token)
    return MockWebflowClient()


async def process_job_async(job_id: str, collection_id: str, item_ids: list[str]):
    """
    Async logic for processing alt text generation.

    This is the same logic as before, just extracted for Celery.
    """
    try:
        jobs_db[job_id]["status"] = JobStatus.PROCESSING
        logger.info(f"Starting job {job_id} with {len(item_ids)} items")

        webflow_client = get_webflow_client()
        ai_generator = get_alt_text_generator()
        proposals = []

        # Fetch all items from Webflow
        result = await webflow_client.get_collection_items(
            collection_id=collection_id,
            limit=100,  # Get enough to cover our item_ids
        )

        # Build a lookup map
        items_map = {
            item["id"]: item for item in result.get("items", [])
        }

        # Process each item
        total = len(item_ids)
        for idx, item_id in enumerate(item_ids):
            try:
                raw_item = items_map.get(item_id)
                if not raw_item:
                    logger.warning(f"Item {item_id} not found, skipping")
                    continue

                field_data = raw_item.get("fieldData", {})
                project_name = field_data.get("name", "Project")

                # Process all 4 image fields
                for i in range(1, 5):
                    image_field = f"{i}-after"
                    alt_field = f"{i}-after-alt-text"

                    image_data = field_data.get(image_field)
                    existing_alt = field_data.get(alt_field)

                    # Only generate if image exists
                    if image_data and isinstance(image_data, dict):
                        image_url = image_data.get("url")
                        if image_url:
                            # Generate alt text using AI
                            generated_alt = await ai_generator.generate_alt_text(
                                image_url=image_url,
                                context={
                                    "name": project_name,
                                    "existing_alt": existing_alt,
                                    "field_name": image_field,
                                },
                            )

                            # Create proposal
                            proposal = Proposal(
                                proposal_id=str(uuid.uuid4()),
                                job_id=job_id,
                                item_id=item_id,
                                field_name=alt_field,  # Use alt text field name
                                proposed_alt_text=generated_alt,
                                confidence_score=0.9,
                                model_used=ai_generator.model,
                                generated_at=datetime.now(),
                            )
                            proposals.append(proposal)

                # Update progress
                jobs_db[job_id]["progress"] = JobProgress(
                    processed=idx + 1,
                    total=total,
                    percentage=((idx + 1) / total) * 100,
                )

            except Exception as e:
                logger.error(f"Error processing item {item_id}: {str(e)}")
                continue

        # Store proposals
        proposals_db[job_id] = proposals

        # Mark job as complete
        jobs_db[job_id]["status"] = JobStatus.COMPLETED
        logger.info(f"Job {job_id} completed with {len(proposals)} proposals")

        await webflow_client.close()

    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        jobs_db[job_id]["status"] = JobStatus.FAILED
        jobs_db[job_id]["error_message"] = str(e)


@celery_app.task(name="app.tasks.generate_alt_text", bind=True)
def generate_alt_text_task(self, job_id: str, collection_id: str, item_ids: list[str]):
    """
    Celery task to generate alt text for CMS items.

    This wraps the async processing logic to run in Celery worker.
    """
    logger.info(f"Celery task started for job {job_id}")

    # Run the async logic in a new event loop
    # (Celery workers run sync code, so we need to create a loop)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(
            process_job_async(job_id, collection_id, item_ids)
        )
    finally:
        loop.close()

    logger.info(f"Celery task completed for job {job_id}")
    return {"job_id": job_id, "status": "completed"}
