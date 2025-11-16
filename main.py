import os
import logging
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger(__name__)

from db import fetch_all, fetch_one, execute
from schemas import (
    Order, Finance, OrderCreate, OrderUpdate, OrderLineCreate,
    Product, ProductCreate, ProductUpdate,
    Customer, CustomerCreate, CustomerUpdate,
    Employee, EmployeeCreate, EmployeeUpdate,
    Timesheet, TimesheetCreate, TimesheetUpdate,
    Inventory, InventoryCreate, InventoryUpdate,
    UserLogin, PasswordChange, UserCreateAdmin, SubscriptionPlanCreate,
    PasswordResetRequest, PasswordReset
)
from queries import (
    SQL_ORDERS, SQL_FINANCE_ONE, SQL_SHORTAGES, SQL_PLANNED_ONE,
    SQL_INSERT_ORDER, SQL_INSERT_ORDER_LINE, SQL_INSERT_TIMESHEET, SQL_INSERT_INVENTORY,
    SQL_PRODUCTS, SQL_CUSTOMERS
)
import auth
from auth import log_api_key_event, mark_last_used
from user_mgmt import ensure_user_tables, login_user, create_user, list_users, change_password, create_plan, list_plans, get_current_user, require_admin, request_password_reset, reset_password_with_token

app = FastAPI(title="SMB Tool API", version="1.0")

# ---- CORS ----
origins_env = os.getenv("CORS_ORIGINS", "")
if origins_env:
    origins = [o.strip() for o in origins_env.split(",") if o.strip()]
    allow_credentials = True
else:
    origins = ["*"]
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- API key auth ----
API_KEYS = [k.strip() for k in os.getenv("API_KEYS", "").split(",") if k.strip()]


def check_api_key(x_api_key: Optional[str] = Header(None), api_key: Optional[str] = None, authorization: Optional[str] = Header(None)):
    key = x_api_key or api_key

    if authorization and authorization.startswith('Bearer '):
        try:
            from user_mgmt import decode_token
            payload = decode_token(authorization)
            return True
        except Exception as e:
            logger.debug(f"JWT token validation failed: {e}")
            pass

    if not API_KEYS:
        try:
            db_keys = auth.list_api_keys()
            if not db_keys:
                return True
        except Exception as e:
            logger.warning(f"DB error checking API keys during onboarding: {e}")
            return True

    if not key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    if API_KEYS and key in API_KEYS:
        return True

    try:
        row = auth.get_api_key(key)
        if row:
            try:
                if row.get('id'):
                    mark_last_used(row.get('id'))
                    log_api_key_event(row.get('id'), 'used', 'api')
            except Exception as e:
                logger.warning(f"Failed to log API key event: {e}")
            return True
    except Exception as e:
        logger.warning(f"DB error checking API key: {e}")

    raise HTTPException(status_code=401, detail="Invalid or missing API key")


ADMIN_KEY = os.getenv("ADMIN_KEY")


def check_admin_key(x_admin_key: Optional[str] = Header(None)):
    if not ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Admin key not configured")
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Invalid admin key")
    return True


# Admin: ensure api_keys table exists on startup
try:
    auth.ensure_table()
except Exception:
    # ignore if DB not ready; will be created during DB init
    pass

# Ensure user tables
try:
    ensure_user_tables()
except Exception:
    pass


# ---- HEALTH ----
@app.get("/healthz")
def health():
    return {"ok": True}

# Compatibility route: some proxies forward /api/healthz
@app.get("/api/healthz")
def health_api():
    return health()


# ---- READ ENDPOINTS ----
@app.get("/api/orders", response_model=List[Order])
def orders_list():
    try:
        rows = fetch_all(SQL_ORDERS)
        return rows if rows else []
    except Exception as exc:
        print(f"Error fetching orders: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")


