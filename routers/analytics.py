from __future__ import annotations

from typing import Optional, List
import uuid
from decimal import Decimal
from collections import defaultdict
from datetime import date, datetime, timedelta
import sqlite3

from fastapi import APIRouter, HTTPException, Depends, Query, Header, Response, status

from db import fetch_all, fetch_one, execute
from schemas import (
    Finance,
    RevenueByMonth,
    TopCustomer,
    TopOrder,
    AnalyticsSummary,
    DemandScenario,
    DemandScenarioCreate,
    DemandScenarioUpdate,
    DemandForecastRequest,
    DemandForecastResult,
)
from queries import (
    SQL_FINANCE_ONE,
    SQL_SHORTAGES,
    SQL_PLANNED_ONE,
    SQL_REVENUE_BY_MONTH,
    SQL_TOP_CUSTOMERS,
    SQL_TOP_ORDERS,
    SQL_ANALYTICS_SUMMARY,
    SQL_CREATE_DEMAND_SCENARIOS,
)
from security import check_api_key, require_auth
from logging_utils import logger as app_logger

SQLITE_ERRORS = (sqlite3.OperationalError,) if sqlite3 else ()

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


def _raise(code: str, detail: str, status_code: int = 400):
    raise HTTPException(status_code=status_code, detail={"detail": detail, "code": code})


def _init_scenarios_table():
    try:
        execute(SQL_CREATE_DEMAND_SCENARIOS)
    except Exception as exc:
        app_logger.error("demand scenario table init failed", exc_info=True)
        _raise("demand_scenario_init_failed", "Failed to init demand_scenarios table", 500)


def _as_decimal(value, default=0):
    try:
        return Decimal(str(value or default))
    except Exception:
        return Decimal(default)


def _is_sqlite_error(exc: Exception) -> bool:
    return isinstance(exc, SQLITE_ERRORS) or "syntax error" in str(exc).lower()


def _parse_date(value: Optional[str], default: date) -> date:
    if not value:
        return default
    try:
        return datetime.fromisoformat(value).date()
    except (ValueError, TypeError):
        return default


def _sqlite_summary_fallback(date_from: Optional[str], date_to: Optional[str]):
    today = date.today()
    to_date = _parse_date(date_to, today)
    from_date = _parse_date(date_from, to_date - timedelta(days=90))
    period_delta = to_date - from_date if to_date >= from_date else timedelta(days=90)
    prev_to = from_date - timedelta(days=1)
    prev_from = prev_to - period_delta

    rows = fetch_all(
        """
        SELECT f.order_id, f.customer_id, c.name AS customer_name, f.order_date, f.revenue, f.gross_margin
        FROM v_order_finance f
        LEFT JOIN customers c ON c.customer_id = f.customer_id
        """,
        (),
    ) or []

    def _within(window_from: date, window_to: date, row_date: date) -> bool:
        return window_from <= row_date <= window_to

    current_rev = current_margin = 0.0
    prev_rev = 0.0
    customer_stats = defaultdict(lambda: {"revenue": 0.0, "margin": 0.0, "orders_count": 0, "name": None})

    for row in rows:
        try:
            order_date = datetime.fromisoformat(str(row.get("order_date"))).date()
        except (TypeError, ValueError):
            continue
        revenue = float(row.get("revenue") or 0)
        margin = float(row.get("gross_margin") or 0)
        if _within(from_date, to_date, order_date):
            current_rev += revenue
            current_margin += margin
            cid = row.get("customer_id")
            stats = customer_stats[cid]
            stats["revenue"] += revenue
            stats["margin"] += margin
            stats["orders_count"] += 1
            stats["name"] = row.get("customer_name")
        elif _within(prev_from, prev_to, order_date):
            prev_rev += revenue

    margin_pct = (current_margin / current_rev) if current_rev else None
    yoy_change = ((current_rev - prev_rev) / prev_rev) if prev_rev else None

    top_customer = None
    if customer_stats:
        top_id = max(customer_stats, key=lambda cid: customer_stats[cid]["revenue"])
        stats = customer_stats[top_id]
        top_customer = {
            "customer_id": top_id,
            "name": stats["name"],
            "revenue": stats["revenue"],
            "margin": stats["margin"],
            "orders_count": stats["orders_count"],
        }

    return {
        "total_revenue": current_rev,
        "total_margin": current_margin,
        "margin_pct": margin_pct,
        "revenue_yoy_change_pct": yoy_change,
        "top_customer": top_customer,
    }


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
    _ok: bool = Depends(_readonly_ok),
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
        app_logger.error(f"Analytics summary SQL error: {exc}", exc_info=True)
        if _is_sqlite_error(exc):
            app_logger.warning("analytics summary falling back to python aggregation", exc_info=True)
            return _sqlite_summary_fallback(date_from, date_to)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/analytics/demand/scenarios", response_model=List[DemandScenario])
