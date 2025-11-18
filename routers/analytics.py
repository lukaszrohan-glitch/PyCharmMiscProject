from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends

from db import fetch_all, fetch_one
from schemas import Finance
from queries import SQL_FINANCE_ONE, SQL_SHORTAGES, SQL_PLANNED_ONE
from security import check_api_key

router = APIRouter(tags=["Finance"])


@router.get("/api/finance/{order_id}", response_model=Optional[Finance], summary="Finance by order")
def finance_one(order_id: str, _ok: bool = Depends(check_api_key)):
    """
    Szczegóły finansowe dla pojedynczego zlecenia.
    Dostępne tylko dla uwierzytelnionych użytkowników (JWT / API key).
    """
    try:
        row = fetch_one(SQL_FINANCE_ONE, (order_id,))
        if not row:
            return None
        return row
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/shortages", summary="Material shortages", response_model=List[dict])
def shortages(_ok: bool = Depends(check_api_key)):
    """
    Lista braków materiałowych.
    """
    try:
        return fetch_all(SQL_SHORTAGES, None) or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/planned-time/{order_id}", summary="Planned time for order")
def planned_time(order_id: str, _ok: bool = Depends(check_api_key)):
    """
    Planowany czas dla zlecenia (na podstawie widoku v_planned_time).
    """
    try:
        row = fetch_one(SQL_PLANNED_ONE, (order_id,))
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Order not found in v_planned_time",
            )
        return row
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
