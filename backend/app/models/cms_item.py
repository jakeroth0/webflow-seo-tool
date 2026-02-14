from pydantic import BaseModel, Field
from typing import Optional


class CMSItem(BaseModel):
    """Represents a Webflow CMS item."""

    id: str = Field(..., description="Webflow item ID")
    name: str = Field(..., description="Item name/title")
    image_url: Optional[str] = Field(None, description="Image URL")
    current_alt_text: Optional[str] = Field(None, description="Existing alt text")
    current_caption: Optional[str] = Field(None, description="Existing caption")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "abc123",
                "name": "Product Image 1",
                "image_url": "https://example.com/image.jpg",
                "current_alt_text": "Old alt text",
                "current_caption": None,
            }
        }
    }


class CMSItemResponse(BaseModel):
    """Response containing list of CMS items."""

    items: list[CMSItem]
    total: int
    has_more: bool
