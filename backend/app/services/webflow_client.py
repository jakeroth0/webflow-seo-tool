import httpx
import logging
from typing import Optional
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    """Raised when API rate limit is hit."""

    pass


class WebflowClient:
    """Client for Webflow CMS API with retry logic."""

    def __init__(
        self, api_token: str, base_url: str = "https://api.webflow.com/v2"
    ):
        self.api_token = api_token
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={
                "Authorization": f"Bearer {api_token}",
                "accept": "application/json",
            },
            timeout=30.0,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        retry=retry_if_exception_type(RateLimitError),
        reraise=True,
    )
    async def get_collection_items(
        self,
        collection_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        """
        Fetch items from a Webflow collection.

        Retries automatically on rate limit (429) with exponential backoff.
        """
        try:
            response = await self.client.get(
                f"/collections/{collection_id}/items",
                params={"limit": limit, "offset": offset},
            )

            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(f"Rate limit hit. Retrying after {retry_after}s")
                raise RateLimitError("Webflow rate limit exceeded")

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error: {e.response.status_code}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error: {str(e)}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=60),
        retry=retry_if_exception_type(RateLimitError),
        reraise=True,
    )
    async def update_item(
        self,
        collection_id: str,
        item_id: str,
        field_data: dict,
    ) -> dict:
        """
        Update CMS item fields (e.g., alt text fields).

        Args:
            collection_id: Webflow collection ID
            item_id: Item ID to update
            field_data: Dict of field names to values (e.g., {"1-after-alt-text": "New text"})

        This is idempotent - safe to retry.
        """
        try:
            response = await self.client.patch(
                f"/collections/{collection_id}/items/{item_id}",
                json={"fieldData": field_data},
            )

            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(f"Rate limit hit updating item. Retrying after {retry_after}s")
                raise RateLimitError("Webflow rate limit exceeded")

            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to update item {item_id}: {e.response.status_code}")
            raise
        except httpx.RequestError as e:
            logger.error(f"Request error updating item: {str(e)}")
            raise

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


class MockWebflowClient(WebflowClient):
    """Mock client that returns fake data for testing."""

    def __init__(self):
        self.api_token = "mock_token"

    async def get_collection_items(
        self, collection_id: str, limit: int = 100, offset: int = 0
    ) -> dict:
        """Return mock CMS items."""
        return {
            "items": [
                {
                    "id": "item_001",
                    "fieldData": {
                        "name": "Test Product 1",
                        "slug": "test-product-1",
                        "image": {
                            "url": "https://example.com/image1.jpg",
                            "alt": "Old alt text",
                        },
                    },
                },
                {
                    "id": "item_002",
                    "fieldData": {
                        "name": "Test Product 2",
                        "slug": "test-product-2",
                        "image": {
                            "url": "https://example.com/image2.jpg",
                            "alt": None,
                        },
                    },
                },
            ],
            "count": 2,
            "limit": limit,
            "offset": offset,
            "total": 2,
        }

    async def update_item(
        self,
        collection_id: str,
        item_id: str,
        field_data: dict,
    ) -> dict:
        """Mock update - always succeeds."""
        logger.info(f"Mock update item {item_id} in collection {collection_id}: {field_data}")
        return {
            "id": item_id,
            "fieldData": field_data,
        }

    async def close(self):
        """Mock close - does nothing."""
        pass
