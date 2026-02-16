from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.models import CMSItemResponse, CMSItem, ImageWithAltText
from app.services.webflow_client import WebflowClient, MockWebflowClient
from app.config import settings
from app.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/items", tags=["items"])


def get_webflow_client():
    """Dependency to get Webflow client (real if token available, otherwise mock)."""
    if settings.webflow_api_token:
        return WebflowClient(api_token=settings.webflow_api_token)
    logger.warning("No Webflow API token found, using mock client")
    return MockWebflowClient()


@router.get("", response_model=CMSItemResponse)
async def list_items(
    collection_id: Optional[str] = Query(
        None, description="Webflow collection ID (uses env default if not provided)"
    ),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    client: WebflowClient = Depends(get_webflow_client),
    current_user: dict = Depends(get_current_user),
):
    """
    List CMS items from a Webflow collection.

    Returns items with all images and their current alt text.
    """
    # Use collection_id from env if not provided
    collection_id = collection_id or settings.webflow_collection_id
    if not collection_id:
        raise HTTPException(
            status_code=400,
            detail="collection_id required (either in query param or WEBFLOW_COLLECTION_ID env var)",
        )

    try:
        # Fetch from Webflow
        result = await client.get_collection_items(
            collection_id=collection_id,
            limit=limit,
            offset=offset,
        )

        # Transform Webflow response to our model
        items = []
        for raw_item in result.get("items", []):
            field_data = raw_item.get("fieldData", {})

            # Extract all 4 image pairs (1-after through 4-after)
            images = []
            for i in range(1, 5):
                image_field = f"{i}-after"
                alt_field = f"{i}-after-alt-text"

                image_data = field_data.get(image_field)
                alt_text = field_data.get(alt_field)

                # Only add if image exists
                if image_data and isinstance(image_data, dict):
                    images.append(
                        ImageWithAltText(
                            field_name=image_field,
                            image_url=image_data.get("url"),
                            current_alt_text=alt_text,
                            file_id=image_data.get("fileId"),
                        )
                    )

            item = CMSItem(
                id=raw_item["id"],
                name=field_data.get("name", "Untitled"),
                slug=field_data.get("slug", ""),
                images=images,
            )
            items.append(item)

        total = result.get("pagination", {}).get("total") or result.get(
            "total", len(items)
        )

        return CMSItemResponse(
            items=items,
            total=total,
            has_more=(offset + len(items)) < total,
        )

    except Exception as e:
        logger.error(f"Failed to fetch items: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch items from Webflow: {str(e)}",
        )
    finally:
        await client.close()
