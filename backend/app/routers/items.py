from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.models import CMSItemResponse, CMSItem
from app.services.webflow_client import MockWebflowClient
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/items", tags=["items"])


def get_webflow_client():
    """Dependency to get Webflow client (mock for now)."""
    return MockWebflowClient()


@router.get("", response_model=CMSItemResponse)
async def list_items(
    collection_id: str = Query(..., description="Webflow collection ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    client: MockWebflowClient = Depends(get_webflow_client),
):
    """
    List CMS items from a Webflow collection.

    Returns items with current alt text and metadata.
    """
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
            image = field_data.get("image", {})

            item = CMSItem(
                id=raw_item["id"],
                name=field_data.get("name", "Untitled"),
                image_url=image.get("url") if image else None,
                current_alt_text=image.get("alt") if image else None,
                current_caption=field_data.get("caption"),
            )
            items.append(item)

        return CMSItemResponse(
            items=items,
            total=result.get("total", len(items)),
            has_more=(offset + len(items)) < result.get("total", len(items)),
        )

    except Exception as e:
        logger.error(f"Failed to fetch items: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch items from Webflow: {str(e)}",
        )
    finally:
        await client.close()
