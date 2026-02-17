import json
import logging
import traceback
from datetime import datetime, timezone

# Fields that are part of the standard LogRecord and should not be
# copied into the JSON output as extra fields.
_STDLIB_FIELDS = frozenset(
    [
        "args",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "message",
        "module",
        "msecs",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "thread",
        "threadName",
        "taskName",
    ]
)


class StructuredJSONFormatter(logging.Formatter):
    """Format log records as single-line JSON objects.

    Standard fields emitted on every record:
      timestamp, level, logger, message, module, function, line

    Any extra fields passed via ``extra={}`` on the log call are merged
    in at the top level, e.g.::

        logger.info("Job complete", extra={"job_id": job_id, "duration_ms": 123})
    """

    def format(self, record: logging.LogRecord) -> str:
        # Ensure exc_text is populated by the parent before we read it
        record.message = record.getMessage()
        if record.exc_info and not record.exc_text:
            record.exc_text = self.formatException(record.exc_info)

        obj: dict = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.message,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Merge in any extra fields the caller provided
        for key, value in record.__dict__.items():
            if key not in _STDLIB_FIELDS and not key.startswith("_"):
                obj[key] = value

        # Append exception details when present
        if record.exc_text:
            obj["exception"] = record.exc_text

        return json.dumps(obj, default=str)


def configure_logging(log_level: str = "INFO") -> None:
    """Configure structured JSON logging for the entire application.

    Call once at startup (in main.py). Replaces any existing handlers on the
    root logger with a single JSON-emitting StreamHandler.
    """
    level = getattr(logging, log_level.upper(), logging.INFO)

    handler = logging.StreamHandler()
    handler.setFormatter(StructuredJSONFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Reduce noise from chatty third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.WARNING)
    logging.getLogger("azure").setLevel(logging.WARNING)