@app.get("/api/orders/{order_id}", response_model=Optional[Order])
def order_get(order_id: str):
    try:
        return fetch_one("SELECT order_id, customer_id, status, due_date FROM orders WHERE order_id = %s", (order_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/finance/{order_id}", response_model=Optional[Finance])
def finance_one(order_id: str):
    try:
        return fetch_one(SQL_FINANCE_ONE, (order_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/shortages")
def shortages():
    try:
        return fetch_all(SQL_SHORTAGES)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/planned-time/{order_id}")
def planned_time(order_id: str):
    try:
        row = fetch_one(SQL_PLANNED_ONE, (order_id,))
        if not row:
            raise HTTPException(status_code=404, detail="Order not found in v_planned_time")
        return row
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/products", response_model=List[Product])
def products_list():
    try:
        return fetch_all(SQL_PRODUCTS)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/products/{product_id}", response_model=Optional[Product])
def product_get(product_id: str):
    try:
        return fetch_one("SELECT product_id, name, unit, std_cost, price, vat_rate FROM products WHERE product_id = %s", (product_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/customers", response_model=List[Customer])
def customers_list():
    try:
        return fetch_all(SQL_CUSTOMERS)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/customers/{customer_id}", response_model=Optional[Customer])
def customer_get(customer_id: str):
    try:
        return fetch_one("SELECT customer_id, name, nip, address, email FROM customers WHERE customer_id = %s", (customer_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/employees", response_model=List[Employee])
def employees_list():
    try:
        return fetch_all("SELECT emp_id, name, role, hourly_rate FROM employees ORDER BY emp_id")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/employees/{emp_id}", response_model=Optional[Employee])
def employee_get(emp_id: str):
    try:
        return fetch_one("SELECT emp_id, name, role, hourly_rate FROM employees WHERE emp_id = %s", (emp_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/timesheets", response_model=List[Timesheet])
def timesheets_list():
    try:
        return fetch_all("SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes FROM timesheets ORDER BY ts_date DESC")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/timesheets/{ts_id}", response_model=Optional[Timesheet])
def timesheet_get(ts_id: int):
    try:
        return fetch_one("SELECT ts_id, emp_id, ts_date, order_id, operation_no, hours, notes FROM timesheets WHERE ts_id = %s", (ts_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/inventory", response_model=List[Inventory])
def inventory_list():
    try:
        return fetch_all("SELECT txn_id, txn_date, product_id, qty_change, reason, lot, location FROM inventory ORDER BY txn_date DESC")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/inventory/{txn_id}", response_model=Optional[Inventory])
def inventory_get(txn_id: str):
    try:
        return fetch_one("SELECT txn_id, txn_date, product_id, qty_change, reason, lot, location FROM inventory WHERE txn_id = %s", (txn_id,))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ---- WRITE ENDPOINTS (protected by API key) ----
@app.post("/api/orders", response_model=Order, status_code=201)
def create_order(payload: OrderCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_ORDER,
            (payload.order_id, payload.customer_id, payload.status.value if hasattr(payload.status, 'value') else payload.status, payload.due_date),
            returning=True
        )
        if not rows:
            # already exists
            raise HTTPException(status_code=409, detail="Order already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/order-lines", status_code=201)
def create_order_line(payload: OrderLineCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_ORDER_LINE,
            (payload.order_id, payload.line_no, payload.product_id,
             payload.qty, payload.unit_price, payload.discount_pct, payload.graphic_id),
            returning=True
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Order line already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/timesheets", status_code=201)
def create_timesheet(payload: TimesheetCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_TIMESHEET,
            (payload.emp_id, payload.ts_date, payload.order_id,
             payload.operation_no, payload.hours, payload.notes),
            returning=True
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Failed to create timesheet")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/inventory", status_code=201)
def create_inventory_txn(payload: InventoryCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            SQL_INSERT_INVENTORY,
            (payload.txn_id, payload.txn_date, payload.product_id,
             payload.qty_change, payload.reason.value if hasattr(payload.reason, 'value') else payload.reason, payload.lot, payload.location),
            returning=True
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Failed to create inventory transaction")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.put("/api/orders/{order_id}", response_model=Order)
def update_order(order_id: str, payload: OrderUpdate, _ok: bool = Depends(check_api_key)):
    try:
        updates = []
        params = []
        if payload.customer_id is not None:
            updates.append("customer_id = %s")
            params.append(payload.customer_id)
        if payload.status is not None:
            updates.append("status = %s")
            params.append(payload.status.value if hasattr(payload.status, 'value') else payload.status)
        if payload.due_date is not None:
            updates.append("due_date = %s")
            params.append(payload.due_date)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(order_id)
        sql = f"UPDATE orders SET {', '.join(updates)} WHERE order_id = %s RETURNING order_id, customer_id, status, due_date"
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Order not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/orders/{order_id}")
def delete_order(order_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM orders WHERE order_id = %s", (order_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/products", response_model=Product, status_code=201)
def create_product(payload: ProductCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            "INSERT INTO products (product_id, name, unit, std_cost, price, vat_rate) VALUES (%s, %s, %s, %s, %s, %s) RETURNING product_id, name, unit, std_cost, price, vat_rate",
            (payload.product_id, payload.name, payload.unit, payload.std_cost, payload.price, payload.vat_rate),
            returning=True
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Product already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.put("/api/products/{product_id}", response_model=Product)
def update_product(product_id: str, payload: ProductUpdate, _ok: bool = Depends(check_api_key)):
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
        sql = f"UPDATE products SET {', '.join(updates)} WHERE product_id = %s RETURNING product_id, name, unit, std_cost, price, vat_rate"
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Product not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/products/{product_id}")
def delete_product(product_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM products WHERE product_id = %s", (product_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/customers", response_model=Customer, status_code=201)
def create_customer(payload: CustomerCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            "INSERT INTO customers (customer_id, name, nip, address, email) VALUES (%s, %s, %s, %s, %s) RETURNING customer_id, name, nip, address, email",
            (payload.customer_id, payload.name, payload.nip, payload.address, payload.email),
            returning=True
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Customer already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.put("/api/customers/{customer_id}", response_model=Customer)
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
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.append(customer_id)
        sql = f"UPDATE customers SET {', '.join(updates)} WHERE customer_id = %s RETURNING customer_id, name, nip, address, email"
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Customer not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/employees", response_model=Employee, status_code=201)
def create_employee(payload: EmployeeCreate, _ok: bool = Depends(check_api_key)):
    try:
        rows = execute(
            "INSERT INTO employees (emp_id, name, role, hourly_rate) VALUES (%s, %s, %s, %s) RETURNING emp_id, name, role, hourly_rate",
            (payload.emp_id, payload.name, payload.role, payload.hourly_rate),
            returning=True
        )
        if not rows:
            raise HTTPException(status_code=409, detail="Employee already exists")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.put("/api/employees/{emp_id}", response_model=Employee)
def update_employee(emp_id: str, payload: EmployeeUpdate, _ok: bool = Depends(check_api_key)):
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
        sql = f"UPDATE employees SET {', '.join(updates)} WHERE emp_id = %s RETURNING emp_id, name, role, hourly_rate"
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Employee not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/employees/{emp_id}")
def delete_employee(emp_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM employees WHERE emp_id = %s", (emp_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.put("/api/timesheets/{ts_id}", response_model=Timesheet)
def update_timesheet(ts_id: int, payload: TimesheetUpdate, _ok: bool = Depends(check_api_key)):
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
        sql = f"UPDATE timesheets SET {', '.join(updates)} WHERE ts_id = %s RETURNING ts_id, emp_id, ts_date, order_id, operation_no, hours, notes"
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Timesheet not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/timesheets/{ts_id}")
def delete_timesheet(ts_id: int, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM timesheets WHERE ts_id = %s", (ts_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.put("/api/inventory/{txn_id}", response_model=Inventory)
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
        sql = f"UPDATE inventory SET {', '.join(updates)} WHERE txn_id = %s RETURNING txn_id, txn_date, product_id, qty_change, reason, lot, location"
        rows = execute(sql, params, returning=True)
        if not rows:
            raise HTTPException(status_code=404, detail="Inventory transaction not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete("/api/inventory/{txn_id}")
def delete_inventory(txn_id: str, _ok: bool = Depends(check_api_key)):
    try:
        execute("DELETE FROM inventory WHERE txn_id = %s", (txn_id,))
        return {"deleted": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post('/api/import/csv')
def import_csv(file: str = None, entity_type: str = None, data: List[Dict] = None, _ok: bool = Depends(check_api_key)):
    try:
        if not entity_type or not data:
            raise HTTPException(status_code=400, detail="Missing entity_type or data")
        
        entity_type = entity_type.lower()
        imported = 0
        
        if entity_type == 'orders':
            for row in data:
                execute(
                    "INSERT INTO orders (order_id, customer_id, status, due_date) VALUES (%s, %s, %s, %s) ON CONFLICT (order_id) DO NOTHING",
                    (row.get('order_id'), row.get('customer_id'), row.get('status', 'Planned'), row.get('due_date')),
                    returning=False
                )
                imported += 1
        
        elif entity_type == 'products':
            for row in data:
                execute(
                    "INSERT INTO products (product_id, name, unit, std_cost, price, vat_rate) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (product_id) DO NOTHING",
                    (row.get('product_id'), row.get('name'), row.get('unit', 'pcs'), row.get('std_cost', 0), row.get('price', 0), row.get('vat_rate', 23)),
                    returning=False
                )
                imported += 1
        
        elif entity_type == 'customers':
            for row in data:
                execute(
                    "INSERT INTO customers (customer_id, name, nip, address, email) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (customer_id) DO NOTHING",
                    (row.get('customer_id'), row.get('name'), row.get('nip'), row.get('address'), row.get('email')),
                    returning=False
                )
                imported += 1
        
        elif entity_type == 'employees':
            for row in data:
                execute(
                    "INSERT INTO employees (emp_id, name, role, hourly_rate) VALUES (%s, %s, %s, %s) ON CONFLICT (emp_id) DO NOTHING",
                    (row.get('emp_id'), row.get('name'), row.get('role'), row.get('hourly_rate', 0)),
                    returning=False
                )
                imported += 1
        
        elif entity_type == 'timesheets':
            for row in data:
                execute(
                    "INSERT INTO timesheets (emp_id, ts_date, order_id, operation_no, hours, notes) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
                    (row.get('emp_id'), row.get('ts_date'), row.get('order_id'), row.get('operation_no'), row.get('hours'), row.get('notes')),
                    returning=False
                )
                imported += 1
        
        elif entity_type == 'inventory':
            for row in data:
                execute(
                    "INSERT INTO inventory (txn_id, txn_date, product_id, qty_change, reason, lot, location) VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (txn_id) DO NOTHING",
                    (row.get('txn_id'), row.get('txn_date'), row.get('product_id'), row.get('qty_change'), row.get('reason'), row.get('lot'), row.get('location')),
                    returning=False
                )
                imported += 1
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown entity_type: {entity_type}")
        
        return {"imported": imported, "entity_type": entity_type}
    
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post('/api/auth/login')
def auth_login(payload: UserLogin):
    return login_user(payload.email, payload.password)


@app.get('/api/user/profile')
def user_profile(user=Depends(get_current_user)):
    return {k: user[k] for k in ['user_id','email','company_id','is_admin','subscription_plan']}


@app.post('/api/auth/change-password')
def auth_change_password(payload: PasswordChange, user=Depends(get_current_user)):
    return change_password(user['user_id'], payload.old_password, payload.new_password)


@app.post('/api/auth/request-reset')
def auth_request_reset(payload: PasswordResetRequest):
    return request_password_reset(payload.email)


@app.post('/api/auth/reset')
def auth_reset(payload: PasswordReset):
    return reset_password_with_token(payload.token, payload.new_password)


@app.post('/api/admin/users')
def admin_create_user(payload: UserCreateAdmin, _admin=Depends(require_admin)):
    try:
        row = create_user(payload.email, payload.company_id, payload.is_admin, payload.subscription_plan, getattr(payload, 'password', None))
        return row
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get('/api/admin/users')
def admin_list_users(_admin=Depends(require_admin)):
    return list_users()


@app.post('/api/admin/subscription-plans')
def admin_create_plan(payload: SubscriptionPlanCreate, _admin=Depends(require_admin)):
    row = create_plan(payload.plan_id, payload.name, payload.max_orders, payload.max_users, payload.features)
    if not row:
        raise HTTPException(status_code=500, detail='Failed to create plan')
    return row


@app.get('/api/admin/subscription-plans')
def admin_list_plans(_admin=Depends(require_admin)):
    return list_plans()


@app.get('/api/admin/api-keys')
def admin_list_keys(_ok: bool = Depends(check_admin_key)):
    try:
        return auth.list_api_keys()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post('/api/admin/api-keys')
def admin_create_key(payload: Dict[str, str], _ok: bool = Depends(check_admin_key)):
    # payload: {"label": "dev key"}
    label = payload.get("label") if isinstance(payload, dict) else None
    row = auth.create_api_key(label)
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create API key")
    # row includes 'api_key' plaintext to show once
    return row


@app.delete('/api/admin/api-keys/{key_id}')
def admin_delete_key(key_id: int, _ok: bool = Depends(check_admin_key)):
    row = auth.delete_api_key_by_id(key_id)
    if not row:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"deleted": row}


# Admin endpoints for rotation and audit
@app.post('/api/admin/api-keys/{key_id}/rotate')
def admin_rotate_key(key_id: int, _ok: bool = Depends(check_admin_key)):
    try:
        new = auth.rotate_api_key(key_id, by='admin')
        if not new:
            raise HTTPException(status_code=500, detail='Failed to rotate key')
        return new
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get('/api/admin/api-key-audit')
def admin_api_key_audit(_ok: bool = Depends(check_admin_key)):
    try:
        rows = fetch_all('SELECT * FROM api_key_audit ORDER BY event_time DESC LIMIT 100')
        return rows
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.delete('/api/admin/api-key-audit')
def admin_purge_audit(days: int = 30, _ok: bool = Depends(check_admin_key)):
    try:
        from db import _get_pool
        pool = _get_pool()
        if pool is None:
            execute("DELETE FROM api_key_audit WHERE event_time IS NULL OR event_time = '' OR event_time <= datetime('now', ?)", ("-" + str(days) + " days",))
        else:
            execute("DELETE FROM api_key_audit WHERE event_time IS NULL OR event_time <= now() - interval '1 day' * %s", (days,))
        return {"purged": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# --- Error handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation Error",
            "errors": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    # Log unexpected errors
    print(f"Unexpected error at {datetime.now()}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# --- Frontend SPA routing (Railway deployment) ---
FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets", check_dir=True),
        name="assets",
    )

    @app.get("/")
    async def spa_root():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        logger.error(f"Frontend index.html not found at {index_file}")
        raise HTTPException(
            status_code=500,
            detail="Frontend not built. Run: cd frontend && npm run build"
        )

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        logger.error(f"Frontend index.html not found at {index_file}")
        raise HTTPException(
            status_code=500,
            detail="Frontend not built. Run: cd frontend && npm run build"
        )



