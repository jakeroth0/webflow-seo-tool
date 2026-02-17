"""Tests for structured JSON logging (M5.4)."""

import json
import logging
import pytest
from fastapi.testclient import TestClient

from app.logging_config import StructuredJSONFormatter, configure_logging
from app.main import app


# ---------------------------------------------------------------------------
# StructuredJSONFormatter tests
# ---------------------------------------------------------------------------


class TestStructuredJSONFormatter:
    """Unit tests for the JSON log formatter."""

    def _make_record(
        self,
        msg: str,
        level: int = logging.INFO,
        extra: dict | None = None,
    ) -> logging.LogRecord:
        record = logging.LogRecord(
            name="test.logger",
            level=level,
            pathname=__file__,
            lineno=42,
            msg=msg,
            args=(),
            exc_info=None,
        )
        if extra:
            for k, v in extra.items():
                setattr(record, k, v)
        return record

    def test_output_is_valid_json(self):
        fmt = StructuredJSONFormatter()
        record = self._make_record("hello")
        output = fmt.format(record)
        parsed = json.loads(output)
        assert isinstance(parsed, dict)

    def test_required_fields_present(self):
        fmt = StructuredJSONFormatter()
        record = self._make_record("test message")
        parsed = json.loads(fmt.format(record))

        assert parsed["level"] == "INFO"
        assert parsed["logger"] == "test.logger"
        assert parsed["message"] == "test message"
        assert "timestamp" in parsed
        assert "module" in parsed
        assert "function" in parsed
        assert "line" in parsed

    def test_extra_fields_included(self):
        fmt = StructuredJSONFormatter()
        record = self._make_record("job done", extra={"job_id": "abc123", "duration_ms": 250})
        parsed = json.loads(fmt.format(record))

        assert parsed["job_id"] == "abc123"
        assert parsed["duration_ms"] == 250

    def test_error_level(self):
        fmt = StructuredJSONFormatter()
        record = self._make_record("something broke", level=logging.ERROR)
        parsed = json.loads(fmt.format(record))
        assert parsed["level"] == "ERROR"

    def test_exception_info_captured(self):
        fmt = StructuredJSONFormatter()
        try:
            raise ValueError("boom")
        except ValueError:
            import sys
            exc_info = sys.exc_info()

        record = logging.LogRecord(
            name="test.logger",
            level=logging.ERROR,
            pathname=__file__,
            lineno=99,
            msg="error occurred",
            args=(),
            exc_info=exc_info,
        )
        parsed = json.loads(fmt.format(record))
        assert "exception" in parsed
        assert "ValueError" in parsed["exception"]

    def test_stdlib_fields_not_duplicated(self):
        """Standard LogRecord attributes should not appear as extra fields."""
        fmt = StructuredJSONFormatter()
        record = self._make_record("msg")
        parsed = json.loads(fmt.format(record))

        # These are stdlib internals — they should not appear as top-level keys
        assert "msg" not in parsed
        assert "args" not in parsed
        assert "levelno" not in parsed
        assert "msecs" not in parsed

    def test_configure_logging_sets_json_formatter(self):
        """configure_logging() should attach StructuredJSONFormatter to root logger."""
        configure_logging("WARNING")
        root = logging.getLogger()
        assert len(root.handlers) == 1
        assert isinstance(root.handlers[0].formatter, StructuredJSONFormatter)
        assert root.level == logging.WARNING


# ---------------------------------------------------------------------------
# RequestLoggingMiddleware tests (via TestClient)
# ---------------------------------------------------------------------------


@pytest.fixture
def api_client():
    return TestClient(app, raise_server_exceptions=False)


class TestRequestLoggingMiddleware:
    """Integration tests for the request logging middleware."""

    def test_x_request_id_header_present(self, api_client):
        response = api_client.get("/health")
        assert "x-request-id" in response.headers

    def test_request_id_is_8_hex_chars(self, api_client):
        response = api_client.get("/health")
        request_id = response.headers["x-request-id"]
        assert len(request_id) == 8
        assert all(c in "0123456789abcdef" for c in request_id)

    def test_each_request_gets_unique_id(self, api_client):
        ids = {api_client.get("/health").headers["x-request-id"] for _ in range(5)}
        assert len(ids) == 5

    def test_health_endpoint_returns_200(self, api_client):
        """Sanity check: /health still works with middleware in place."""
        response = api_client.get("/health")
        assert response.status_code == 200

    def test_request_logging_does_not_break_api(self, api_client):
        """Root endpoint works correctly with middleware."""
        response = api_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data

    def test_404_has_request_id(self, api_client):
        """Even 404 responses should include X-Request-ID."""
        response = api_client.get("/nonexistent-path")
        assert response.status_code == 404
        assert "x-request-id" in response.headers

    def test_post_request_has_request_id(self, api_client):
        """POST requests also get a request ID."""
        response = api_client.post("/api/v1/auth/login", json={"email": "x@x.com", "password": "wrong"})
        assert "x-request-id" in response.headers
