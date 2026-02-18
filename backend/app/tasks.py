import asyncio
import logging
import time
import uuid
from datetime import datetime
from app.celery_app import celery_app
from app.models import JobStatus, JobProgress, Proposal
from app.services.openai_client import AltTextGenerator, MockAltTextGenerator
from app.services.webflow_client import WebflowClient, MockWebflowClient
from app.storage import jobs_db, proposals_db
from app.key_manager import get_webflow_api_token, get_openai_api_key

logger = logging.getLogger(__name__)


def get_alt_text_generator():
    """Get OpenAI client (real if API key available, otherwise mock)."""
    api_key = get_openai_api_key()
    if api_key:
        return AltTextGenerator(api_key=api_key)
    logger.warning("No OpenAI API key found, using mock generator")
    return MockAltTextGenerator()


def get_webflow_client():
    """Get Webflow client (real if token available, otherwise mock)."""
    token = get_webflow_api_token()
    if token:
        return WebflowClient(api_token=token)
    return MockWebflowClient()


async def process_job_async(job_id: str, collection_id: str, item_ids: list[str], image_keys: list[str] | None = None):
    """
    Async logic for processing alt text generation.

    This is the same logic as before, just extracted for Celery.
    """
    try:
        # Update job status to PROCESSING
        job_data = jobs_db[job_id]
        job_data["status"] = JobStatus.PROCESSING
        jobs_db[job_id] = job_data
        job_start = time.monotonic()
        logger.info(
            "Job started",
            extra={
                "job_id": job_id,
                "item_count": len(item_ids),
                "image_keys_count": len(image_keys) if image_keys else "all",
                "collection_id": collection_id,
            },
        )

        webflow_client = get_webflow_client()
        ai_generator = get_alt_text_generator()
        logger.info(
            "Clients initialized",
            extra={
                "job_id": job_id,
                "webflow_client": type(webflow_client).__name__,
                "ai_generator": type(ai_generator).__name__,
                "ai_model": ai_generator.model,
            },
        )
        proposals = []

        # Fetch all items from Webflow (paginated)
        all_items = await webflow_client.get_all_collection_items(
            collection_id=collection_id,
            target_ids=item_ids,
        )

        # Build a lookup map
        items_map = {item["id"]: item for item in all_items}
        logger.info(
            "Webflow items fetched",
            extra={
                "job_id": job_id,
                "total_fetched": len(all_items),
                "requested": len(item_ids),
                "matched": len(set(item_ids) & set(items_map.keys())),
            },
        )

        # Process each item
        total = len(item_ids)
        images_processed = 0
        images_skipped = 0
        for idx, item_id in enumerate(item_ids):
            try:
                raw_item = items_map.get(item_id)
                if not raw_item:
                    logger.warning("Item not found in Webflow, skipping", extra={"job_id": job_id, "item_id": item_id})
                    continue

                field_data = raw_item.get("fieldData", {})
                project_name = field_data.get("name", "Project")

                # Process image fields (filtered by image_keys if provided)
                # allowed_fields: set of field names like "1-after" for this item
                if image_keys is not None:
                    allowed_fields = {
                        key.split(":", 1)[1]
                        for key in image_keys
                        if key.split(":", 1)[0] == item_id
                    }
                else:
                    allowed_fields = None  # None means process all

                for i in range(1, 5):
                    image_field = f"{i}-after"
                    alt_field = f"{i}-after-alt-text"

                    # Skip if not in the opted-in set
                    if allowed_fields is not None and image_field not in allowed_fields:
                        images_skipped += 1
                        continue

                    image_data = field_data.get(image_field)
                    existing_alt = field_data.get(alt_field)

                    # Only generate if image exists
                    if image_data and isinstance(image_data, dict):
                        image_url = image_data.get("url")
                        if image_url:
                            img_start = time.monotonic()
                            logger.info(
                                "Generating alt text for image",
                                extra={
                                    "job_id": job_id,
                                    "item_id": item_id,
                                    "field": image_field,
                                    "project": project_name,
                                    "image_url": image_url[:80],
                                },
                            )
                            # Generate alt text using AI
                            generated_alt = await ai_generator.generate_alt_text(
                                image_url=image_url,
                                context={
                                    "name": project_name,
                                    "existing_alt": existing_alt,
                                    "field_name": image_field,
                                },
                            )
                            img_ms = round((time.monotonic() - img_start) * 1000, 2)
                            images_processed += 1
                            logger.info(
                                "Alt text generated",
                                extra={
                                    "job_id": job_id,
                                    "item_id": item_id,
                                    "field": image_field,
                                    "duration_ms": img_ms,
                                    "alt_text_length": len(generated_alt),
                                    "images_done": images_processed,
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
                job_data = jobs_db[job_id]
                job_data["progress"] = {
                    "processed": idx + 1,
                    "total": total,
                    "percentage": ((idx + 1) / total) * 100,
                }
                jobs_db[job_id] = job_data

            except Exception as e:
                logger.error(
                    "Error processing item",
                    extra={"job_id": job_id, "item_id": item_id, "error": str(e)},
                    exc_info=True,
                )
                continue

        # Store proposals (serialize Pydantic models to dicts)
        proposals_db[job_id] = [p.model_dump() for p in proposals]

        # Mark job as complete
        job_data = jobs_db[job_id]
        job_data["status"] = JobStatus.COMPLETED
        jobs_db[job_id] = job_data
        duration_ms = round((time.monotonic() - job_start) * 1000, 2)
        logger.info(
            "Job completed",
            extra={
                "job_id": job_id,
                "proposal_count": len(proposals),
                "images_processed": images_processed,
                "images_skipped": images_skipped,
                "duration_ms": duration_ms,
            },
        )

        await webflow_client.close()

    except Exception as e:
        logger.error(
            "Job failed",
            extra={"job_id": job_id, "error": str(e)},
            exc_info=True,
        )
        job_data = jobs_db[job_id]
        job_data["status"] = JobStatus.FAILED
        job_data["error_message"] = str(e)
        jobs_db[job_id] = job_data


@celery_app.task(name="app.tasks.generate_alt_text", bind=True)
def generate_alt_text_task(self, job_id: str, collection_id: str, item_ids: list[str], image_keys: list[str] | None = None):
    """
    Celery task to generate alt text for CMS items.

    This wraps the async processing logic to run in Celery worker.
    """
    logger.info("Celery task started", extra={"job_id": job_id})

    # Run the async logic in a new event loop
    # (Celery workers run sync code, so we need to create a loop)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(
            process_job_async(job_id, collection_id, item_ids, image_keys)
        )
    finally:
        loop.close()

    logger.info("Celery task completed", extra={"job_id": job_id})
    return {"job_id": job_id, "status": "completed"}
