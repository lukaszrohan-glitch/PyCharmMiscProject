import os
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware

from db import fetch_all, fetch_one, execute
from schemas import (
    Order, Finance,
    OrderCreate, OrderLineCreate, TimesheetCreate, InventoryCreate,
    UserLogin, PasswordChange, UserCreateAdmin, SubscriptionPlanCreate
)
from queries import (
    SQL_ORDERS, SQL_FINANCE_ONE, SQL_SHORTAGES, SQL_PLANNED_ONE,
    SQL_INSERT_ORDER, SQL_INSERT_ORDER_LINE, SQL_INSERT_TIMESHEET, SQL_INSERT_INVENTORY,
    SQL_PRODUCTS, SQL_CUSTOMERS
)
import auth
from auth import log_api_key_event, mark_last_used
from user_mgmt import ensure_user_tables, login_user, create_user, list_users, change_password, create_plan, list_plans, get_current_user, require_admin

app = FastAPI(title="SMB Tool API", version="1.0")

# ---- CORS ----
# Allow configured origins, or use regex pattern to allow any host on common dev ports
origins_env = os.getenv("CORS_ORIGINS", "")
if origins_env:
    origins = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    # If no specific origins set, allow all (for development/internal network use)
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- API key auth ----
API_KEYS = [k.strip() for k in os.getenv("API_KEYS", "").split(",") if k.strip()]


# modify check_api_key to log usage
def check_api_key(x_api_key: Optional[str] = Header(None), api_key: Optional[str] = None):
    key = x_api_key or api_key

    # If no API keys are configured at all, allow access (demo/dev mode)
    if not API_KEYS:
        # Check if there are any DB keys
        try:
            db_keys = auth.list_api_keys()
            if not db_keys:
                # No keys configured anywhere - allow access for easy onboarding
                return True
        except Exception:
            # DB issue - if no env keys, allow access
            return True

    if not key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    # First, check static env-configured keys
    if API_KEYS and key in API_KEYS:
        return True

    # Next, check DB-backed api_keys
    try:
        row = auth.get_api_key(key)
        if row:
            # mark last used and log audit
            try:
                if row.get('id'):
                    mark_last_used(row.get('id'))
                    log_api_key_event(row.get('id'), 'used', 'api')
            except Exception:
                pass
            return True
    except Exception:
        # if DB unreachable, fall back to env-only behavior
        pass

    raise HTTPException(status_code=401, detail="Invalid or missing API key")


ADMIN_KEY = os.getenv("ADMIN_KEY")


def check_admin_key(x_admin_key: Optional[str] = Header(None)):
    admin_key = os.getenv("ADMIN_KEY")
    if not admin_key:
        # admin key not configured; deny access to admin endpoints in production unless set
        raise HTTPException(status_code=401, detail="Admin key not configured")
    if x_admin_key != admin_key:
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


# ---- READ ENDPOINTS ----
@app.get("/api/orders", response_model=List[Order])
def orders_list():
    try:
        return fetch_all(SQL_ORDERS)
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


@app.get("/api/products")
def products_list():
    try:
        return fetch_all(SQL_PRODUCTS)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/customers")
def customers_list():
    try:
        return fetch_all(SQL_CUSTOMERS)
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


@app.post('/api/auth/login')
def auth_login(payload: UserLogin):
    return login_user(payload.email, payload.password)


@app.get('/api/user/profile')
def user_profile(user=Depends(get_current_user)):
    return {k: user[k] for k in ['user_id','email','company_id','is_admin','subscription_plan']}


@app.post('/api/auth/change-password')
def auth_change_password(payload: PasswordChange, user=Depends(get_current_user)):
    return change_password(user['user_id'], payload.old_password, payload.new_password)


@app.post('/api/admin/users')
def admin_create_user(payload: UserCreateAdmin, _admin=Depends(require_admin)):
    try:
        row = create_user(payload.email, payload.company_id, payload.is_admin, payload.subscription_plan)
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
        import db as _db
        pool = getattr(_db, '_get_pool')()
        if pool is None:
            # sqlite: delete older than or equal to N days and any rows missing event_time
            execute("DELETE FROM api_key_audit WHERE event_time IS NULL OR event_time = '' OR event_time <= datetime('now', ?)", ("-" + str(days) + " days",))
        else:
            # Postgres: delete older than or equal to N days and rows missing event_time
            execute("DELETE FROM api_key_audit WHERE event_time IS NULL OR event_time <= now() - interval '1 day' * %s", (days,))
        return {"purged": True}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

