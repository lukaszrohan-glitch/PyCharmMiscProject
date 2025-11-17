from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from db import fetch_all, fetch_one, execute
from queries import SQL_INSERT_INVENTORY
from schemas import Inventory, InventoryCreate, InventoryUpdate
from security import check_api_key


router = APIRouter(tags=["Inventory"])


@router.get("/api/inventory", response_model=List[Inventory], summary="List inventory transactions")
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


@router.get("/api/inventory/{txn_id}", response_model=Optional[Inventory], summary="Get inventory by ID")
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
        rows = execute(
            SQL_INSERT_INVENTORY,
            (
                payload.txn_id,
                payload.txn_date,
                payload.product_id,
                payload.qty_change,
                payload.reason.value if hasattr(payload.reason, "value") else payload.reason,
                payload.lot,
                payload.location,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Failed to create inventory transaction")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/api/inventory/{txn_id}", response_model=Inventory, summary="Update inventory")
def update_inventory(txn_id: str, payload: InventoryUpdate, _ok: bool = Depends(check_api_key)):
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
            raise HTTPException(status_code=404, detail="Inventory transaction not found")
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
