from __future__ import annotations

from fastapi import APIRouter, HTTPException

from db import fetch_all, fetch_one
from schemas import Finance
from queries import SQL_FINANCE_ONE, SQL_SHORTAGES, SQL_PLANNED_ONE
from typing import Optional


router = APIRouter(tags=["Finance"])


@router.get("/api/finance/{order_id}", response_model=Optional[Finance], summary="Finance by order")
def finance_one(order_id: str):
    try:
        return fetch_one(SQL_FINANCE_ONE, (order_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/shortages", summary="List component shortages")
def shortages():
    try:
        return fetch_all(SQL_SHORTAGES)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/planned-time/{order_id}", summary="Planned time for order")
def planned_time(order_id: str):
    try:
        row = fetch_one(SQL_PLANNED_ONE, (order_id,))
        if not row:
            raise HTTPException(status_code=404, detail="Order not found in v_planned_time")
        return row
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

