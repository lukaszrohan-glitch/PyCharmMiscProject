from __future__ import annotations

import csv
import io
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form

import auth as api_keys
from admin_audit import log_admin_event, ensure_table as ensure_admin_audit
from db import fetch_all, execute
from schemas import UserCreateAdmin, SubscriptionPlanCreate
from security import check_admin_key
from user_mgmt import create_user, list_users, create_plan, list_plans, require_admin


router = APIRouter(tags=["Admin", "Admin/API Keys"])


# Ensure admin_audit table exists
ensure_admin_audit()


@router.post("/api/admin/users", summary="Admin: create user")
def admin_create_user(payload: UserCreateAdmin, _admin=Depends(require_admin)):
    try:
        row = create_user(
            payload.email,
            payload.company_id,
            payload.is_admin,
            payload.subscription_plan,
            getattr(payload, "password", None),
        )
        # audit
        log_admin_event("create_user", event_by=_admin.get("email"), details={"email": payload.email})
        return row
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/admin/users", summary="Admin: list users")
def admin_list_users(_admin=Depends(require_admin)):
    return list_users()


@router.post("/api/admin/subscription-plans", summary="Admin: create subscription plan")
def admin_create_plan(payload: SubscriptionPlanCreate, _admin=Depends(require_admin)):
    row = create_plan(
        payload.plan_id,
        payload.name,
        payload.max_orders,
        payload.max_users,
        payload.features,
    )
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create plan")
    # audit
    log_admin_event("create_plan", event_by=_admin.get("email"), details={"plan_id": payload.plan_id})
    return row


@router.get("/api/admin/subscription-plans", summary="Admin: list subscription plans")
def admin_list_plans(_admin=Depends(require_admin)):
    return list_plans()


@router.get("/api/admin/audit", summary="List admin audit events (user/plan/import)")
def admin_list_admin_audit(limit: int = 100, _admin=Depends(require_admin)):
    try:
        # Lazy import to avoid circular import
        from admin_audit import list_admin_audit
        return list_admin_audit(limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---- Admin API keys (x-admin-key) ----
@router.get("/api/admin/api-keys", summary="List API keys (x-admin-key)")
def admin_list_keys(_ok: bool = Depends(check_admin_key)):
    try:
        return api_keys.list_api_keys()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/admin/api-keys", summary="Create API key (x-admin-key)")
def admin_create_key(payload: Dict[str, str], _ok: bool = Depends(check_admin_key)):
    label = payload.get("label") if isinstance(payload, dict) else None
    row = api_keys.create_api_key(label)
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create API key")
    return row


@router.delete("/api/admin/api-keys/{key_id}", summary="Delete API key (x-admin-key)")
def admin_delete_key(key_id: int, _ok: bool = Depends(check_admin_key)):
    row = api_keys.delete_api_key_by_id(key_id)
    if not row:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"deleted": row}


@router.post("/api/admin/api-keys/{key_id}/rotate", summary="Rotate API key (x-admin-key)")
def admin_rotate_key(key_id: int, _ok: bool = Depends(check_admin_key)):
    try:
        new = api_keys.rotate_api_key(key_id, by="admin")
        if not new:
            raise HTTPException(status_code=500, detail="Failed to rotate key")
        return new
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/admin/api-key-audit", summary="List API key audit events")
def admin_api_key_audit(_ok: bool = Depends(check_admin_key)):
    try:
        rows = fetch_all(
            "SELECT * FROM api_key_audit ORDER BY event_time DESC LIMIT 100"
        )
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/admin/api-key-audit", summary="Purge old API key audit events")
def admin_purge_audit(days: int = 30, _ok: bool = Depends(check_admin_key)):
    try:
        from db import _get_pool

        pool = _get_pool()
        if pool is None:
            execute(
                "DELETE FROM api_key_audit "
                "WHERE event_time IS NULL OR event_time = '' "
                "OR event_time <= datetime('now', ?)",
                ("-" + str(days) + " days",),
            )
        else:
            execute(
                "DELETE FROM api_key_audit "
                "WHERE event_time IS NULL "
                "OR event_time <= now() - interval '1 day' * %s",
                (days,),
            )
        return {"purged": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---- Legacy paths without "/api" prefix for admin-key endpoints ----
# Keep compatibility with older clients and tests expecting "/admin/..." paths.

@router.get("/admin/api-keys", summary="List API keys (legacy x-admin-key)")
def legacy_admin_list_keys(_ok: bool = Depends(check_admin_key)):
    return admin_list_keys(_ok)


@router.post("/admin/api-keys", summary="Create API key (legacy x-admin-key)")
def legacy_admin_create_key(payload: Dict[str, str], _ok: bool = Depends(check_admin_key)):
    return admin_create_key(payload, _ok)


@router.delete("/admin/api-keys/{key_id}", summary="Delete API key (legacy x-admin-key)")
def legacy_admin_delete_key(key_id: int, _ok: bool = Depends(check_admin_key)):
    return admin_delete_key(key_id, _ok)


@router.post("/admin/api-keys/{key_id}/rotate", summary="Rotate API key (legacy x-admin-key)")
def legacy_admin_rotate_key(key_id: int, _ok: bool = Depends(check_admin_key)):
    return admin_rotate_key(key_id, _ok)


@router.get("/admin/api-key-audit", summary="List API key audit events (legacy)")
def legacy_admin_api_key_audit(_ok: bool = Depends(check_admin_key)):
    return admin_api_key_audit(_ok)


@router.delete("/admin/api-key-audit", summary="Purge API key audit events (legacy)")
def legacy_admin_purge_audit(days: int = 30, _ok: bool = Depends(check_admin_key)):
    return admin_purge_audit(days, _ok)


# ---- Import endpoint: JSON and CSV upload ----
@router.post("/api/import/csv", summary="Import data from JSON or CSV upload")
async def import_csv(
    entity_type: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    data: Optional[List[Dict]] = None,
    _admin=Depends(require_admin),
):
    """
    Accept either:
      - application/json { entity_type, data: [ {...}, ... ] }
      - multipart/form-data with fields: entity_type + file (CSV)
    Only admin users (JWT) can import.
    """
    try:
        if data and not entity_type:
            raise HTTPException(status_code=400, detail="Missing entity_type")
        if not data and not (file and entity_type):
            raise HTTPException(status_code=400, detail="Provide JSON data or CSV file + entity_type")

        rows_imported = 0

        # CSV mode
        if file is not None and entity_type:
            content = await file.read()
            text = content.decode('utf-8', errors='replace')
            reader = csv.DictReader(io.StringIO(text))
            parsed = list(reader)
            rows_imported = _do_import(entity_type, parsed)
            log_admin_event("import_csv", event_by=_admin.get("email"), details={"entity_type": entity_type, "rows": rows_imported})
            return {"imported": rows_imported, "entity_type": entity_type}

        # JSON mode
        if data is not None and entity_type:
            rows_imported = _do_import(entity_type, data)
            log_admin_event("import_json", event_by=_admin.get("email"), details={"entity_type": entity_type, "rows": rows_imported})
            return {"imported": rows_imported, "entity_type": entity_type}

        raise HTTPException(status_code=400, detail="Invalid import payload")

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def _do_import(entity_type: str, data_rows: List[Dict]) -> int:
    entity_type = entity_type.lower()
    imported = 0
    if entity_type == "orders":
        for row in data_rows:
            execute(
                "INSERT INTO orders (order_id, order_date, customer_id, status, due_date) "
                "VALUES (%s, CURRENT_DATE, %s, %s, %s) "
                "ON CONFLICT (order_id) DO NOTHING",
                (
                    row.get("order_id"),
                    row.get("customer_id"),
                    row.get("status", "Planned"),
                    row.get("due_date"),
                ),
                returning=False,
            )
            imported += 1
    elif entity_type == "products":
        for row in data_rows:
            execute(
                "INSERT INTO products (product_id, name, unit, std_cost, price, vat_rate) "
                "VALUES (%s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (product_id) DO NOTHING",
                (
                    row.get("product_id"),
                    row.get("name"),
                    row.get("unit", "pcs"),
                    row.get("std_cost", 0),
                    row.get("price", 0),
                    row.get("vat_rate", 23),
                ),
                returning=False,
            )
            imported += 1
    elif entity_type == "customers":
        for row in data_rows:
            execute(
                "INSERT INTO customers (customer_id, name, nip, address, email) "
                "VALUES (%s, %s, %s, %s, %s) "
                "ON CONFLICT (customer_id) DO NOTHING",
                (
                    row.get("customer_id"),
                    row.get("name"),
                    row.get("nip"),
                    row.get("address"),
                    row.get("email"),
                ),
                returning=False,
            )
            imported += 1
    elif entity_type == "employees":
        for row in data_rows:
            execute(
                "INSERT INTO employees (emp_id, name, role, hourly_rate) "
                "VALUES (%s, %s, %s, %s) "
                "ON CONFLICT (emp_id) DO NOTHING",
                (
                    row.get("emp_id"),
                    row.get("name"),
                    row.get("role"),
                    row.get("hourly_rate", 0),
                ),
                returning=False,
            )
            imported += 1
    elif entity_type == "timesheets":
        for row in data_rows:
            execute(
                "INSERT INTO timesheets (emp_id, ts_date, order_id, operation_no, hours, notes) "
                "VALUES (%s, %s, %s, %s, %s, %s) ",
                (
                    row.get("emp_id"),
                    row.get("ts_date"),
                    row.get("order_id"),
                    row.get("operation_no"),
                    row.get("hours"),
                    row.get("notes"),
                ),
                returning=False,
            )
            imported += 1
    elif entity_type == "inventory":
        for row in data_rows:
            execute(
                "INSERT INTO inventory (txn_id, txn_date, product_id, qty_change, reason, lot, location) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) "
                "ON CONFLICT (txn_id) DO NOTHING",
                (
                    row.get("txn_id"),
                    row.get("txn_date"),
                    row.get("product_id"),
                    row.get("qty_change"),
                    row.get("reason"),
                    row.get("lot"),
                    row.get("location"),
                ),
                returning=False,
            )
            imported += 1
    else:
        raise HTTPException(status_code=400, detail=f"Unknown entity_type: {entity_type}")

    return imported
