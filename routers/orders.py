from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from db import fetch_all, fetch_one, execute
from schemas import Order, OrderCreate, OrderUpdate, OrderLineCreate
from queries import SQL_ORDERS, SQL_INSERT_ORDER, SQL_INSERT_ORDER_LINE
from security import check_api_key


router = APIRouter(tags=["Orders"])


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
        return rows if rows else []
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to fetch orders") from exc


@router.get("/api/orders/{order_id}", response_model=Optional[Order], summary="Get order by ID")
def order_get(order_id: str):
    try:
        return fetch_one(
            "SELECT order_id, customer_id, status, order_date, due_date FROM orders WHERE order_id = %s",
            (order_id,),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/orders", response_model=Order, status_code=201, summary="Create order")
def create_order(payload: OrderCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_ORDER,
            (
                payload.order_id,
                payload.customer_id,
                payload.status.value if hasattr(payload.status, "value") else payload.status,
                payload.due_date,
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


@router.post("/api/order-lines", status_code=201, summary="Create order line")
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


@router.put("/api/orders/{order_id}", response_model=Order, summary="Update order")
def update_order(order_id: str, payload: OrderUpdate, _ok: bool = Depends(check_api_key)):
    try:
        updates = []
        params = []
        if payload.customer_id is not None:
            updates.append("customer_id = %s")
            params.append(payload.customer_id)
        if payload.status is not None:
            updates.append("status = %s")
            params.append(payload.status.value if hasattr(payload.status, "value") else payload.status)
        if payload.due_date is not None:
            updates.append("due_date = %s")
            params.append(payload.due_date)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(order_id)
        sql = (
            f"UPDATE orders SET {', '.join(updates)} "
            "WHERE order_id = %s "
            "RETURNING order_id, customer_id, status, order_date, due_date"
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

