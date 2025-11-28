# Backend Deep Dive Audit Report
**Date:** November 28, 2025  
**System:** Synterra Production Management System  
**Auditor:** Senior Backend Architect

---

## Executive Summary

After a comprehensive code review of the backend infrastructure, I've identified **28 critical issues** across security, performance, scalability, reliability, and code quality domains. This report provides actionable, high-end solutions for each issue.

**Overall Grade: B-** (Good foundation but needs hardening for production scale)

---

## 🔴 CRITICAL ISSUES (Priority 1)

### 1. **Database Connection Pool Exhaustion Risk**

**Issue:**  
- Connection pool size is hardcoded (min=1, max=10)
- No connection timeout handling beyond initial connect
- No connection health checks or recycling
- SQLite fallback lacks proper connection management

**Impact:** High - System can hang under load, connections can leak

**Solution:**
```python
# config.py - Add dynamic pool sizing based on workload
DB_POOL_MIN: int = Field(default=2, ge=1, le=50)
DB_POOL_MAX: int = Field(default=20, ge=2, le=100)
DB_POOL_TIMEOUT: int = Field(default=30, ge=5, le=300)
DB_MAX_OVERFLOW: int = Field(default=10, ge=0, le=50)
DB_POOL_RECYCLE: int = Field(default=3600, ge=300)  # 1 hour

# db.py - Implement connection pooling with health checks
class ConnectionPoolManager:
    def __init__(self):
        self.pool = None
        self.health_check_interval = 60
        self.last_health_check = 0
        
    def get_pool(self):
        if self.pool is None:
            self.pool = self._create_pool()
        
        # Periodic health check
        now = time.time()
        if now - self.last_health_check > self.health_check_interval:
            self._health_check()
            self.last_health_check = now
            
        return self.pool
    
    def _health_check(self):
        """Validate pool connections are alive"""
        try:
            with self.get_connection() as conn:
                conn.execute("SELECT 1")
        except Exception as e:
            logger.error(f"Pool health check failed: {e}")
            self.pool = None  # Force reconnect
    
    def _create_pool(self):
        if PSYCOPG3_POOL:
            return ConnectionPool(
                dsn,
                min_size=settings.DB_POOL_MIN,
                max_size=settings.DB_POOL_MAX,
                max_waiting=settings.DB_MAX_OVERFLOW,
                timeout=settings.DB_POOL_TIMEOUT,
                max_lifetime=settings.DB_POOL_RECYCLE,
                check=ConnectionPool.check_connection
            )
```

---

### 2. **JWT Secret Key Weakness**

**Issue:**  
- JWT secret defaults to runtime-generated random value
- Secret changes on every restart → all tokens invalidated
- No key rotation mechanism
- Tokens don't include issuer/audience claims

**Impact:** Critical - Users logged out on every deploy, no token security depth

**Solution:**
```python
# config.py
JWT_SECRET: str = Field(..., min_length=64)  # Make required, no default
JWT_ALGORITHM: str = "HS256"
JWT_ISSUER: str = "synterra-api"
JWT_AUDIENCE: str = "synterra-web"
JWT_REFRESH_SECRET: Optional[str] = None  # Separate secret for refresh tokens

# user_mgmt.py - Enhanced token generation
def make_token(user_id: str, email: str, is_admin: bool, type: str = "access"):
    exp = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXP_MINUTES if type == "access" else JWT_REFRESH_DAYS * 1440
    )
    
    payload = {
        "sub": user_id,
        "email": email,
        "is_admin": is_admin,
        "type": type,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "exp": exp,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4())  # Unique token ID for revocation
    }
    
    secret = settings.JWT_REFRESH_SECRET if type == "refresh" else settings.JWT_SECRET
    return jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)

# Add token revocation list (Redis-backed)
revoked_tokens = set()  # In production: use Redis SET

def revoke_token(jti: str, exp: int):
    """Add token to revocation list until expiry"""
    if redis_client := get_redis_client():
        ttl = max(0, exp - int(time.time()))
        redis_client.setex(f"revoked:token:{jti}", ttl, "1")
    else:
        revoked_tokens.add(jti)

def is_token_revoked(jti: str) -> bool:
    if redis_client := get_redis_client():
        return redis_client.exists(f"revoked:token:{jti}")
    return jti in revoked_tokens
```

