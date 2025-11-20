from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from fastapi.responses import StreamingResponse

from db import fetch_all, fetch_one, execute
from schemas import Order, OrderCreate, OrderUpdate, OrderLineCreate
from queries import SQL_ORDERS, SQL_INSERT_ORDER, SQL_INSERT_ORDER_LINE
from security import check_api_key


router = APIRouter(tags=["Orders"])


def _normalize_status(value: Optional[str]) -> Optional[str]:
    """
    Helper: normalizuje statusy do wartości używanych w aplikacji.
    """
    if value is None:
        return value
    mapping = {
        "in progress": "InProd",
        "completed": "Done",
    }
    v = str(value).strip()
    return mapping.get(v.lower(), v)


@router.get("/api/orders", response_model=List[Order], summary="List orders")
def orders_list(
    limit: Optional[int] = Query(None, ge=1, le=1000),
    offset: Optional[int] = Query(None, ge=0),
):
    try:
        sql = SQL_ORDERS
        params: List = []
        if limit is not None:
            sql += " LIMIT %s"
            params.append(limit)
        if offset is not None:
            sql += " OFFSET %s"
            params.append(offset)
        rows = fetch_all(sql, tuple(params) if params else None)
        for r in rows or []:
            if "status" in r:
                r["status"] = _normalize_status(r.get("status"))
        return rows if rows else []
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to fetch orders") from exc


@router.get(
    "/api/orders/{order_id}",
    response_model=Optional[Order],
    summary="Get order by ID",
)
def order_get(order_id: str):
    try:
        row = fetch_one(
            "SELECT order_id, customer_id, status, order_date, due_date, contact_person "
            "FROM orders WHERE order_id = %s",
            (order_id,),
        )
        if row and "status" in row:
            row["status"] = _normalize_status(row.get("status"))
        return row
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/api/orders",
    response_model=Order,
    status_code=201,
    summary="Create order",
)
def create_order(payload: OrderCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_ORDER,
            (
                payload.order_id,
                payload.customer_id,
                payload.status.value
                if hasattr(payload.status, "value")
                else payload.status,
                payload.due_date,
                payload.contact_person,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Order already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/api/order-lines",
    status_code=201,
    summary="Create order line",
)
def create_order_line(payload: OrderLineCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_ORDER_LINE,
            (
                payload.order_id,
                payload.line_no,
                payload.product_id,
                payload.qty,
                payload.unit_price,
                payload.discount_pct,
                payload.graphic_id,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Order line already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put(
    "/api/orders/{order_id}",
    response_model=Order,
    summary="Update order",
)
def update_order(order_id: str, payload: OrderUpdate, _ok: bool = Depends(check_api_key)):
    try:
        updates = []
        params = []
        if payload.customer_id is not None:
            updates.append("customer_id = %s")
            params.append(payload.customer_id)
        if payload.status is not None:
            updates.append("status = %s")
            params.append(
                payload.status.value
                if hasattr(payload.status, "value")
                else payload.status
            )
        if payload.due_date is not None:
            updates.append("due_date = %s")
            params.append(payload.due_date)
        if getattr(payload, "contact_person", None) is not None:
            updates.append("contact_person = %s")
            params.append(payload.contact_person)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(order_id)
        sql = (
            f"UPDATE orders SET {', '.join(updates)} "
            "WHERE order_id = %s "
            "RETURNING order_id, customer_id, status, order_date, due_date, contact_person"
        )

        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Order not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/orders/{order_id}", summary="Delete order")
def delete_order(order_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM orders WHERE order_id = %s", (order_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ------------- TUTAJ DODANY ENDPOINT MIGRACYJNY -------------


@router.post(
    "/internal/migrate-contact-person",
    summary="TEMP: add contact_person columns",
)
def migrate_contact_person(_ok: bool = Depends(check_api_key)):
    """
    Jednorazowa migracja: dodaje kolumnę contact_person
    do tables customers i orders (jeśli jej nie ma).
    """
    try:
        execute(
            "ALTER TABLE customers "
            "ADD COLUMN IF NOT EXISTS contact_person text;"
        )
        execute(
            "ALTER TABLE orders "
            "ADD COLUMN IF NOT EXISTS contact_person text;"
        )
        return {"ok": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/api/orders/export", summary="Export orders as CSV")
def export_orders_csv(_ok: bool = Depends(check_api_key)):
    """Export all orders as a CSV for Excel/import workflows."""
    try:
        rows = fetch_all(SQL_ORDERS, None) or []
        import io, csv
        buf = io.StringIO()
        writer = csv.writer(buf)
        header = ["order_id", "customer_id", "status", "order_date", "due_date", "contact_person"]
        writer.writerow(header)
        for r in rows:
            writer.writerow([r.get(col, "") for col in header])
        csv_bytes = buf.getvalue().encode("utf-8-sig")
        mem = io.BytesIO(csv_bytes)
        mem.seek(0)
        return StreamingResponse(
            mem,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": "attachment; filename=orders.csv",
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/orders/import", summary="Import orders from CSV")
def import_orders_csv(file: UploadFile = File(...), _ok: bool = Depends(check_api_key)):
    """Import orders from a CSV file with columns: order_id, customer_id, status, due_date, contact_person"""
    import csv, io
    try:
        content = file.file.read().decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {exc}") from exc

    reader = csv.DictReader(io.StringIO(content))
    created = 0
    skipped = 0
    errors: list[str] = []

    for idx, row in enumerate(reader, start=2):  # header is line 1
        order_id = (row.get("order_id") or "").strip()
        customer_id = (row.get("customer_id") or "").strip()
        if not order_id or not customer_id:
            skipped += 1
            errors.append(f"Line {idx}: missing order_id or customer_id")
            continue

        status = (row.get("status") or "Planned").strip() or "Planned"
        due_date = (row.get("due_date") or "").strip() or None
        contact_person = (row.get("contact_person") or "").strip() or None

        # skip duplicates for now (insert-only behavior)
        existing = fetch_one("SELECT 1 FROM orders WHERE order_id = %s", (order_id,))
        if existing:
            skipped += 1
            errors.append(f"Line {idx}: order {order_id} already exists, skipped")
            continue

        try:
            execute(
                SQL_INSERT_ORDER,
                (order_id, customer_id, status, due_date, contact_person),
            )
            created += 1
        except Exception as exc:
            skipped += 1
            errors.append(f"Line {idx}: failed to insert {order_id}: {exc}")

    return {"created": created, "skipped": skipped, "errors": errors}
