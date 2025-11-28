import logging
import time
import uuid
from datetime import datetime
from pathlib import Path
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse, PlainTextResponse
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from db import execute, fetch_one, _get_pool
import auth
from user_mgmt import ensure_user_tables
from logging_utils import setup_logging, logger as app_logger
from config import settings
from docs import tags_metadata
from routers.orders import router as orders_router
from routers.products import router as products_router
from routers.analytics import router as analytics_router
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from routers.customers import router as customers_router
from routers.employees import router as employees_router
from routers.timesheets import router as timesheets_router
from routers.inventory import router as inventory_router


# Initialize logging early
setup_logging()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Synterra API",
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Metrics collection (simple in-memory)
request_metrics = {
    "total_requests": 0,
    "total_errors": 0,
    "requests_by_endpoint": defaultdict(int),
    "errors_by_endpoint": defaultdict(int),
    "rate_limited": 0,
}


# ---- GZIP Compression ----
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ---- CORS ----
origins_list = settings.cors_origins_list()
if origins_list:
    origins = origins_list
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


# ---- Security Headers Middleware ----
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # Add Content-Security-Policy for additional protection
    if not request.url.path.startswith("/api/docs"):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:;"
        )
    return response


# ---- Request ID Middleware ----
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ---- Request logging & metrics middleware ----
@app.middleware("http")
async def log_requests_and_metrics(request: Request, call_next):
    # Skip extremely noisy health checks
    if request.url.path in ("/healthz", "/api/healthz", "/metrics"):
        return await call_next(request)

    start = time.monotonic()
    request_id = getattr(request.state, "request_id", "unknown")

    try:
        response = await call_next(request)
        duration_ms = (time.monotonic() - start) * 1000

        # Update metrics
        request_metrics["total_requests"] += 1
        request_metrics["requests_by_endpoint"][request.url.path] += 1

        if response.status_code >= 400:
            request_metrics["total_errors"] += 1
            request_metrics["errors_by_endpoint"][request.url.path] += 1

        # Structured logging
        app_logger.info(
            f"[{request_id}] {request.method} {request.url.path} -> "
            f"{response.status_code} in {duration_ms:.1f}ms"
        )
        return response
    except Exception as exc:
        duration_ms = (time.monotonic() - start) * 1000
        request_metrics["total_errors"] += 1
        request_metrics["errors_by_endpoint"][request.url.path] += 1
        app_logger.error(
            f"[{request_id}] {request.method} {request.url.path} FAILED "
            f"in {duration_ms:.1f}ms: {exc}"
        )
        raise


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

# Create helpful DB indexes (best-effort)
try:
    from queries import SQL_CREATE_INDEXES

    execute(SQL_CREATE_INDEXES)
except Exception:
    # Non-fatal: sqlite may ignore some clauses
    pass


# ---- HEALTH ----
@app.get("/healthz", tags=["Health"], summary="Liveness probe")
def health():
    return {"ok": True}


# Compatibility route: some proxies forward /api/healthz
@app.get("/api/healthz", tags=["Health"], summary="API liveness probe")
def health_api():
    return health()


@app.get("/readyz", tags=["Health"], summary="Readiness probe (DB + migrations)")
def readyz():
    try:
        pool = _get_pool()
        if pool is None:
            # SQLite: Alembic table may not exist; consider core tables
            try:
                ver = fetch_one("SELECT version_num FROM alembic_version LIMIT 1")
                if ver and ver.get("version_num"):
                    return {
                        "ready": True,
                        "db": "sqlite",
                        "alembic_version": ver.get("version_num"),
                    }
            except Exception:
                pass
            core = fetch_one(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = %s",
                ("timesheets",),
            )
            return {"ready": bool(core), "db": "sqlite", "alembic_version": None}
        else:
            ver = fetch_one(
                "SELECT version_num FROM alembic_version ORDER BY 1 DESC LIMIT 1"
            )
            if ver and ver.get("version_num"):
                return {
                    "ready": True,
                    "db": "postgres",
                    "alembic_version": ver.get("version_num"),
                }
            return {"ready": False, "db": "postgres", "alembic_version": None}
    except Exception as e:
        return JSONResponse(status_code=503, content={"ready": False, "error": str(e)})