**Deployment:**
- Set `JWT_SECRET` in Railway environment variables (64+ char random string)
- Rotate secrets quarterly with dual-secret validation period

---

### 3. **SQL Injection Vulnerability in Dynamic Queries**

**Issue:**  
- While parameterized queries are used, some endpoint filters build SQL dynamically
- No input sanitization for sort/filter parameters
- Potential for second-order injection via stored data

**Impact:** Critical - Data breach, unauthorized access

**Solution:**
```python
# queries.py - Add query builder with whitelist validation
ALLOWED_ORDER_COLUMNS = {"order_id", "customer_id", "status", "order_date", "due_date"}
ALLOWED_SORT_DIRS = {"ASC", "DESC"}

class SafeQueryBuilder:
    @staticmethod
    def build_order_query(
        filters: dict,
        sort_by: Optional[str] = None,
        sort_dir: str = "DESC",
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[str, List[Any]]:
        """Build safe ORDER query with validated params"""
        
        # Base query
        sql = """
        SELECT order_id, customer_id, status, order_date, due_date, contact_person
        FROM orders
        WHERE 1=1
        """
        params = []
        
        # Validated filters
        if status := filters.get("status"):
            if status in OrderStatus.__members__.values():
                sql += " AND status = %s"
                params.append(status)
        
        if customer_id := filters.get("customer_id"):
            sql += " AND customer_id = %s"
            params.append(customer_id.strip()[:MAX_CUSTOMER_ID_LEN])
        
        if date_from := filters.get("date_from"):
            sql += " AND order_date >= %s"
            params.append(date_from)
        
        if date_to := filters.get("date_to"):
            sql += " AND order_date <= %s"
            params.append(date_to)
        
        # Validated sorting (whitelist only)
        if sort_by and sort_by in ALLOWED_ORDER_COLUMNS:
            direction = "ASC" if sort_dir.upper() == "ASC" else "DESC"
            sql += f" ORDER BY {sort_by} {direction}"
        else:
            sql += " ORDER BY order_date DESC, order_id"
        
        # Validated pagination
        sql += " LIMIT %s OFFSET %s"
        params.extend([min(limit, 1000), max(offset, 0)])
        
        return sql, params

# routers/orders.py - Use safe builder
@router.get("/api/orders", response_model=List[Order])
def orders_list(
    status: Optional[OrderStatus] = None,
    customer_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    sort_by: Optional[str] = Query(None, regex="^(order_id|customer_id|status|order_date|due_date)$"),
    sort_dir: Optional[str] = Query("DESC", regex="^(ASC|DESC)$"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    filters = {
        "status": status,
        "customer_id": customer_id,
        "date_from": date_from,
        "date_to": date_to
    }
    
    sql, params = SafeQueryBuilder.build_order_query(
        filters, sort_by, sort_dir, limit, offset
    )
    
    rows = fetch_all(sql, tuple(params))
    return rows if rows else []
```

---

### 4. **Missing Rate Limiting on Critical Endpoints**

**Issue:**  
- Only login and password reset have rate limits
- No rate limiting on data modification endpoints
- No distributed rate limiting (in-memory only)
- No per-user rate limits (only per-IP)

**Impact:** High - API abuse, DoS attacks, data scraping

**Solution:**
```python
# main.py - Enhanced rate limiting with Redis backend
from slowapi import Limiter
from slowapi.util import get_remote_address

def get_user_or_ip(request: Request):
    """Rate limit by user ID (if authenticated) or IP"""
    try:
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
            payload = decode_token(token)
            return f"user:{payload['sub']}"
    except:
        pass
    return f"ip:{get_remote_address(request)}"

limiter = Limiter(
    key_func=get_user_or_ip,
    storage_uri=os.getenv("REDIS_URL", "memory://"),
    strategy="fixed-window",
    default_limits=["1000/hour", "100/minute"]
)

# Apply tiered rate limits
RATE_LIMITS = {
    "/api/auth/login": "5/minute",
    "/api/auth/request-reset": "3/hour",
    "/api/orders": "100/minute",  # Read
    "/api/orders/{order_id}": "50/minute",  # Write
    "/api/admin/*": "20/minute",  # Admin endpoints
    "/api/*/export": "10/minute",  # CSV exports
}

# Apply programmatically after router registration
for route in app.routes:
    path = getattr(route, "path", None)
    if path:
        for pattern, limit in RATE_LIMITS.items():
            if pattern.endswith("*") and path.startswith(pattern[:-1]):
                route.endpoint = limiter.limit(limit)(route.endpoint)
            elif path == pattern:
                route.endpoint = limiter.limit(limit)(route.endpoint)
```

