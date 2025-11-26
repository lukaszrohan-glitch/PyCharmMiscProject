from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query, Header

from db import fetch_all, fetch_one
from schemas import Finance, RevenueByMonth, TopCustomer, TopOrder, AnalyticsSummary
from queries import (
    SQL_FINANCE_ONE,
    SQL_SHORTAGES,
    SQL_PLANNED_ONE,
    SQL_REVENUE_BY_MONTH,
    SQL_TOP_CUSTOMERS,
    SQL_TOP_ORDERS,
    SQL_ANALYTICS_SUMMARY,
)
from security import check_api_key

router = APIRouter(tags=["Finance", "Analytics"])


def _readonly_ok(
    authorization=Header(None), x_api_key=Header(None), api_key: Optional[str] = None
):
    return check_api_key(
        authorization=authorization,
        x_api_key=x_api_key,
        api_key=api_key,
        allow_readonly=True,
    )


@router.get(
    "/api/finance/{order_id}",
    response_model=Optional[Finance],
    summary="Finance by order",
)
def finance_one(order_id: str, _ok: bool = Depends(_readonly_ok)):
    """Szczegóły finansowe dla zlecenia (read-only)."""
    try:
        row = fetch_one(SQL_FINANCE_ONE, (order_id,))
        if not row:
            return None
        return row
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/shortages", summary="Material shortages", response_model=List[dict])
def shortages(_ok: bool = Depends(_readonly_ok)):
    """Lista braków materiałowych bez wymogu logowania."""
    try:
        return fetch_all(SQL_SHORTAGES, None) or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/planned-time/{order_id}", summary="Planned time for order")
def planned_time(order_id: str, _ok: bool = Depends(_readonly_ok)):
    """Planowany czas dla zlecenia (read-only)."""
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


@router.get("/api/analytics/revenue-by-month", response_model=List[RevenueByMonth])
def revenue_by_month(_ok: bool = Depends(check_api_key)):
    try:
        rows = fetch_all(SQL_REVENUE_BY_MONTH, None) or []
        for r in rows:
            rev = r.get("revenue") or 0
            mar = r.get("margin") or 0
            r["margin_pct"] = (mar / rev) if rev else None
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/analytics/top-customers", response_model=List[TopCustomer])
def top_customers(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    try:
        rows = (
            fetch_all(
                SQL_TOP_CUSTOMERS, (date_from, date_from, date_to, date_to, limit)
            )
            or []
        )
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/analytics/top-orders", response_model=List[TopOrder])
def top_orders(
    limit: int = Query(10, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    try:
        rows = (
            fetch_all(SQL_TOP_ORDERS, (date_from, date_from, date_to, date_to, limit))
            or []
        )
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    try:
        row = fetch_one(SQL_ANALYTICS_SUMMARY, (date_from, date_to)) or {}
        summary = {
            "total_revenue": row.get("total_revenue") or 0,
            "total_margin": row.get("total_margin") or 0,
            "margin_pct": row.get("margin_pct"),
            "revenue_yoy_change_pct": row.get("revenue_yoy_change_pct"),
        }
        if row.get("customer_id"):
            summary["top_customer"] = {
                "customer_id": row["customer_id"],
                "name": row.get("name"),
                "revenue": row.get("tc_revenue") or 0,
                "margin": row.get("tc_margin") or 0,
                "orders_count": row.get("tc_orders_count") or 0,
            }
        return summary
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
