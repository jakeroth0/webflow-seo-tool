import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models import CMSItem, JobStatus, JobProgress, Proposal, CreateJobRequest


def test_cms_item_valid():
    """Test valid CMS item creation."""
    item = CMSItem(
        id="test123",
        name="Test Item",
        slug="test-item",
        images=[],
    )
    assert item.id == "test123"
    assert item.name == "Test Item"
    assert item.slug == "test-item"


def test_cms_item_missing_required_field():
    """Test that missing required fields raise validation error."""
    with pytest.raises(ValidationError):
        CMSItem(name="Test")  # Missing 'id'


def test_create_job_request_valid():
    """Test valid job creation request."""
    request = CreateJobRequest(
        item_ids=["item1", "item2"],
        collection_id="coll123",
    )
    assert len(request.item_ids) == 2
    assert request.collection_id == "coll123"


def test_create_job_request_empty_items():
    """Test that empty item_ids list raises validation error."""
    with pytest.raises(ValidationError):
        CreateJobRequest(item_ids=[], collection_id="coll123")


def test_job_progress_calculation():
    """Test job progress percentage calculation."""
    progress = JobProgress(processed=15, total=20)
    progress.percentage = (progress.processed / progress.total) * 100
    assert progress.percentage == 75.0


def test_proposal_confidence_score_validation():
    """Test that confidence score must be between 0 and 1."""
    proposal = Proposal(
        proposal_id="p1",
        job_id="j1",
        item_id="i1",
        field_name="1-after-alt-text",
        proposed_alt_text="Test alt text",
        confidence_score=0.85,
        generated_at=datetime.now(),
    )
    assert proposal.confidence_score == 0.85

    with pytest.raises(ValidationError):
        Proposal(
            proposal_id="p2",
            job_id="j2",
            item_id="i2",
            field_name="1-after-alt-text",
            proposed_alt_text="Test",
            confidence_score=1.5,
            generated_at=datetime.now(),
        )
