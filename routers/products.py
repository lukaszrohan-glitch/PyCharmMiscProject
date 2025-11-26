from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from db import fetch_all, fetch_one, execute
from schemas import Product, ProductCreate, ProductUpdate
from security import check_api_key
from queries import SQL_PRODUCTS


router = APIRouter(tags=["Products"])


@router.get("/api/products", response_model=List[Product], summary="List products")
def products_list(
    limit: Optional[int] = Query(None, ge=1, le=5000),
    offset: Optional[int] = Query(None, ge=0),
):
    try:
        sql = SQL_PRODUCTS
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
    "/api/products/{product_id}",
    response_model=Optional[Product],
    summary="Get product by ID",
)
def product_get(product_id: str):
    try:
        return fetch_one(
            "SELECT product_id, name, unit, std_cost, price, vat_rate FROM products WHERE product_id = %s",
            (product_id,),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/api/products", response_model=Product, status_code=201, summary="Create product"
)
def create_product(payload: ProductCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            "INSERT INTO products (product_id, name, unit, std_cost, price, vat_rate) "
            "VALUES (%s, %s, %s, %s, %s, %s) "
            "RETURNING product_id, name, unit, std_cost, price, vat_rate",
            (
                payload.product_id,
                payload.name,
                payload.unit,
                payload.std_cost,
                payload.price,
                payload.vat_rate,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Product already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put(
    "/api/products/{product_id}", response_model=Product, summary="Update product"
)
def update_product(
    product_id: str, payload: ProductUpdate, _ok: bool = Depends(check_api_key)
):
    try:
        updates = []
        params = []
        if payload.name is not None:
            updates.append("name = %s")
            params.append(payload.name)
        if payload.unit is not None:
            updates.append("unit = %s")
            params.append(payload.unit)
        if payload.std_cost is not None:
            updates.append("std_cost = %s")
            params.append(payload.std_cost)
        if payload.price is not None:
            updates.append("price = %s")
            params.append(payload.price)
        if payload.vat_rate is not None:
            updates.append("vat_rate = %s")
            params.append(payload.vat_rate)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(product_id)
        sql = (
            f"UPDATE products SET {', '.join(updates)} "
            "WHERE product_id = %s "
            "RETURNING product_id, name, unit, std_cost, price, vat_rate"
        )
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Product not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/products/{product_id}", summary="Delete product")
def delete_product(product_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM products WHERE product_id = %s", (product_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