---

### 5. **Insufficient Error Information Leakage**

**Issue:**  
- Exception handlers expose internal errors to clients
- Database errors returned directly in responses
- Stack traces potentially visible in production
- No error ID tracking for support

**Impact:** Medium-High - Information disclosure, difficult debugging

**Solution:**
```python
# logging_utils.py - Add error tracking
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if SENTRY_DSN := os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment=os.getenv("ENV", "production")
    )

# main.py - Enhanced error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())
    
    # Log full details server-side
    app_logger.error(
        f"Unhandled exception [{error_id}]",
        extra={
            "error_id": error_id,
            "request_id": getattr(request.state, "request_id", "unknown"),
            "path": request.url.path,
            "method": request.method,
            "client_ip": get_remote_address(request)
        },
        exc_info=True
    )
    
    # Return sanitized error to client
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error_id": error_id}
        )
    
    # Generic error for unexpected exceptions
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please contact support with error ID.",
            "error_id": error_id
        }
    )

# Add specific handlers for common errors
@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "errors": exc.errors(),
            "error_id": str(uuid.uuid4())
        }
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    error_id = str(uuid.uuid4())
    app_logger.warning(f"Integrity error [{error_id}]: {exc}")
    
    # Map to user-friendly messages
    if "duplicate key" in str(exc).lower() or "unique" in str(exc).lower():
        detail = "A record with this identifier already exists"
    elif "foreign key" in str(exc).lower():
        detail = "Referenced record not found"
    else:
        detail = "Database constraint violation"
    
    return JSONResponse(
        status_code=409,
        content={"detail": detail, "error_id": error_id}
    )
```

---

## 🟠 HIGH PRIORITY ISSUES (Priority 2)

### 6. **Missing Transaction Management**

**Issue:**  
- No explicit transaction boundaries for multi-step operations
- Order + OrderLines creation not atomic
- Potential for orphaned records

**Solution:**
```python
# db.py - Add transaction context manager
@contextmanager
def transaction():
    """Context manager for explicit transaction control"""
    pool = _get_pool()
    if pool is None:
        # SQLite
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        # Postgres
        with get_conn() as conn:
            try:
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise

# routers/orders.py - Use transactions
@router.post("/api/orders", response_model=Order, status_code=201)
def create_order(payload: OrderCreate, _ok: bool = Depends(check_api_key)):
    with transaction() as conn:
        # Create order
        order_id = payload.order_id or next_order_id()
        
        cursor = conn.cursor()
        cursor.execute(SQL_INSERT_ORDER, (
            order_id, payload.customer_id, payload.status, 
            payload.due_date, payload.contact_person
        ))
        order = cursor.fetchone()
        
        # Create order lines if provided
        if payload.lines:
            for line in payload.lines:
                cursor.execute(SQL_INSERT_ORDER_LINE, (
                    order_id, line.line_no, line.product_id,
                    line.qty, line.unit_price, line.discount_pct
                ))
        
        # Both operations succeed or both fail
        return dict(order)
```

---

### 7. **No Database Migration Strategy**

**Issue:**  
- Alembic is mentioned but migrations aren't tracked in code
- Schema changes require manual SQL
- No rollback capability

**Solution:**
```bash
# Create proper Alembic setup
alembic init alembic

# alembic/env.py - Configure
from db import _get_pool, get_conn

def run_migrations_online():
    pool = _get_pool()
    if pool:
        # Use existing pool
        with get_conn() as conn:
            context.configure(
                connection=conn,
                target_metadata=target_metadata,
                compare_type=True,
                compare_server_default=True
            )
            with context.begin_transaction():
                context.run_migrations()
```

```python
# Create migration for recent changes
"""
# alembic/versions/001_add_order_indexes.py
def upgrade():
    op.create_index('idx_orders_customer', 'orders', ['customer_id'])
    op.create_index('idx_orders_status', 'orders', ['status'])
    op.create_index('idx_orders_date', 'orders', ['order_date'], postgresql_ops={'order_date': 'DESC'})

def downgrade():
    op.drop_index('idx_orders_date', 'orders')
    op.drop_index('idx_orders_status', 'orders')
    op.drop_index('idx_orders_customer', 'orders')
"""
```

---

### 8. **Weak Password Requirements**

**Issue:**  
- Password validator exists but not enforced on all paths
- No password history (users can reuse old passwords)
- No periodic password expiry

**Solution:**
```python
# password_validator.py - Enhanced
MIN_PASSWORD_LENGTH = 12  # Industry standard
MAX_PASSWORD_AGE_DAYS = 90
PASSWORD_HISTORY_COUNT = 5

def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    errors = []
    
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    
    if len(password) > 72:
        errors.append("Password must be at most 72 characters (bcrypt limit)")
    
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain uppercase letter")
    
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain lowercase letter")
    
    if not re.search(r"\d", password):
        errors.append("Password must contain digit")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("Password must contain special character")
    
    # Check against common passwords
    if password.lower() in COMMON_PASSWORDS:
        errors.append("Password is too common")
    
    # Check for sequential patterns
    if has_sequential_pattern(password):
        errors.append("Password contains sequential patterns")
    
    return len(errors) == 0, errors

# user_mgmt.py - Add password history
SQL_CREATE_PASSWORD_HISTORY = """
CREATE TABLE IF NOT EXISTS password_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    password_hash TEXT NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id, changed_at DESC);
"""

def change_password(user_id: str, old_password: str, new_password: str):
    user = fetch_one(SQL_GET_USER_BY_ID, (user_id,))
    if not user:
        raise HTTPException(404, "User not found")
    
    # Verify old password
    if not hasher.verify(old_password, user["password_hash"]):
        raise HTTPException(401, "Current password incorrect")
    
    # Validate new password
    is_valid, errors = validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(400, f"Password requirements not met: {'; '.join(errors)}")
    
    # Check password history
    history = fetch_all(
        "SELECT password_hash FROM password_history WHERE user_id = %s ORDER BY changed_at DESC LIMIT %s",
        (user_id, PASSWORD_HISTORY_COUNT)
    )
    
    new_hash = hasher.hash(new_password)
    for old_record in history:
        if hasher.verify(new_password, old_record["password_hash"]):
            raise HTTPException(400, f"Cannot reuse previous {PASSWORD_HISTORY_COUNT} passwords")
    
    with transaction() as conn:
        # Update password
        conn.execute(SQL_UPDATE_PASSWORD, (new_hash, user_id))
        
        # Store in history
        conn.execute(
            "INSERT INTO password_history (user_id, password_hash) VALUES (%s, %s)",
            (user_id, new_hash)
        )
        
        # Clean old history
        conn.execute(
            """DELETE FROM password_history 
               WHERE user_id = %s 
               AND id NOT IN (
                   SELECT id FROM password_history 
                   WHERE user_id = %s 
                   ORDER BY changed_at DESC 
                   LIMIT %s
               )""",
            (user_id, user_id, PASSWORD_HISTORY_COUNT)
        )
    
    return {"message": "Password changed successfully"}
```

---

### 9. **No API Versioning**

**Issue:**  
- All endpoints at `/api/*` with no version
- Breaking changes will affect all clients
- No deprecation path

**Solution:**
```python
# main.py - Add versioning support
API_VERSION = "v1"

# Version-aware router factory
def create_versioned_router(version: str, *args, **kwargs):
    router = APIRouter(*args, **kwargs)
    router.prefix = f"/api/{version}" + (kwargs.get("prefix", ""))
    return router

# routers/orders.py
router = APIRouter(prefix="/api/v1", tags=["Orders v1"])

# Add version negotiation middleware
@app.middleware("http")
async def version_negotiation(request: Request, call_next):
    # Accept /api/orders and route to latest version
    if request.url.path.startswith("/api/") and not any(
        request.url.path.startswith(f"/api/v{i}") for i in range(1, 10)
    ):
        # Rewrite to latest version
        request.scope["path"] = request.url.path.replace("/api/", f"/api/{API_VERSION}/", 1)
        
        # Add deprecation header
        response = await call_next(request)
        response.headers["X-API-Deprecation"] = (
            "Unversioned endpoints deprecated. Use /api/v1/* instead."
        )
        return response
    
    return await call_next(request)

# Add /api/version endpoint
@app.get("/api/version")
def api_version():
    return {
        "current": API_VERSION,
        "supported": ["v1"],
        "deprecated": [],
        "sunset": {}
    }
```

---

### 10. **Missing Request Validation & Sanitization**

**Issue:**  
- Pydantic validation present but not comprehensive
- No output sanitization for XSS in responses
- File upload endpoints lack validation

**Solution:**
```python
# schemas.py - Enhanced validation
from pydantic import field_validator, model_validator
import bleach

class OrderCreate(BaseModel):
    order_id: Optional[str] = Field(None, min_length=1, max_length=MAX_ORDER_ID_LEN)
    customer_id: str = Field(..., min_length=1, max_length=MAX_CUSTOMER_ID_LEN)
    status: OrderStatus = OrderStatus.New
    due_date: Optional[date] = None
    contact_person: Optional[str] = Field(None, max_length=MAX_CONTACT_PERSON_LEN)
    
    @field_validator("order_id", "customer_id", "contact_person", mode="before")
    def sanitize_strings(cls, value):
        if value is None:
            return value
        # Strip whitespace
        value = str(value).strip()
        # Remove control characters
        value = "".join(char for char in value if ord(char) >= 32 or char in "\n\r\t")
        # Escape HTML
        value = bleach.clean(value, tags=[], strip=True)
        return value
    
    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_date and self.due_date < date.today():
            raise ValueError("Due date cannot be in the past")
        return self

# Add file upload validation
from fastapi import UploadFile, File
import magic  # python-magic library

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = {"text/csv", "application/vnd.ms-excel"}

async def validate_upload(file: UploadFile) -> bytes:
    """Validate and read uploaded file"""
    # Check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large. Max size: {MAX_FILE_SIZE} bytes")
    
    # Check MIME type
    mime = magic.from_buffer(content, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"Invalid file type. Allowed: {ALLOWED_MIME_TYPES}")
    
    # Scan for malicious content (CSV injection)
    if mime == "text/csv":
        text = content.decode("utf-8", errors="ignore")
        if any(text.startswith(prefix) for prefix in ["=", "+", "-", "@"]):
            raise HTTPException(400, "CSV file contains potentially malicious formulas")
    
    return content
```

---

## 🟡 MEDIUM PRIORITY ISSUES (Priority 3)

### 11. **Inefficient Query Patterns**

**Issue:**  
- N+1 queries in order details endpoint
- No query result caching
- Missing database indexes on foreign keys

**Solution:**
```python
# queries.py - Add JOIN queries to avoid N+1
SQL_ORDER_WITH_LINES = """
SELECT 
    o.order_id, o.customer_id, o.status, o.order_date, o.due_date, o.contact_person,
    c.name as customer_name, c.email as customer_email,
    ol.line_no, ol.product_id, ol.qty, ol.unit_price, ol.discount_pct,
    p.name as product_name, p.unit as product_unit
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_lines ol ON o.order_id = ol.order_id
LEFT JOIN products p ON ol.product_id = p.product_id
WHERE o.order_id = %s
ORDER BY ol.line_no;
"""

# routers/orders.py - Use efficient query
@router.get("/api/v1/orders/{order_id}", response_model=OrderDetail)
def order_detail(order_id: str):
    rows = fetch_all(SQL_ORDER_WITH_LINES, (order_id,))
    if not rows:
        raise HTTPException(404, "Order not found")
    
    # Group lines by order
    order = dict(rows[0])
    order["lines"] = [
        {
            "line_no": row["line_no"],
            "product_id": row["product_id"],
            "product_name": row["product_name"],
            "qty": row["qty"],
            "unit_price": row["unit_price"],
            "discount_pct": row["discount_pct"]
        }
        for row in rows if row["line_no"]
    ]
    
    return order

# Add caching for frequently accessed data
from cache import cache

@cache(ttl=300, key_prefix="product:")
def get_product(product_id: str):
    return fetch_one("SELECT * FROM products WHERE product_id = %s", (product_id,))

@cache(ttl=600, key_prefix="customer:")
def get_customer(customer_id: str):
    return fetch_one("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
```

---

### 12. **No Audit Trail for Data Changes**

**Issue:**  
- Only API key usage is audited
- No tracking of data modifications (WHO changed WHAT WHEN)
- No change history for debugging

**Solution:**
```python
# Create audit system
SQL_CREATE_AUDIT_LOG = """
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
"""

# audit.py - Audit logging service
from contextlib import contextmanager
from typing import Optional, Dict, Any
import json

class AuditLogger:
    @staticmethod
    def log(
        entity_type: str,
        entity_id: str,
        action: str,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        changes: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        execute(
            """
            INSERT INTO audit_log (
                entity_type, entity_id, action, user_id, user_email, 
                changes, ip_address, user_agent
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                entity_type, entity_id, action, user_id, user_email,
                json.dumps(changes) if changes else None,
                ip_address, user_agent
            )
        )
    
    @staticmethod
    def get_history(entity_type: str, entity_id: str, limit: int = 50):
        return fetch_all(
            """
            SELECT * FROM audit_log 
            WHERE entity_type = %s AND entity_id = %s
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (entity_type, entity_id, limit)
        )

# Add audit dependency
def audit_context(request: Request, user = Depends(get_current_user)):
    return {
        "user_id": user.get("user_id"),
        "user_email": user.get("email"),
        "ip_address": get_remote_address(request),
        "user_agent": request.headers.get("user-agent")
    }

# Use in endpoints
@router.put("/api/v1/orders/{order_id}")
def update_order(
    order_id: str, 
    payload: OrderUpdate,
    audit: dict = Depends(audit_context)
):
    old_order = fetch_one(SQL_FIND_ORDER, (order_id,))
    if not old_order:
        raise HTTPException(404, "Order not found")
    
    # Update order
    execute(SQL_UPDATE_ORDER, (...))
    
    # Log change
    new_order = fetch_one(SQL_FIND_ORDER, (order_id,))
    changes = {
        k: {"old": old_order.get(k), "new": new_order.get(k)}
        for k in payload.model_dump(exclude_unset=True).keys()
        if old_order.get(k) != new_order.get(k)
    }
    
    AuditLogger.log(
        entity_type="order",
        entity_id=order_id,
        action="update",
        changes=changes,
        **audit
    )
    
    return new_order
```

---

### 13. **Missing Health Check Depth**

**Issue:**  
- `/healthz` only checks if server responds
- `/readyz` only checks DB connection
- No dependency health checks (Redis, external APIs)

**Solution:**
```python
# health.py - Comprehensive health checks
from dataclasses import dataclass
from typing import List, Dict
import time

@dataclass
class HealthCheck:
    name: str
    status: str  # "healthy", "degraded", "unhealthy"
    latency_ms: float
    message: str = ""

class HealthMonitor:
    @staticmethod
    async def check_database() -> HealthCheck:
        start = time.monotonic()
        try:
            result = fetch_one("SELECT 1 as alive")
            latency = (time.monotonic() - start) * 1000
            
            if latency > 1000:  # >1s is slow
                return HealthCheck("database", "degraded", latency, "Slow response")
            
            return HealthCheck("database", "healthy", latency)
        except Exception as e:
            latency = (time.monotonic() - start) * 1000
            return HealthCheck("database", "unhealthy", latency, str(e))
    
    @staticmethod
    async def check_redis() -> HealthCheck:
        start = time.monotonic()
        try:
            client = get_redis_client()
            if not client:
                return HealthCheck("redis", "degraded", 0, "Not configured")
            
            client.ping()
            latency = (time.monotonic() - start) * 1000
            return HealthCheck("redis", "healthy", latency)
        except Exception as e:
            latency = (time.monotonic() - start) * 1000
            return HealthCheck("redis", "degraded", latency, str(e))
    
    @staticmethod
    async def check_disk_space() -> HealthCheck:
        import shutil
        try:
            usage = shutil.disk_usage("/")
            percent_used = (usage.used / usage.total) * 100
            
            if percent_used > 90:
                return HealthCheck("disk", "unhealthy", 0, f"{percent_used:.1f}% used")
            elif percent_used > 80:
                return HealthCheck("disk", "degraded", 0, f"{percent_used:.1f}% used")
            
            return HealthCheck("disk", "healthy", 0, f"{percent_used:.1f}% used")
        except Exception as e:
            return HealthCheck("disk", "unhealthy", 0, str(e))

# main.py - Enhanced health endpoints
@app.get("/health/live")
def health_live():
    """Kubernetes liveness probe - just check if process is alive"""
    return {"status": "alive"}

@app.get("/health/ready")
async def health_ready():
    """Kubernetes readiness probe - check all dependencies"""
    checks = await asyncio.gather(
        HealthMonitor.check_database(),
        HealthMonitor.check_redis(),
        HealthMonitor.check_disk_space()
    )
    
    overall_status = "healthy"
    if any(c.status == "unhealthy" for c in checks):
        overall_status = "unhealthy"
    elif any(c.status == "degraded" for c in checks):
        overall_status = "degraded"
    
    response = {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {c.name: c.__dict__ for c in checks}
    }
    
    status_code = 200 if overall_status == "healthy" else 503
    return JSONResponse(response, status_code=status_code)
```

---

### 14. **Inadequate Logging**

**Issue:**  
- No structured logging (JSON format)
- Missing correlation IDs across microservices
- No log aggregation setup
- Sensitive data potentially logged

**Solution:**
```python
# logging_utils.py - Enhanced structured logging
import logging
import json
from pythonjsonlogger import jsonlogger

class SensitiveDataFilter(logging.Filter):
    """Filter out sensitive data from logs"""
    SENSITIVE_KEYS = {"password", "api_key", "token", "secret", "authorization"}
    
    def filter(self, record):
        if hasattr(record, "args") and isinstance(record.args, dict):
            record.args = self._redact_dict(record.args)
        if hasattr(record, "msg") and isinstance(record.msg, dict):
            record.msg = self._redact_dict(record.msg)
        return True
    
    def _redact_dict(self, d):
        return {
            k: "***REDACTED***" if k.lower() in self.SENSITIVE_KEYS else v
            for k, v in d.items()
        }

def setup_logging():
    log_level = os.getenv("LOG_LEVEL", "INFO")
    
    # JSON formatter for production
    formatter = jsonlogger.JsonFormatter(
        "%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s %(user_id)s",
        rename_fields={"levelname": "level", "asctime": "timestamp"}
    )
    
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    handler.addFilter(SensitiveDataFilter())
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)
    
    # App logger with context
    app_logger = logging.getLogger("synterra")
    
    return app_logger

# middleware to inject context
@app.middleware("http")
async def inject_log_context(request: Request, call_next):
    # Add context to all logs in this request
    log_context = {
        "request_id": getattr(request.state, "request_id", "unknown"),
        "user_id": None,
        "correlation_id": request.headers.get("x-correlation-id")
    }
    
    # Extract user from JWT if present
    try:
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
            payload = decode_token(token)
            log_context["user_id"] = payload.get("sub")
    except:
        pass
    
    # Inject into logging context
    with logging.LoggerAdapter(app_logger, log_context) as adapter:
        request.state.logger = adapter
        response = await call_next(request)
    
    return response
```

---

### 15. **No Graceful Shutdown**

**Issue:**  
- Server terminates immediately on SIGTERM
- In-flight requests may be dropped
- Database connections not cleanly closed

**Solution:**
```python
# main.py - Add graceful shutdown
import signal
import asyncio

shutdown_event = asyncio.Event()
active_requests = 0
shutdown_timeout = 30  # seconds

@app.middleware("http")
async def track_active_requests(request: Request, call_next):
    global active_requests
    active_requests += 1
    try:
        response = await call_next(request)
        return response
    finally:
        active_requests -= 1

def handle_shutdown_signal(signum, frame):
    """Handle graceful shutdown signals"""
    app_logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_event.set()

# Register signal handlers
signal.signal(signal.SIGTERM, handle_shutdown_signal)
signal.signal(signal.SIGINT, handle_shutdown_signal)

@app.on_event("shutdown")
async def shutdown():
    """Graceful shutdown handler"""
    app_logger.info("Starting graceful shutdown...")
    
    # Stop accepting new requests (handled by reverse proxy)
    
    # Wait for active requests to complete
    start = time.monotonic()
    while active_requests > 0 and (time.monotonic() - start) < shutdown_timeout:
        app_logger.info(f"Waiting for {active_requests} active requests to complete...")
        await asyncio.sleep(1)
    
    if active_requests > 0:
        app_logger.warning(f"Forcing shutdown with {active_requests} active requests")
    
    # Close database connections
    pool = _get_pool()
    if pool and hasattr(pool, "close"):
        pool.close()
        app_logger.info("Database connection pool closed")
    
    # Close Redis connections
    if redis_client := get_redis_client():
        redis_client.close()
        app_logger.info("Redis connection closed")
    
    app_logger.info("Graceful shutdown complete")
```

---

## 🟢 LOW PRIORITY / ENHANCEMENTS (Priority 4)

### 16. **Missing API Documentation Examples**

Add comprehensive OpenAPI examples to all endpoints.

### 17. **No Request/Response Compression**

GZip is enabled but not optimally configured for JSON APIs.

### 18. **Inefficient CSV Export**

Loads entire dataset into memory before streaming.

### 19. **Missing Batch Operations**

No bulk insert/update/delete endpoints.

### 20. **No Webhook Support**

No way to notify external systems of events.

### 21. **Missing Feature Flags**

No way to toggle features without deployment.

### 22. **No A/B Testing Support**

No infrastructure for testing new features.

### 23. **Inadequate Monitoring**

Prometheus metrics exist but lack business metrics (orders/hour, revenue, etc).

### 24. **No Circuit Breaker Pattern**

External service failures can cascade.

### 25. **Missing Request Deduplication**

Duplicate POST requests create duplicate records.

### 26. **No Background Task Queue**

Long-running operations block HTTP requests.

### 27. **Missing Data Export Scheduling**

Users can't schedule recurring exports.

### 28. **No Multi-Tenancy Support**

Company isolation relies on application logic only.

---

## 📊 Performance Benchmarks

Recommended load testing with:
```bash
# Install k6
brew install k6

# Run load test
k6 run --vus 100 --duration 30s load-test.js
```

**Expected Results (Railway production):**
- `/api/orders` list: < 200ms p95, > 100 req/s
- `/api/orders/{id}` get: < 100ms p95, > 200 req/s
- `/api/orders` create: < 500ms p95, > 50 req/s
- `/healthz`: < 10ms p95, > 1000 req/s

---

## 🔧 Implementation Roadmap

### Phase 1 (Week 1) - Critical Security
- [ ] Fix JWT secret management
- [ ] Implement transaction management
- [ ] Add comprehensive input validation
- [ ] Enhance error handling with Sentry

### Phase 2 (Week 2) - Reliability
- [ ] Database connection pool improvements
- [ ] Add rate limiting to all endpoints
- [ ] Implement graceful shutdown
- [ ] Add database migrations

### Phase 3 (Week 3) - Performance
- [ ] Query optimization & caching
- [ ] Add missing indexes
- [ ] Implement background task queue
- [ ] Optimize CSV exports

### Phase 4 (Week 4) - Observability
- [ ] Enhanced health checks
- [ ] Structured logging with correlation IDs
- [ ] Add audit trail
- [ ] Business metrics in Prometheus

---

## 🎯 Quick Wins (Can Implement Today)

1. **Add `JWT_SECRET` to Railway env** (5 min)
2. **Apply rate limits to all endpoints** (30 min)
3. **Add transaction wrapper to order creation** (1 hour)
4. **Enhance error messages** (30 min)
5. **Add missing database indexes** (15 min)

---

## 📚 Recommended Reading

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Twelve-Factor App](https://12factor.net/)
- [PostgreSQL Performance Optimization](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)

---

**END OF REPORT**

For implementation assistance or clarification on any issue, please reference the issue number (1-28) in your request.