@app.get("/metrics", tags=["Monitoring"], summary="Prometheus metrics endpoint")
def metrics():
    """
    Export metrics in Prometheus text format for monitoring.
    Includes: total requests, errors, per-endpoint counters.
    """
    lines = [
        "# HELP http_requests_total Total HTTP requests",
        "# TYPE http_requests_total counter",
        f"http_requests_total {request_metrics['total_requests']}",
        "",
        "# HELP http_errors_total Total HTTP errors (4xx/5xx)",
        "# TYPE http_errors_total counter",
        f"http_errors_total {request_metrics['total_errors']}",
        "",
        "# HELP http_requests_by_endpoint Total requests by endpoint",
        "# TYPE http_requests_by_endpoint counter",
    ]

    for endpoint, count in request_metrics["requests_by_endpoint"].items():
        # Sanitize endpoint for Prometheus label
        safe_endpoint = endpoint.replace('"', '\\"')
        lines.append(f'http_requests_by_endpoint{{endpoint="{safe_endpoint}"}} {count}')

    lines.append("")
    lines.append("# HELP http_errors_by_endpoint Total errors by endpoint")
    lines.append("# TYPE http_errors_by_endpoint counter")

    for endpoint, count in request_metrics["errors_by_endpoint"].items():
        safe_endpoint = endpoint.replace('"', '\\"')
        lines.append(f'http_errors_by_endpoint{{endpoint="{safe_endpoint}"}} {count}')

    return PlainTextResponse("\n".join(lines))


# ---- Include Routers ----
app.include_router(orders_router)
app.include_router(products_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(customers_router)
app.include_router(employees_router)
app.include_router(timesheets_router)
app.include_router(inventory_router)


# ---- Apply Route-Specific Rate Limits ----
# Apply rate limits to sensitive endpoints after routers are included
RATE_LIMITS = {
    "/api/auth/login": "5/minute",
    "/api/auth/request-reset": "3/hour",
    "/api/auth/reset": "5/hour",
    "/api/orders/export": "10/minute",
    "/api/inventory/export": "10/minute",
    "/api/customers/export": "10/minute",
    "/api/admin": "20/minute",  # Admin endpoints
}

try:
    for route in app.routes:
        if not hasattr(route, "path"):
            continue

        path = route.path

        # Apply exact matches
        if path in RATE_LIMITS:
            route.endpoint = limiter.limit(RATE_LIMITS[path])(route.endpoint)
            app_logger.info(f"Applied rate limit to {path}: {RATE_LIMITS[path]}")

        # Apply pattern matches (e.g., /api/admin/*)
        for pattern, limit in RATE_LIMITS.items():
            if pattern.endswith("*") or pattern.endswith("/"):
                prefix = pattern.rstrip("/*")
                if path.startswith(prefix) and path != prefix:
                    route.endpoint = limiter.limit(limit)(route.endpoint)
                    app_logger.info(f"Applied rate limit to {path}: {limit}")
                    break
except Exception as e:
    app_logger.warning(f"Failed to apply route-specific rate limits: {e}")


# --- Error handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            {"detail": "Validation Error", "errors": exc.errors()}
        ),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())
    request_id = getattr(request.state, "request_id", "unknown")

    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "error_id": error_id}
        )

    # Log full details server-side (never expose to client)
    app_logger.error(
        f"Unhandled exception [{error_id}]",
        extra={
            "error_id": error_id,
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "user_agent": request.headers.get("user-agent"),
        },
        exc_info=True
    )

    # Return sanitized error to client
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please contact support.",
            "error_id": error_id
        }
    )


# --- Frontend SPA routing (Railway deployment) ---
FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets", check_dir=True),
        name="assets",
    )

    # Avoid stale index.html after deploy; allow assets to be cached by hash
    NO_CACHE_INDEX_HEADERS = {"Cache-Control": "no-store, max-age=0, must-revalidate"}

    @app.get("/")
    async def spa_root():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(
                index_file,
                headers=NO_CACHE_INDEX_HEADERS,
                media_type="text/html; charset=utf-8",
            )
        app_logger.error(f"Frontend index.html not found at {index_file}")
        raise HTTPException(
            status_code=500,
            detail="Frontend not built. Run: cd frontend && npm run build",
        )

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(
                index_file,
                headers=NO_CACHE_INDEX_HEADERS,
                media_type="text/html; charset=utf-8",
            )
        app_logger.error(f"Frontend index.html not found at {index_file}")
        raise HTTPException(
            status_code=500,
            detail="Frontend not built. Run: cd frontend && npm run build",
        )
