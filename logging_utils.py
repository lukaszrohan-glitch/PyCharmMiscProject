import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('smb_tool')

def log_error(error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """Log an error with optional context"""
    error_details = {
        'error_type': type(error).__name__,
        'error_msg': str(error),
        'timestamp': datetime.utcnow().isoformat(),
        'context': context or {}
    }
    logger.error(f'Application error: {error_details}')

def log_api_request(method: str, path: str, user_id: Optional[str] = None) -> None:
    """Log an API request"""
    logger.info(f'API Request - Method: {method}, Path: {path}, User: {user_id or "anonymous"}')

def log_auth_event(event_type: str, user_id: str, success: bool, details: Optional[Dict] = None) -> None:
    """Log authentication events"""
    logger.info(
        f'Auth Event - Type: {event_type}, User: {user_id}, Success: {success}, Details: {details or {}}'
    )

def setup_logging():
    """Configure application logging"""
    log_dir = 'logs'
    os.makedirs(log_dir, exist_ok=True)

    file_handler = logging.FileHandler(os.path.join(log_dir, 'app.log'))
    file_handler.setLevel(logging.INFO)

    # Create console handler with a higher log level
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.WARNING)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger
