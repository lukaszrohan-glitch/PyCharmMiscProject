from __future__ import annotations

from typing import List, Optional
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from psycopg.errors import UniqueViolation

from db import fetch_all, fetch_one, execute
from queries import SQL_INSERT_INVENTORY
from schemas import Inventory, InventoryCreate, InventoryUpdate
from security import check_api_key


router = APIRouter(tags=["Inventory"])


def _readonly_dep(
    authorization=Header(None), x_api_key=Header(None), api_key: Optional[str] = None
):
    return check_api_key(
        authorization=authorization,
        x_api_key=x_api_key,
        api_key=api_key,
        allow_readonly=True,
    )


@router.get("/api/inventory/export", summary="Export inventory as CSV")
def export_inventory_csv(_ok: bool = Depends(_readonly_dep)):
    """Export all inventory transactions as CSV for Excel/import workflows."""
    try:
        rows = (
            fetch_all(
                "SELECT txn_id, txn_date, product_id, qty_change, reason, lot, location FROM inventory ORDER BY txn_date DESC",
                None,
            )
            or []
        )
        import io, csv

        buf = io.StringIO()
        writer = csv.writer(buf)
        header = [
            "txn_id",
            "txn_date",
            "product_id",
            "qty_change",
            "reason",
            "lot",
            "location",
        ]
        writer.writerow(header)
        for r in rows:
            writer.writerow(
                [r.get(col) if r.get(col) is not None else "" for col in header]
            )
        csv_bytes = buf.getvalue().encode("utf-8-sig")
        mem = io.BytesIO(csv_bytes)
        mem.seek(0)
        return StreamingResponse(
            mem,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": "attachment; filename=inventory.csv"},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/api/inventory",
    response_model=List[Inventory],
    summary="List inventory transactions",
)
def inventory_list(
    limit: Optional[int] = Query(None, ge=1, le=5000),
    offset: Optional[int] = Query(None, ge=0),
):
    try:
        sql = (
            "SELECT txn_id, txn_date, product_id, qty_change, reason, lot, location "
            "FROM inventory ORDER BY txn_date DESC"
        )
        params: List = []
        if limit is not None:
            sql += " LIMIT %s"
            params.append(limit)
        if offset is not None:
            sql += " OFFSET %s"
            params.append(offset)
        return fetch_all(sql, tuple(params) if params else None)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/api/inventory/{txn_id}",
    response_model=Optional[Inventory],
    summary="Get inventory by ID",
)
def inventory_get(txn_id: str):
    try:
        return fetch_one(
            "SELECT txn_id, txn_date, product_id, qty_change, reason, lot, location "
            "FROM inventory WHERE txn_id = %s",
            (txn_id,),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/inventory", status_code=201, summary="Create inventory transaction")
def create_inventory_txn(payload: InventoryCreate, _ok: bool = Depends(check_api_key)):
    try:
        exists = fetch_one(
            "SELECT 1 FROM inventory WHERE txn_id = %s", (payload.txn_id,)
        )
        if exists:
            raise HTTPException(
                status_code=409, detail="Inventory transaction already exists"
            )
        rows = execute(
            SQL_INSERT_INVENTORY,
            (
                payload.txn_id,
                payload.txn_date,
                payload.product_id,
                payload.qty_change,
                (
                    payload.reason.value
                    if hasattr(payload.reason, "value")
                    else payload.reason
                ),
                payload.lot,
                payload.location,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(
                status_code=500, detail="Failed to create inventory transaction"
            )
        return rows[0]
    except HTTPException:
        raise
    except UniqueViolation:
        raise HTTPException(
            status_code=409, detail="Inventory transaction already exists"
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put(
    "/api/inventory/{txn_id}", response_model=Inventory, summary="Update inventory"
)
def update_inventory(
    txn_id: str, payload: InventoryUpdate, _ok: bool = Depends(check_api_key)
):
    try:
        updates = []
        params = []
        if payload.txn_date is not None:
            updates.append("txn_date = %s")
            params.append(payload.txn_date)
        if payload.product_id is not None:
            updates.append("product_id = %s")
            params.append(payload.product_id)
        if payload.qty_change is not None:
            updates.append("qty_change = %s")
            params.append(payload.qty_change)
        if payload.reason is not None:
            updates.append("reason = %s")
            params.append(payload.reason)
        if payload.lot is not None:
            updates.append("lot = %s")
            params.append(payload.lot)
        if payload.location is not None:
            updates.append("location = %s")
            params.append(payload.location)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(txn_id)
        sql = (
            f"UPDATE inventory SET {', '.join(updates)} "
            "WHERE txn_id = %s "
            "RETURNING txn_id, txn_date, product_id, qty_change, reason, lot, location"
        )
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(
                status_code=404, detail="Inventory transaction not found"
            )
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/inventory/{txn_id}", summary="Delete inventory")
def delete_inventory(txn_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM inventory WHERE txn_id = %s", (txn_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/inventory/import", summary="Import inventory from CSV")
def import_inventory_csv(
    file: UploadFile = File(...), _ok: bool = Depends(check_api_key)
):
    """Import inventory transactions from CSV: txn_id, txn_date, product_id, qty_change, reason, lot, location"""
    import csv, io

    try:
        content = file.file.read().decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {exc}") from exc

    reader = csv.DictReader(io.StringIO(content))
    created = 0
    skipped = 0
    errors: list[str] = []

    for idx, row in enumerate(reader, start=2):
        txn_id = (row.get("txn_id") or "").strip()
        product_id = (row.get("product_id") or "").strip()
        if not txn_id or not product_id:
            skipped += 1
            errors.append(f"Line {idx}: missing txn_id or product_id")
            continue

        existing = fetch_one("SELECT 1 FROM inventory WHERE txn_id = %s", (txn_id,))
        if existing:
            skipped += 1
            errors.append(f"Line {idx}: txn {txn_id} already exists, skipped")
            continue

        raw_date = (row.get("txn_date") or "").strip()
        raw_qty = (row.get("qty_change") or "").strip()
        if not raw_date or not raw_qty:
            skipped += 1
            errors.append(f"Line {idx}: missing txn_date or qty_change")
            continue
        try:
            d = date.fromisoformat(raw_date)
        except Exception:
            skipped += 1
            errors.append(f"Line {idx}: invalid date '{raw_date}'")
            continue
        try:
            qty = Decimal(raw_qty)
        except Exception:
            skipped += 1
            errors.append(f"Line {idx}: invalid qty '{raw_qty}'")
            continue

        reason = (row.get("reason") or "PO").strip() or "PO"
        lot = (row.get("lot") or "").strip() or None
        location = (row.get("location") or "").strip() or None

        try:
            execute(
                SQL_INSERT_INVENTORY,
                (txn_id, d, product_id, qty, reason, lot, location),
            )
            created += 1
        except UniqueViolation:
            skipped += 1
            errors.append(f"Line {idx}: txn {txn_id} already exists, skipped")
        except Exception as exc:
            skipped += 1
            errors.append(f"Line {idx}: failed to insert {txn_id}: {exc}")

    return {"created": created, "skipped": skipped, "errors": errors}
