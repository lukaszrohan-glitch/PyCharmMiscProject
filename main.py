import logging
import time
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger(__name__)

from db import execute, fetch_one, _get_pool
import auth
from user_mgmt import ensure_user_tables
from logging_utils import setup_logging
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

app = FastAPI(title="SMB Tool API", version="1.0", openapi_tags=tags_metadata)


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


# ---- Request logging middleware ----
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Skip extremely noisy health checks
    if request.url.path in ("/healthz", "/api/healthz"):
        return await call_next(request)
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = (time.monotonic() - start) * 1000
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} in {duration_ms:.1f}ms")
    return response


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
                    return {"ready": True, "db": "sqlite", "alembic_version": ver.get("version_num")}
            except Exception:
                pass
            core = fetch_one("SELECT name FROM sqlite_master WHERE type = 'table' AND name = %s", ("timesheets",))
            return {"ready": bool(core), "db": "sqlite", "alembic_version": None}
        else:
            ver = fetch_one("SELECT version_num FROM alembic_version ORDER BY 1 DESC LIMIT 1")
            if ver and ver.get("version_num"):
                return {"ready": True, "db": "postgres", "alembic_version": ver.get("version_num")}
            return {"ready": False, "db": "postgres", "alembic_version": None}
    except Exception as e:
        return JSONResponse(status_code=503, content={"ready": False, "error": str(e)})


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


# --- Error handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": "Validation Error", "errors": exc.errors()}),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    # Log unexpected errors
    print(f"Unexpected error at {datetime.now()}: {str(exc)}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


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
            detail="Frontend not built. Run: cd frontend && npm run build",
        )

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        logger.error(f"Frontend index.html not found at {index_file}")
        raise HTTPException(
            status_code=500,
            detail="Frontend not built. Run: cd frontend && npm run build",
        )