def list_demand_scenarios(_user=Depends(require_auth)):
    _init_scenarios_table()
    rows = fetch_all("SELECT * FROM demand_scenarios ORDER BY created_at DESC", None) or []
    return rows


@router.post("/api/analytics/demand/scenarios", response_model=DemandScenario, status_code=status.HTTP_201_CREATED)
def create_demand_scenario(payload: DemandScenarioCreate, user=Depends(require_auth)):
    _init_scenarios_table()
    scenario_id = payload.scenario_id or str(uuid.uuid4())
    try:
        execute(
            """
            INSERT INTO demand_scenarios (scenario_id, name, multiplier, backlog_weeks, created_by)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (scenario_id, payload.name, float(payload.multiplier), float(payload.backlog_weeks), user.user_id),
        )
        row = fetch_one("SELECT * FROM demand_scenarios WHERE scenario_id = %s", (scenario_id,))
        return row
    except Exception as exc:
        app_logger.error("create_demand_scenario failed", exc_info=True)
        _raise("demand_scenario_create_failed", str(exc), 500)


@router.put("/api/analytics/demand/scenarios/{scenario_id}", response_model=DemandScenario)
def update_demand_scenario(scenario_id: str, payload: DemandScenarioUpdate, _user=Depends(require_auth)):
    _init_scenarios_table()
    existing = fetch_one("SELECT * FROM demand_scenarios WHERE scenario_id = %s", (scenario_id,))
    if not existing:
        _raise("demand_scenario_not_found", "Scenario not found", 404)
    try:
        updates = []
        params = []
        for field in ("name", "multiplier", "backlog_weeks"):
            value = getattr(payload, field)
            if value is not None:
                updates.append(f"{field} = %s")
                params.append(float(value))
        if updates:
            params.append(scenario_id)
            execute(f"UPDATE demand_scenarios SET {', '.join(updates)} WHERE scenario_id = %s", tuple(params))
        row = fetch_one("SELECT * FROM demand_scenarios WHERE scenario_id = %s", (scenario_id,))
        return row
    except Exception as exc:
        app_logger.error("update_demand_scenario failed", exc_info=True)
        _raise("demand_scenario_update_failed", str(exc), 500)


@router.delete("/api/analytics/demand/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_demand_scenario(scenario_id: str, _user=Depends(require_auth)):
    _init_scenarios_table()
    existing = fetch_one("SELECT * FROM demand_scenarios WHERE scenario_id = %s", (scenario_id,))
    if not existing:
        _raise("demand_scenario_not_found", "Scenario not found", 404)
    try:
        execute("DELETE FROM demand_scenarios WHERE scenario_id = %s", (scenario_id,))
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as exc:
        app_logger.error("delete_demand_scenario failed", exc_info=True)
        _raise("demand_scenario_delete_failed", str(exc), 500)


@router.post("/api/analytics/demand", response_model=DemandForecastResult)
def run_demand_forecast(payload: DemandForecastRequest, _user=Depends(require_auth)):
    _init_scenarios_table()
    scenario = None
    if payload.scenario_id:
        scenario = fetch_one("SELECT * FROM demand_scenarios WHERE scenario_id = %s", (payload.scenario_id,))
        if not scenario:
            _raise("demand_scenario_not_found", "Scenario not found", 404)
    try:
        multiplier = payload.multiplier or (scenario.get("multiplier") if scenario else Decimal("1.0"))
        backlog = payload.backlog_weeks or (scenario.get("backlog_weeks") if scenario else Decimal("4"))
        if scenario is None:
            scenario = {
                "scenario_id": payload.scenario_id or "ad-hoc",
                "name": "Ad-hoc",
                "multiplier": float(multiplier),
                "backlog_weeks": float(backlog),
                "created_by": None,
                "created_at": None,
            }
        base_revenue = _as_decimal(fetch_one("SELECT COALESCE(SUM(revenue),0) AS rev FROM v_order_finance", ()).get("rev"))
        revenue = float(base_revenue * Decimal(multiplier))
        capacity_usage = min(100.0, float(Decimal(multiplier) * Decimal("65")))
        metrics = [round(revenue / max(float(backlog), 1.0), 2), float(backlog) * 40, float(backlog) * 35]
        return DemandForecastResult(
            scenario=DemandScenario(**scenario),
            revenue=revenue,
            capacity_usage=capacity_usage,
            metrics=metrics,
        )
    except HTTPException:
        raise
    except Exception as exc:
        app_logger.error("run_demand_forecast failed", exc_info=True)
        _raise("demand_forecast_failed", str(exc), 500)
