from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from db import fetch_all, fetch_one, execute
from schemas import Employee, EmployeeCreate, EmployeeUpdate
from security import check_api_key


router = APIRouter(tags=["Employees"])


@router.get("/api/employees", response_model=List[Employee], summary="List employees")
def employees_list(
    limit: Optional[int] = Query(None, ge=1, le=5000),
    offset: Optional[int] = Query(None, ge=0),
):
    try:
        sql = "SELECT emp_id, name, role, hourly_rate FROM employees ORDER BY emp_id"
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
    "/api/employees/{emp_id}",
    response_model=Optional[Employee],
    summary="Get employee by ID",
)
def employee_get(emp_id: str):
    try:
        return fetch_one(
            "SELECT emp_id, name, role, hourly_rate FROM employees WHERE emp_id = %s",
            (emp_id,),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/api/employees",
    response_model=Employee,
    status_code=201,
    summary="Create employee",
)
def create_employee(payload: EmployeeCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            "INSERT INTO employees (emp_id, name, role, hourly_rate) "
            "VALUES (%s, %s, %s, %s) "
            "RETURNING emp_id, name, role, hourly_rate",
            (
                payload.emp_id,
                payload.name,
                payload.role,
                payload.hourly_rate,
            ),
            returning=True,
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Employee already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put(
    "/api/employees/{emp_id}", response_model=Employee, summary="Update employee"
)
def update_employee(
    emp_id: str, payload: EmployeeUpdate, _ok: bool = Depends(check_api_key)
):
    try:
        updates = []
        params = []
        if payload.name is not None:
            updates.append("name = %s")
            params.append(payload.name)
        if payload.role is not None:
            updates.append("role = %s")
            params.append(payload.role)
        if payload.hourly_rate is not None:
            updates.append("hourly_rate = %s")
            params.append(payload.hourly_rate)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(emp_id)
        sql = (
            f"UPDATE employees SET {', '.join(updates)} "
            "WHERE emp_id = %s "
            "RETURNING emp_id, name, role, hourly_rate"
        )
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Employee not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete("/api/employees/{emp_id}", summary="Delete employee")
def delete_employee(emp_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM employees WHERE emp_id = %s", (emp_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
