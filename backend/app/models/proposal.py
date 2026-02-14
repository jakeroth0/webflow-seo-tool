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
