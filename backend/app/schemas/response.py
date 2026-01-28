"""
Standardized Response Schemas

Provides consistent response formats for all API endpoints.
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")


class BaseResponse(BaseModel):
    """Base response model with common fields."""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseResponse):
    """Standard success response."""
    success: bool = True
    data: Optional[Any] = None


class ErrorResponse(BaseResponse):
    """Standard error response."""
    success: bool = False
    error_code: Optional[str] = None
    detail: Optional[str] = None
    errors: Optional[List[Dict[str, Any]]] = None


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False


class PaginatedResponse(BaseResponse, Generic[T]):
    """Paginated list response."""
    data: List[T] = []
    pagination: PaginationMeta

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int = 1,
        page_size: int = 20,
        message: Optional[str] = None,
    ) -> "PaginatedResponse[T]":
        """Create a paginated response with calculated metadata."""
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        
        return cls(
            data=items,
            message=message,
            pagination=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1,
            ),
        )


class ListResponse(BaseResponse, Generic[T]):
    """Simple list response without pagination."""
    data: List[T] = []
    count: int = 0

    @classmethod
    def create(cls, items: List[T], message: Optional[str] = None) -> "ListResponse[T]":
        """Create a list response."""
        return cls(data=items, count=len(items), message=message)


class ItemResponse(BaseResponse, Generic[T]):
    """Single item response."""
    data: Optional[T] = None

    @classmethod
    def create(cls, item: T, message: Optional[str] = None) -> "ItemResponse[T]":
        """Create an item response."""
        return cls(data=item, message=message)


class DeleteResponse(BaseResponse):
    """Response for delete operations."""
    deleted_id: int
    message: str = "Item deleted successfully"


class BulkOperationResponse(BaseResponse):
    """Response for bulk operations."""
    processed: int = 0
    succeeded: int = 0
    failed: int = 0
    errors: Optional[List[Dict[str, Any]]] = None


# Helper functions for creating responses
def success_response(
    data: Any = None,
    message: str = "Success"
) -> Dict[str, Any]:
    """Create a standard success response dict."""
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }


def error_response(
    message: str,
    error_code: Optional[str] = None,
    detail: Optional[str] = None,
    errors: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Create a standard error response dict."""
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "detail": detail,
        "errors": errors,
        "timestamp": datetime.utcnow().isoformat(),
    }


def paginated_response(
    items: List[Any],
    total: int,
    page: int = 1,
    page_size: int = 20,
    message: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a paginated response dict."""
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    
    return {
        "success": True,
        "message": message,
        "data": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
