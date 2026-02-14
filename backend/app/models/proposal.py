from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Proposal(BaseModel):
    """AI-generated alt text proposal."""

    proposal_id: str
    job_id: str
    item_id: str
    field_name: str = Field(..., description="Image field name (e.g., '1-after')")
    proposed_alt_text: str = Field(..., max_length=150)
    proposed_caption: Optional[str] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    model_used: str = "gpt-4o-mini"
    generated_at: datetime


class ProposalResponse(BaseModel):
    """Response containing proposals for a job."""

    job_id: str
    proposals: list[Proposal]
    total: int


class ApplyProposalRequest(BaseModel):
    """Request to apply specific proposals to Webflow CMS."""

    updates: list[dict] = Field(
        ...,
        description="List of updates with item_id, field_name, and alt_text",
        min_length=1,
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "updates": [
                    {
                        "item_id": "abc123",
                        "field_name": "1-after-alt-text",
                        "alt_text": "Modern kitchen remodel with custom cabinetry",
                    },
                    {
                        "item_id": "abc123",
                        "field_name": "2-after-alt-text",
                        "alt_text": "Elegant bathroom renovation with marble countertops",
                    },
                ]
            }
        }
    }


class ApplyProposalResponse(BaseModel):
    """Response after applying proposals."""

    success_count: int
    failure_count: int
    results: list[dict] = Field(
        default_factory=list,
        description="Detailed results for each update attempt",
    )
