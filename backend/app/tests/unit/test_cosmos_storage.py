"""Tests for CosmosStorage dict-like interface with mocked Cosmos client."""
import pytest
from unittest.mock import MagicMock
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from app.cosmos_storage import CosmosStorage


@pytest.fixture
def cosmos_storage():
    """Create CosmosStorage with fully mocked Cosmos client."""
    mock_client = MagicMock()
    mock_container = MagicMock()
    mock_client.get_database_client.return_value.get_container_client.return_value = (
        mock_container
    )
    storage = CosmosStorage(
        client=mock_client,
        database_name="test-db",
        container_name="test-container",
    )
    return storage, mock_container


def test_get_existing_key(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.read_item.return_value = {
        "id": "job1",
        "job_id": "job1",
        "data": {"status": "queued"},
    }
    result = storage.get("job1")
    assert result == {"status": "queued"}
    mock_container.read_item.assert_called_once_with(
        item="job1", partition_key="job1"
    )


def test_get_missing_key(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.read_item.side_effect = CosmosResourceNotFoundError()
    result = storage.get("missing")
    assert result is None


def test_set_calls_upsert(cosmos_storage):
    storage, mock_container = cosmos_storage
    storage.set("job1", {"status": "processing"})
    mock_container.upsert_item.assert_called_once()
    doc = mock_container.upsert_item.call_args[0][0]
    assert doc["id"] == "job1"
    assert doc["job_id"] == "job1"
    assert doc["data"] == {"status": "processing"}


def test_contains_true(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.read_item.return_value = {"id": "job1", "data": {}}
    assert "job1" in storage


def test_contains_false(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.read_item.side_effect = CosmosResourceNotFoundError()
    assert "missing" not in storage


def test_getitem_returns_data(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.read_item.return_value = {
        "id": "job1",
        "job_id": "job1",
        "data": {"status": "completed"},
    }
    assert storage["job1"] == {"status": "completed"}


def test_getitem_raises_keyerror(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.read_item.side_effect = CosmosResourceNotFoundError()
    with pytest.raises(KeyError):
        _ = storage["missing"]


def test_setitem_delegates_to_set(cosmos_storage):
    storage, mock_container = cosmos_storage
    storage["job1"] = {"status": "completed"}
    mock_container.upsert_item.assert_called_once()


def test_delete_existing(cosmos_storage):
    storage, mock_container = cosmos_storage
    storage.delete("job1")
    mock_container.delete_item.assert_called_once_with(
        item="job1", partition_key="job1"
    )


def test_delete_missing_no_error(cosmos_storage):
    storage, mock_container = cosmos_storage
    mock_container.delete_item.side_effect = CosmosResourceNotFoundError()
    storage.delete("missing")  # Should not raise
