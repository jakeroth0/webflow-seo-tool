import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

# Paths we skip logging for to avoid noise
_SKIP_LOG_PATHS = frozenset(["/health", "/"])


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request with a unique request ID and timing.

    Each request gets a short ``request_id`` (8 hex chars) that is:
    - Stored on ``request.state.request_id`` for downstream use
    - Returned in the ``X-Request-ID`` response header
    - Included in all log records emitted during the request

    Log output (via the structured JSON formatter):
      - INFO  on completion: method, path, status_code, duration_ms
      - ERROR on unhandled exception: method, path, error, duration_ms
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = uuid.uuid4().hex[:8]
        request.state.request_id = request_id

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(
                "Request failed with unhandled exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        if request.url.path not in _SKIP_LOG_PATHS:
            logger.info(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        response.headers["X-Request-ID"] = request_id
        return response
