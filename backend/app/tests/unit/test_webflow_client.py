import pytest
from app.services.webflow_client import MockWebflowClient


@pytest.mark.asyncio
async def test_mock_get_collection_items():
    """Test mock client returns items."""
    client = MockWebflowClient()

    result = await client.get_collection_items("test_collection")

    assert "items" in result
    assert len(result["items"]) == 2
    assert result["items"][0]["id"] == "item_001"
    assert result["total"] == 2


@pytest.mark.asyncio
async def test_mock_update_item():
    """Test mock update succeeds."""
    client = MockWebflowClient()

    result = await client.update_item(
        item_id="item_001",
        alt_text="New alt text",
        caption="New caption",
    )

    assert result["updated"] is True
    assert result["fields"]["alt_text"] == "New alt text"
    assert result["fields"]["caption"] == "New caption"


@pytest.mark.asyncio
async def test_client_close():
    """Test client cleanup."""
    client = MockWebflowClient()
    await client.close()  # Should not raise exception
