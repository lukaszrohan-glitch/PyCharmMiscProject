"""
Cursor-based pagination utilities for efficient large dataset handling.
Supports both offset-based and cursor-based pagination.
"""

from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel


class PaginationParams(BaseModel):
    """Pagination parameters."""

    limit: int = 50  # Default page size
    cursor: Optional[str] = None  # Cursor for next page
    offset: Optional[int] = None  # Alternative: offset-based pagination


class PaginatedResponse(BaseModel):
    """Standard paginated response format."""

    data: List[Dict[str, Any]]
    pagination: Dict[str, Any]
    total: Optional[int] = None


def paginate_query(
    base_query: str,
    params: List[Any],
    order_by: str = "id",
    limit: int = 50,
    cursor: Optional[str] = None,
    cursor_field: str = "id",
) -> Tuple[str, List[Any]]:
    """
    Add pagination to SQL query using cursor-based pagination.

    Args:
        base_query: Base SQL query without LIMIT/OFFSET
        params: Query parameters
        order_by: ORDER BY clause
        limit: Page size
        cursor: Cursor value from previous page
        cursor_field: Field to use for cursor

    Returns:
        Tuple of (modified_query, modified_params)

    Example:
        query = "SELECT * FROM orders WHERE customer_id = %s"
        params = ["C123"]
        query, params = paginate_query(query, params, "order_date DESC", 50, cursor)
    """
    # Add cursor condition if provided
    if cursor:
        query = f"{base_query} AND {cursor_field} > %s"
        params = params + [cursor]
    else:
        query = base_query

    # Add ORDER BY and LIMIT
    query = f"{query} ORDER BY {order_by} LIMIT %s"
    params = params + [limit + 1]  # Fetch one extra to check if there's a next page

    return query, params


def build_pagination_response(
    rows: List[Dict], limit: int, cursor_field: str = "id", total: Optional[int] = None
) -> PaginatedResponse:
    """
    Build paginated response from query results.

    Args:
        rows: Query results (limit + 1 rows)
        limit: Page size
        cursor_field: Field to use as cursor
        total: Total count (optional, expensive to compute)

    Returns:
        PaginatedResponse with data and pagination info
    """
    has_more = len(rows) > limit
    data = rows[:limit]  # Remove the extra row

    next_cursor = None
    if has_more and data:
        # Use the last item's cursor field as next cursor
        next_cursor = str(data[-1].get(cursor_field))

    return PaginatedResponse(
        data=data,
        pagination={
            "limit": limit,
            "has_more": has_more,
            "next_cursor": next_cursor,
            "count": len(data),
        },
        total=total,
    )


def offset_paginate_query(
    base_query: str, params: List[Any], limit: int = 50, offset: int = 0
) -> Tuple[str, List[Any]]:
    """
    Simple offset-based pagination (less efficient for large offsets).

    Args:
        base_query: Base SQL query
        params: Query parameters
        limit: Page size
        offset: Number of rows to skip

    Returns:
        Tuple of (modified_query, modified_params)
    """
    query = f"{base_query} LIMIT %s OFFSET %s"
    params = params + [limit, offset]
    return query, params


def get_page_number_from_offset(offset: int, limit: int) -> int:
    """Calculate page number from offset."""
    return (offset // limit) + 1


def get_offset_from_page(page: int, limit: int) -> int:
    """Calculate offset from page number."""
    return (page - 1) * limit
