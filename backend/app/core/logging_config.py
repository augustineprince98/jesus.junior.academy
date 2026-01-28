"""
Logging Configuration

Structured logging setup for development and production environments.
Provides JSON logging for production and colored console logging for development.
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar
import uuid

# Context variable for request tracking
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_var.get()


def set_request_id(request_id: Optional[str] = None) -> str:
    """Set or generate a request ID for the current context."""
    if request_id is None:
        request_id = str(uuid.uuid4())[:8]
    request_id_var.set(request_id)
    return request_id


class JSONFormatter(logging.Formatter):
    """
    JSON log formatter for production.
    
    Produces structured JSON logs that are easy to parse
    by log aggregation systems like ELK, CloudWatch, etc.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add request ID if available
        request_id = get_request_id()
        if request_id:
            log_data["request_id"] = request_id
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        
        # Add standard extra fields
        for key in ["user_id", "endpoint", "method", "status_code", "duration_ms"]:
            if hasattr(record, key):
                log_data[key] = getattr(record, key)
        
        return json.dumps(log_data, default=str)


class ColoredFormatter(logging.Formatter):
    """
    Colored console formatter for development.
    
    Makes logs easier to read during local development.
    """
    
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        # Get color for level
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Format timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Get request ID if available
        request_id = get_request_id()
        req_id_part = f"[{request_id}] " if request_id else ""
        
        # Build the log line
        level = f"{color}{record.levelname:8}{self.RESET}"
        name = f"\033[90m{record.name:20}\033[0m"
        message = record.getMessage()
        
        formatted = f"{timestamp} {level} {name} {req_id_part}{message}"
        
        # Add exception info if present
        if record.exc_info:
            formatted += "\n" + self.formatException(record.exc_info)
        
        return formatted


def setup_logging(
    level: str = "INFO",
    json_format: bool = False,
    log_file: Optional[str] = None,
) -> None:
    """
    Configure application logging.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Use JSON formatting (for production)
        log_file: Optional file path for file logging
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Choose formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = ColoredFormatter()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(JSONFormatter())  # Always JSON for files
        root_logger.addHandler(file_handler)
    
    # Reduce noise from third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom logger adapter that includes request context.
    """
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        extra = kwargs.get("extra", {})
        
        # Add request ID
        request_id = get_request_id()
        if request_id:
            extra["request_id"] = request_id
        
        kwargs["extra"] = extra
        return msg, kwargs


def get_logger(name: str) -> LoggerAdapter:
    """
    Get a logger with request context support.
    
    Usage:
        logger = get_logger(__name__)
        logger.info("Processing request", extra={"user_id": 123})
    """
    return LoggerAdapter(logging.getLogger(name), {})


# Performance logging helpers
class PerformanceLogger:
    """
    Context manager for logging operation duration.
    
    Usage:
        with PerformanceLogger("database_query", logger) as perf:
            result = db.query(...)
            perf.add_context(rows=len(result))
    """
    
    def __init__(
        self,
        operation: str,
        logger: Optional[logging.Logger] = None,
        warn_threshold_ms: int = 1000,
    ):
        self.operation = operation
        self.logger = logger or logging.getLogger(__name__)
        self.warn_threshold_ms = warn_threshold_ms
        self.start_time: Optional[float] = None
        self.context: Dict[str, Any] = {}
    
    def add_context(self, **kwargs) -> None:
        """Add context data to the performance log."""
        self.context.update(kwargs)
    
    def __enter__(self) -> "PerformanceLogger":
        import time
        self.start_time = time.perf_counter()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        import time
        
        if self.start_time is None:
            return
        
        duration_ms = (time.perf_counter() - self.start_time) * 1000
        
        log_data = {
            "operation": self.operation,
            "duration_ms": round(duration_ms, 2),
            **self.context,
        }
        
        if exc_type:
            log_data["error"] = str(exc_val)
            self.logger.error(f"Operation failed: {self.operation}", extra=log_data)
        elif duration_ms > self.warn_threshold_ms:
            self.logger.warning(f"Slow operation: {self.operation} ({duration_ms:.0f}ms)", extra=log_data)
        else:
            self.logger.debug(f"Operation completed: {self.operation} ({duration_ms:.0f}ms)", extra=log_data)
