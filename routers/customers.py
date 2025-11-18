from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from db import fetch_all, fetch_one, execute
from schemas import Customer, CustomerCreate, CustomerUpdate
from security import check_api_key
from queries import SQL_CUSTOMERS


router = APIRouter(tags=["Customers"])


@router.get("/api/customers", response_model=List[Customer], summary="List customers")
def customers_list(
    limit: Optional[int] = Query(None, ge=1, le=5000),
    offset: Optional[int] = Query(None, ge=0),
):
    try:
        sql = SQL_CUSTOMERS
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


@router.get("/api/customers/{customer_id}", response_model=Optional[Customer], summary="Get customer by ID")
def customer_get(customer_id: str):
    try:
        return fetch_one(
            "SELECT customer_id, name, nip, address, email, contact_person FROM customers WHERE customer_id = %s",
            (customer_id,),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/api/customers", response_model=Customer, status_code=201, summary="Create customer")
def create_customer(payload: CustomerCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            "INSERT INTO customers (customer_id, name, nip, address, email, contact_person) "
            "VALUES (%s, %s, %s, %s, %s, %s) "
            "RETURNING customer_id, name, nip, address, email, contact_person",
            (
                payload.customer_id,
                payload.name,
                payload.nip,
                payload.address,
                payload.email,
                payload.contact_person,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Customer already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/api/customers/{customer_id}", response_model=Customer, summary="Update customer")
def update_customer(customer_id: str, payload: CustomerUpdate, _ok: bool = Depends(check_api_key)):
    try:
        updates = []
        params = []
        if payload.name is not None:
            updates.append("name = %s")
            params.append(payload.name)
        if payload.nip is not None:
            updates.append("nip = %s")
            params.append(payload.nip)
        if payload.address is not None:
            updates.append("address = %s")
            params.append(payload.address)
        if payload.email is not None:
            updates.append("email = %s")
            params.append(payload.email)
        if getattr(payload, 'contact_person', None) is not None:
            updates.append("contact_person = %s")
            params.append(payload.contact_person)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(customer_id)
        sql = (
            f"UPDATE customers SET {', '.join(updates)} "
            "WHERE customer_id = %s "
            "RETURNING customer_id, name, nip, address, email, contact_person"
        )
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Customer not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/customers/{customer_id}", summary="Delete customer")
def delete_customer(customer_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
