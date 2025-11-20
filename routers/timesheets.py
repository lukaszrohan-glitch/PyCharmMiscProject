from __future__ import annotations

from typing import List, Optional

import csv
import io

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse

from db import fetch_all, fetch_one, execute, _get_pool
from queries import SQL_INSERT_TIMESHEET
from schemas import Timesheet, TimesheetCreate, TimesheetUpdate
from security import check_api_key
from user_mgmt import require_admin


router = APIRouter(tags=["Timesheets"])


# -------------------------------------------------------------------
# LIST / GET
# -------------------------------------------------------------------


@router.get("/api/timesheets", response_model=List[Timesheet], summary="List timesheets")
def timesheets_list(
    limit: Optional[int] = Query(None, ge=1, le=5000),
    offset: Optional[int] = Query(None, ge=0),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    emp_id: Optional[str] = Query(None),
    approved: Optional[bool] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    """
    Lista wpisów timesheet z możliwością filtrowania.
    Wspiera zarówno SQLite (approved = 0/1), jak i Postgres (BOOLEAN).
    """
    try:
        pool = _get_pool()
        params: List = []

        if pool is None:
            # SQLite – approved przechowywane jako 0/1
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "COALESCE(approved, 0) AS approved, approved_by, approved_at "
                "FROM timesheets WHERE 1=1"
            )
            if from_date:
                sql += " AND ts_date >= %s"
                params.append(from_date)
            if to_date:
                sql += " AND ts_date <= %s"
                params.append(to_date)
            if emp_id:
                sql += " AND emp_id = %s"
                params.append(emp_id)
            if approved is not None:
                sql += " AND COALESCE(approved, 0) = %s"
                params.append(1 if approved else 0)
        else:
            # Postgres – approved jako BOOLEAN
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "approved, approved_by, approved_at "
                "FROM timesheets WHERE 1=1"
            )
            if from_date:
                sql += " AND ts_date >= %s"
                params.append(from_date)
            if to_date:
                sql += " AND ts_date <= %s"
                params.append(to_date)
            if emp_id:
                sql += " AND emp_id = %s"
                params.append(emp_id)
            if approved is not None:
                sql += " AND approved = %s"
                params.append(approved)

        sql += " ORDER BY ts_date DESC"
        if limit is not None:
            sql += " LIMIT %s"
            params.append(limit)
        if offset is not None:
            sql += " OFFSET %s"
            params.append(offset)

        return fetch_all(sql, tuple(params) if params else None) or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/api/timesheets/{ts_id}",
    response_model=Optional[Timesheet],
    summary="Get timesheet by ID",
)
def timesheet_get(ts_id: int, _ok: bool = Depends(check_api_key)):
    """
    Pojedynczy wpis timesheet po ID.
    """
    try:
        pool = _get_pool()
        if pool is None:
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "COALESCE(approved, 0) AS approved, approved_by, approved_at "
                "FROM timesheets WHERE ts_id = %s"
            )
        else:
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "approved, approved_by, approved_at "
                "FROM timesheets WHERE ts_id = %s"
            )
        return fetch_one(sql, (ts_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# -------------------------------------------------------------------
# CREATE / UPDATE / DELETE
# -------------------------------------------------------------------


@router.post("/api/timesheets", status_code=201, summary="Create timesheet entry")
def create_timesheet(payload: TimesheetCreate, _ok: bool = Depends(check_api_key)):
    """
    Tworzy wpis timesheet.
    """
    try:
        rows = execute(
            SQL_INSERT_TIMESHEET,
            (
                payload.emp_id,
                payload.ts_date,
                payload.order_id,
                payload.operation_no,
                payload.hours,
                payload.notes,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Failed to create timesheet")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put(
    "/api/timesheets/{ts_id}",
    response_model=Timesheet,
    summary="Update timesheet",
)
def update_timesheet(
    ts_id: int,
    payload: TimesheetUpdate,
    _ok: bool = Depends(check_api_key),
):
    """
    Aktualizacja wpisu timesheet – tylko pola, które są w payloadzie.
    """
    try:
        updates = []
        params = []

        if payload.emp_id is not None:
            updates.append("emp_id = %s")
            params.append(payload.emp_id)
        if payload.ts_date is not None:
            updates.append("ts_date = %s")
            params.append(payload.ts_date)
        if payload.order_id is not None:
            updates.append("order_id = %s")
            params.append(payload.order_id)
        if payload.operation_no is not None:
            updates.append("operation_no = %s")
            params.append(payload.operation_no)
        if payload.hours is not None:
            updates.append("hours = %s")
            params.append(payload.hours)
        if payload.notes is not None:
            updates.append("notes = %s")
            params.append(payload.notes)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(ts_id)

        pool = _get_pool()
        if pool is None:
            select_clause = (
                "ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "COALESCE(approved, 0) AS approved, approved_by, approved_at"
            )
        else:
            select_clause = (
                "ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "approved, approved_by, approved_at"
            )

        sql = (
            f"UPDATE timesheets SET {', '.join(updates)} "
            "WHERE ts_id = %s "
            f"RETURNING {select_clause}"
        )
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/timesheets/{ts_id}", summary="Delete timesheet")
def delete_timesheet(ts_id: int, _ok: bool = Depends(check_api_key)):
    """
    Usuwa wpis timesheet.
    """
    try:
        execute("DELETE FROM timesheets WHERE ts_id = %s", (ts_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# -------------------------------------------------------------------
# PENDING / SUMMARY
# -------------------------------------------------------------------


@router.get(
    "/api/timesheets/pending",
    summary="List unapproved timesheets (admin)",
)
def list_pending_timesheets(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    emp_id: Optional[str] = Query(None),
    _admin=Depends(require_admin),
):
    """
    Lista niezatwierdzonych wpisów – tylko dla admina (require_admin).
    """
    try:
        pool = _get_pool()
        params: list = []

        if pool is None:
            # SQLite – 0 = not approved
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "COALESCE(approved, 0) AS approved, approved_by, approved_at "
                "FROM timesheets WHERE COALESCE(approved, 0) = 0"
            )
        else:
            # Postgres – NULL lub FALSE
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "approved, approved_by, approved_at "
                "FROM timesheets WHERE approved IS DISTINCT FROM TRUE"
            )

        if from_date:
            sql += " AND ts_date >= %s"
            params.append(from_date)
        if to_date:
            sql += " AND ts_date <= %s"
            params.append(to_date)
        if emp_id:
            sql += " AND emp_id = %s"
            params.append(emp_id)

        sql += " ORDER BY ts_date, emp_id, ts_id"
        return fetch_all(sql, tuple(params) if params else None) or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/timesheets/summary", summary="Timesheet hours summary by date")
def timesheets_summary(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    emp_id: Optional[str] = Query(None),
    approved: Optional[bool] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    """
    Dzienna suma godzin (SUM(hours) GROUP BY ts_date).
    """
    try:
        pool = _get_pool()
        params: List = []

        sql = "SELECT ts_date AS date, SUM(hours) AS total_hours FROM timesheets WHERE 1=1"

        if from_date:
            sql += " AND ts_date >= %s"
            params.append(from_date)
        if to_date:
            sql += " AND ts_date <= %s"
            params.append(to_date)
        if emp_id:
            sql += " AND emp_id = %s"
            params.append(emp_id)

        if approved is not None:
            if pool is None:
                sql += " AND COALESCE(approved, 0) = %s"
                params.append(1 if approved else 0)
            else:
                sql += " AND approved = %s"
                params.append(approved)

        sql += " GROUP BY ts_date ORDER BY ts_date"
        rows = fetch_all(sql, tuple(params) if params else None)
        return rows or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/timesheets/weekly-summary", summary="Timesheet weekly summary")
def timesheets_weekly_summary(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    emp_id: Optional[str] = Query(None),
    approved: Optional[bool] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    """
    Tygodniowe podsumowanie godzin.
    SQLite – strftime, Postgres – EXTRACT/ISO week.
    """
    try:
        pool = _get_pool()
        params: list = []

        if pool is None:
            # SQLite
            sql = (
                "SELECT strftime('%Y', ts_date) AS year, "
                "strftime('%W', ts_date) AS week, "
                "MIN(ts_date) AS week_start, SUM(hours) AS total_hours "
                "FROM timesheets WHERE 1=1"
            )
            if from_date:
                sql += " AND ts_date >= %s"
                params.append(from_date)
            if to_date:
                sql += " AND ts_date <= %s"
                params.append(to_date)
            if emp_id:
                sql += " AND emp_id = %s"
                params.append(emp_id)
            if approved is not None:
                sql += " AND COALESCE(approved, 0) = %s"
                params.append(1 if approved else 0)
            sql += " GROUP BY year, week ORDER BY year, week"
        else:
            # Postgres
            sql = (
                "SELECT EXTRACT(isoyear FROM ts_date) AS year, "
                "to_char(ts_date, 'IW') AS week, "
                "MIN(ts_date)::date AS week_start, SUM(hours) AS total_hours "
                "FROM timesheets WHERE 1=1"
            )
            if from_date:
                sql += " AND ts_date >= %s"
                params.append(from_date)
            if to_date:
                sql += " AND ts_date <= %s"
                params.append(to_date)
            if emp_id:
                sql += " AND emp_id = %s"
                params.append(emp_id)
            if approved is not None:
                sql += " AND approved = %s"
                params.append(approved)
            sql += " GROUP BY 1,2 ORDER BY 1,2"

        rows = fetch_all(sql, tuple(params) if params else None)
        out = []
        for r in rows or []:
            year = str(int(r.get("year"))) if r.get("year") is not None else ""
            week = str(r.get("week")).zfill(2)
            out.append(
                {
                    "year": year,
                    "week": week,
                    "week_label": f"{year}-W{week}",
                    "week_start": r.get("week_start"),
                    "total_hours": float(r.get("total_hours") or 0),
                }
            )
        return out
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# -------------------------------------------------------------------
# EXPORT CSV
# -------------------------------------------------------------------


@router.get(
    "/api/timesheets/export.csv",
    summary="Export timesheets as CSV",
)
def timesheets_export_csv(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    emp_id: Optional[str] = Query(None),
    pending: Optional[bool] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    """
    Eksport pełnej listy timesheetów do CSV.
    """
    try:
        pool = _get_pool()
        params: list = []

        if pool is None:
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "COALESCE(approved, 0) AS approved, approved_by, approved_at "
                "FROM timesheets WHERE 1=1"
            )
        else:
            sql = (
                "SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
                "approved, approved_by, approved_at "
                "FROM timesheets WHERE 1=1"
            )

        if from_date:
            sql += " AND ts_date >= %s"
            params.append(from_date)
        if to_date:
            sql += " AND ts_date <= %s"
            params.append(to_date)
        if emp_id:
            sql += " AND emp_id = %s"
            params.append(emp_id)
        if pending is True:
            if pool is None:
                sql += " AND COALESCE(approved, 0) = 0"
            else:
                sql += " AND approved IS DISTINCT FROM TRUE"

        sql += " ORDER BY ts_date, emp_id, ts_id"

        rows = fetch_all(sql, tuple(params) if params else None)
        output = io.StringIO()
        # BOM dla Excela
        output.write("\ufeff")
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "ts_id",
                "emp_id",
                "ts_date",
                "order_id",
                "operation_no",
                "hours",
                "notes",
                "approved",
                "approved_by",
                "approved_at",
            ],
        )
        writer.writeheader()
        for r in rows or []:
            writer.writerow(r)

        csv_bytes = output.getvalue().encode("utf-8-sig")
        mem = io.BytesIO(csv_bytes)
        fname_parts = ["timesheets"]
        if from_date:
            fname_parts.append(from_date)
        if to_date:
            fname_parts.append(to_date)
        if emp_id:
            fname_parts.append(str(emp_id))
        filename = "_".join(fname_parts) + ".csv"
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8",
        }
        mem.seek(0)
        return StreamingResponse(mem, media_type="text/csv; charset=utf-8", headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/api/timesheets/export-summary.csv",
    summary="Export daily and weekly summaries as CSV",
)
def timesheets_export_summary_csv(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    emp_id: Optional[str] = Query(None),
    _ok: bool = Depends(check_api_key),
):
    """
    Eksport zarówno dziennych jak i tygodniowych sum godzin do jednego CSV.
    """
    try:
        # Daily summary
        sql_daily = (
            "SELECT ts_date AS date, SUM(hours) AS total_hours "
            "FROM timesheets WHERE 1=1"
        )
        params_daily: list = []
        if from_date:
            sql_daily += " AND ts_date >= %s"
            params_daily.append(from_date)
        if to_date:
            sql_daily += " AND ts_date <= %s"
            params_daily.append(to_date)
        if emp_id:
            sql_daily += " AND emp_id = %s"
            params_daily.append(emp_id)
        sql_daily += " GROUP BY ts_date ORDER BY ts_date"
        daily_rows = (
            fetch_all(sql_daily, tuple(params_daily) if params_daily else None) or []
        )

        # Weekly summary
        pool = _get_pool()
        params_week: list = []
        if pool is None:
            sql_week = (
                "SELECT strftime('%Y', ts_date) AS year, "
                "strftime('%W', ts_date) AS week, "
                "MIN(ts_date) AS week_start, SUM(hours) AS total_hours "
                "FROM timesheets WHERE 1=1"
            )
        else:
            sql_week = (
                "SELECT EXTRACT(isoyear FROM ts_date) AS year, "
                "to_char(ts_date, 'IW') AS week, "
                "MIN(ts_date)::date AS week_start, SUM(hours) AS total_hours "
                "FROM timesheets WHERE 1=1"
            )
        if from_date:
            sql_week += " AND ts_date >= %s"
            params_week.append(from_date)
        if to_date:
            sql_week += " AND ts_date <= %s"
            params_week.append(to_date)
        if emp_id:
            sql_week += " AND emp_id = %s"
            params_week.append(emp_id)
        sql_week += " GROUP BY 1,2 ORDER BY 1,2"
        weekly_rows = (
            fetch_all(sql_week, tuple(params_week) if params_week else None) or []
        )

        output = io.StringIO()
        output.write("\ufeff")
        writer = csv.DictWriter(
            output,
            fieldnames=["kind", "date", "week_label", "week_start", "total_hours"],
        )
        writer.writeheader()
        for r in daily_rows:
            writer.writerow(
                {
                    "kind": "daily",
                    "date": r.get("date"),
                    "week_label": "",
                    "week_start": "",
                    "total_hours": float(r.get("total_hours") or 0),
                }
            )
        for r in weekly_rows:
            year = str(int(r.get("year"))) if r.get("year") is not None else ""
            week = str(r.get("week")).zfill(2)
            writer.writerow(
                {
                    "kind": "weekly",
                    "date": "",
                    "week_label": f"{year}-W{week}",
                    "week_start": r.get("week_start"),
                    "total_hours": float(r.get("total_hours") or 0),
                }
            )

        csv_bytes = output.getvalue().encode("utf-8-sig")
        mem = io.BytesIO(csv_bytes)
        fname_parts = ["timesheets_summary"]
        if from_date:
            fname_parts.append(from_date)
        if to_date:
            fname_parts.append(to_date)
        if emp_id:
            fname_parts.append(str(emp_id))
        filename = "_".join(fname_parts) + ".csv"
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8",
        }
        mem.seek(0)
        return StreamingResponse(mem, media_type="text/csv; charset=utf-8", headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# -------------------------------------------------------------------
# APPROVE / UNAPPROVE (ADMIN)
# -------------------------------------------------------------------


@router.post(
    "/api/timesheets/{ts_id}/approve",
    summary="Approve timesheet entry (admin)",
)
def approve_timesheet(ts_id: int, admin=Depends(require_admin)):
    """
    Zatwierdzenie wpisu timesheet – admin only.
    """
    try:
        email = admin.get("email") if isinstance(admin, dict) else None
        sql = (
            "UPDATE timesheets "
            "SET approved = 1, approved_by = %s, approved_at = CURRENT_TIMESTAMP "
            "WHERE ts_id = %s "
            "RETURNING ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
            "approved, approved_by, approved_at"
        )
        rows = execute(sql, (email, ts_id), returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/api/timesheets/{ts_id}/unapprove",
    summary="Unapprove timesheet entry (admin)",
)
def unapprove_timesheet(ts_id: int, _admin=Depends(require_admin)):
    """
    Cofnięcie zatwierdzenia wpisu – admin only.
    """
    try:
        sql = (
            "UPDATE timesheets "
            "SET approved = 0, approved_by = NULL, approved_at = NULL "
            "WHERE ts_id = %s "
            "RETURNING ts_id, emp_id, ts_date, order_id, operation_no, hours, notes, "
            "approved, approved_by, approved_at"
        )
        rows = execute(sql, (ts_id,), returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
