import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Dict, Any, Optional
from datetime import datetime

LOG_NAME = "smb_tool"

def setup_logging() -> logging.Logger:
    """Configure application logging in a consistent way.

    - Writes to logs/app.log with rotation (5MB x 3)
    - Console logs at WARNING+
    - Avoids duplicate handlers and unifies uvicorn/fastapi loggers
    """
    os.makedirs("logs", exist_ok=True)

    # Shared handlers
    file_handler = RotatingFileHandler("logs/app.log", maxBytes=5_000_000, backupCount=3)
    file_handler.setLevel(logging.INFO)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)
    fmt = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    file_handler.setFormatter(fmt)
    console_handler.setFormatter(fmt)

    # App logger
    logger = logging.getLogger(LOG_NAME)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    # Root logger to capture other module logs
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    if not root.handlers:
        root.addHandler(file_handler)
        root.addHandler(console_handler)

    # Align uvicorn/fastapi with our handlers to avoid duplicates
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        uv = logging.getLogger(name)
        uv.handlers = []
        uv.propagate = True
        uv.setLevel(logging.INFO)

    return logger

logger = logging.getLogger(LOG_NAME)

def log_error(error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """Log an error with optional context and traceback."""
    logger.error(
        "Application error",
        extra={
            "error_type": type(error).__name__,
            "error_msg": str(error),
            "timestamp": datetime.utcnow().isoformat(),
            "context": context or {},
        },
        exc_info=True,
    )

def log_api_request(method: str, path: str, user_id: Optional[str] = None) -> None:
    """Log an API request."""
    logger.info(f"API Request - Method: {method}, Path: {path}, User: {user_id or 'anonymous'}")

def log_auth_event(event_type: str, user_id: str, success: bool, details: Optional[Dict] = None) -> None:
    """Log authentication events."""
    logger.info(
        f"Auth Event - Type: {event_type}, User: {user_id}, Success: {success}, Details: {details or {}}"
    )
