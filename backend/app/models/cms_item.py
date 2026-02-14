from pydantic import BaseModel, Field
from typing import Optional


class ImageWithAltText(BaseModel):
    """Represents a single image with its alt text."""

    field_name: str = Field(..., description="Field name (e.g., '1-after')")
    image_url: Optional[str] = Field(None, description="Image URL")
    current_alt_text: Optional[str] = Field(
        None, description="Current alt text from CMS"
    )
    file_id: Optional[str] = Field(None, description="Webflow file ID")


class CMSItem(BaseModel):
    """Represents a Webflow CMS item with multiple images."""

    id: str = Field(..., description="Webflow item ID")
    name: str = Field(..., description="Item name/title")
    slug: str = Field(..., description="URL slug")
    images: list[ImageWithAltText] = Field(
        default_factory=list, description="All images with their alt text"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "abc123",
                "name": "Entertainer's Dwelling",
                "slug": "entertainers-dwelling",
                "images": [
                    {
                        "field_name": "1-after",
                        "image_url": "https://example.com/image1.jpg",
                        "current_alt_text": "Kitchen remodel with modern cabinets",
                        "file_id": "file123",
                    }
                ],
            }
        }
    }


class CMSItemResponse(BaseModel):
    """Response containing list of CMS items."""

    items: list[CMSItem]
    total: int
    has_more: bool
