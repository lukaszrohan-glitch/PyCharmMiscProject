import os
from decimal import Decimal
from contextlib import contextmanager
from typing import Optional, Tuple, Iterator, Any, List
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import TYPE_CHECKING
from config import settings

# Optional Postgres drivers (prefer psycopg v3; fallback to psycopg2 if present)
PSYCOPG3_AVAILABLE = False
PSYCOPG3_POOL = False
PSYCOPG2_AVAILABLE = False
try:
    import psycopg  # type: ignore
    from psycopg.rows import dict_row  # type: ignore

    try:
        from psycopg_pool import ConnectionPool  # type: ignore

        PSYCOPG3_POOL = True
    except Exception:
        PSYCOPG3_POOL = False
    PSYCOPG3_AVAILABLE = True
except Exception:
    try:
        import psycopg2  # type: ignore
        from psycopg2.pool import SimpleConnectionPool  # type: ignore
        from psycopg2.extras import RealDictCursor  # type: ignore

        PSYCOPG2_AVAILABLE = True
    except Exception:
        pass

# sqlite fallback
import sqlite3

MINCONN = settings.DB_POOL_MIN
MAXCONN = settings.DB_POOL_MAX
DATABASE_URL = settings.DATABASE_URL
PG_SSLMODE = settings.PG_SSLMODE

POOL = None  # type: ignore  # For PG: psycopg3 pool / DSN / psycopg2 pool; for sqlite: None

SQLITE_INIT_DONE = False
SQLITE_DB_PATH = os.path.join(os.getcwd(), "_dev_db.sqlite")


def reset_sqlite_init():
    """Reset the sqlite init flag, used for testing."""
    global SQLITE_INIT_DONE
    SQLITE_INIT_DONE = False


def _append_sslmode_to_url(dsn: str, sslmode: str) -> str:
    if not sslmode:
        return dsn
    parsed = urlparse(dsn)
    q = parse_qs(parsed.query)
    if "sslmode" in q:
        return dsn
    q["sslmode"] = sslmode
    new_query = urlencode(q, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


def _create_pool() -> Any:
    # Test/dev override: force sqlite path regardless of DATABASE_URL
    if os.getenv("FORCE_SQLITE") == "1":
        return None
    # If DATABASE_URL or PG_* configured, require psycopg2/psycopg
    if (
        DATABASE_URL
        or os.getenv("PG_HOST")
        or os.getenv("PG_DB")
        or os.getenv("PG_USER")
    ):
        dsn = DATABASE_URL

        if not dsn:
            raise RuntimeError(
                "DATABASE_URL is empty but PG_* environment variables are set. Please set DATABASE_URL."
            )

        if PG_SSLMODE and "sslmode=" not in dsn:
            dsn = _append_sslmode_to_url(dsn, PG_SSLMODE)
        elif "sslmode=" not in dsn:
            dsn = _append_sslmode_to_url(dsn, "require")

        connect_timeout = settings.DB_CONNECT_TIMEOUT
        dsn_with_timeout = (
            f"{dsn}?connect_timeout={connect_timeout}"
            if "?" not in dsn
            else f"{dsn}&connect_timeout={connect_timeout}"
        )

        if PSYCOPG3_AVAILABLE:
            # psycopg v3: prefer pool when available, else return DSN to connect per-use
            if PSYCOPG3_POOL:
                return ConnectionPool(
                    dsn_with_timeout, min_size=MINCONN, max_size=MAXCONN
                )
            return {"driver": "psycopg3", "dsn": dsn_with_timeout}
        if PSYCOPG2_AVAILABLE:
            return SimpleConnectionPool(MINCONN, MAXCONN, dsn=dsn_with_timeout)
        raise RuntimeError(
            "No Postgres driver available. Install psycopg[binary] or psycopg2-binary."
        )

    return None


def _get_pool() -> Any:
    global POOL
    if POOL is None:
        try:
            POOL = _create_pool()
        except Exception as exc:
            raise RuntimeError(
                "Failed to initialize DB connection pool: %s" % exc
            ) from exc
    return POOL


@contextmanager
def transaction():
    """
    Context manager for explicit transaction control.
    Use this for multi-step operations that must be atomic.

    Example:
        with transaction() as conn:
            conn.execute("INSERT ...")
            conn.execute("UPDATE ...")
            # Both succeed or both rollback
    """
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
        if (
            PSYCOPG3_AVAILABLE
            and isinstance(pool, dict)
            and pool.get("driver") == "psycopg3"
        ):
            conn = psycopg.connect(pool.get("dsn"))  # type: ignore
            try:
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()
        elif PSYCOPG3_AVAILABLE and hasattr(pool, "connection"):
            with pool.connection() as conn:
                try:
                    yield conn
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise
        else:
            # psycopg2
            conn = pool.getconn()
            try:
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                pool.putconn(conn)


@contextmanager
def get_conn() -> Iterator[Any]:
    """Yield a DB connection. For Postgres returns a psycopg/psycopg2 connection from pool.
    For sqlite fallback returns a sqlite3.Connection object.
    """
    pool = _get_pool()
    if pool is None:
        # sqlite fallback: ensure DB file and basic schema
        global SQLITE_INIT_DONE
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            if not SQLITE_INIT_DONE:
                _init_sqlite_schema(conn)
                SQLITE_INIT_DONE = True
            yield conn
        finally:
            conn.close()
    else:
        # Postgres
        if (
            PSYCOPG3_AVAILABLE
            and isinstance(pool, dict)
            and pool.get("driver") == "psycopg3"
        ):
            # No pool available: connect on demand
            conn = psycopg.connect(pool.get("dsn"))  # type: ignore
            try:
                yield conn
            finally:
                conn.close()
        elif PSYCOPG3_AVAILABLE and hasattr(pool, "connection"):
            # psycopg3 ConnectionPool
            with pool.connection() as conn:
                yield conn
        else:
            # psycopg2 SimpleConnectionPool
            conn = pool.getconn()
            try:
                yield conn
            finally:
                pool.putconn(conn)


def _init_sqlite_schema(conn: sqlite3.Connection):
    """Create minimal tables needed for dev server to respond with sample data.
    We won't fully implement all Postgres types; keep it simple.
    """
    cur = conn.cursor()
    # Create customers, products, orders, order_lines, employees, timesheets, inventory, api_keys, api_key_audit, admin_audit
    cur.executescript(
        """
    CREATE TABLE IF NOT EXISTS customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nip TEXT,
      address TEXT,
      email TEXT,
      contact_person TEXT,
      payment_terms_days INTEGER NOT NULL DEFAULT 14,
      active BOOLEAN NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS products (
      product_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'pcs',
      std_cost REAL NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 23,
      make_or_buy TEXT NOT NULL DEFAULT 'Make'
    );
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      order_date DATE NOT NULL DEFAULT CURRENT_DATE,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Planned',
      due_date DATE,
      contact_person TEXT
    );
    CREATE TABLE IF NOT EXISTS order_lines (
      order_id TEXT,
      line_no INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount_pct REAL NOT NULL DEFAULT 0,
      graphic_id TEXT,
      PRIMARY KEY (order_id, line_no)
    );
    CREATE TABLE IF NOT EXISTS employees (
      emp_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      hourly_rate REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS timesheets (
      ts_id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_id TEXT NOT NULL,
      ts_date DATE NOT NULL DEFAULT CURRENT_DATE,
      order_id TEXT,
      operation_no INTEGER,
      hours REAL NOT NULL,
      notes TEXT,
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      approved_by TEXT,
      approved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS inventory (
      txn_id TEXT PRIMARY KEY,
      txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
      product_id TEXT NOT NULL,
      qty_change REAL NOT NULL,
      reason TEXT NOT NULL,
      lot TEXT,
      location TEXT
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_text TEXT,
      key_hash TEXT,
      salt TEXT,
      label TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      active INTEGER NOT NULL DEFAULT 1,
      last_used TEXT
    );
    CREATE TABLE IF NOT EXISTS api_key_audit (
      audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id INTEGER,
      event_type TEXT NOT NULL,
      event_by TEXT,
      event_time TEXT,
      details TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_audit (
      audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_by TEXT,
      event_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      company_id TEXT,
      password_hash TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      subscription_plan TEXT DEFAULT 'free',
      failed_login_attempts INTEGER DEFAULT 0,
      last_failed_login TEXT,
      password_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS subscription_plans (
      plan_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      max_orders INTEGER,
      max_users INTEGER,
      features TEXT
    );
    """
    )
    # Insert minimal seed data if missing
    cur.execute(
        "INSERT OR IGNORE INTO customers(customer_id, name, nip, address, email) VALUES (?,?,?,?,?)",
        ("CUST-ALFA", "Alfa Sp. z o.o.", "1234567890", "Warszawa", "biuro@alfa.pl"),
    )
    cur.execute(
        "INSERT OR IGNORE INTO products(product_id, name, std_cost, price) VALUES (?,?,?,?)",
        ("P-100", "Gadzet A", 10, 30),
    )
    cur.execute(
        "INSERT OR IGNORE INTO products(product_id, name, std_cost, price) VALUES (?,?,?,?)",
        ("P-101", "Komponent X", 2, 5),
    )
    cur.execute(
        "INSERT OR IGNORE INTO employees(emp_id, name, role, hourly_rate) VALUES (?,?,?,?)",
        ("E-01", "Jan Kowalski", "Operator", 45.00),
    )
    cur.execute(
        "INSERT OR IGNORE INTO orders(order_id, order_date, customer_id, status, due_date) VALUES (?,?,?,?,?)",
        ("ORD-0001", None, "CUST-ALFA", "Planned", None),
    )
    cur.execute(
        "INSERT OR IGNORE INTO order_lines(order_id, line_no, product_id, qty, unit_price, discount_pct) VALUES (?,?,?,?,?,?)",
        ("ORD-0001", 1, "P-100", 50, 30, 0.05),
    )
    cur.execute(
        "INSERT OR IGNORE INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES (?,?,?,?,?)",
        ("TXN-PO-1", None, "P-101", 500, "PO"),
    )
    conn.commit()

    cur.executescript(
        """
    CREATE VIEW IF NOT EXISTS v_order_finance AS
    SELECT
      o.order_id,
      o.customer_id,
      o.order_date,
      COALESCE(SUM(ol.qty * ol.unit_price * (1 - ol.discount_pct)), 0) AS revenue,
      COALESCE(SUM(ol.qty * p.std_cost), 0) AS material_cost,
      COALESCE(
        (SELECT SUM(t.hours * e.hourly_rate)
         FROM timesheets t
         JOIN employees e ON t.emp_id = e.emp_id
         WHERE t.order_id = o.order_id),
        0
      ) AS labor_cost,
      COALESCE(SUM(ol.qty * ol.unit_price * (1 - ol.discount_pct)), 0)
      - COALESCE(SUM(ol.qty * p.std_cost), 0)
      - COALESCE(
        (SELECT SUM(t.hours * e.hourly_rate)
         FROM timesheets t
         JOIN employees e ON t.emp_id = e.emp_id
         WHERE t.order_id = o.order_id),
        0
      ) AS gross_margin,
      datetime('now') AS last_updated
    FROM orders o
    LEFT JOIN order_lines ol ON o.order_id = ol.order_id
    LEFT JOIN products p ON ol.product_id = p.product_id
    GROUP BY o.order_id, o.customer_id, o.order_date;
    """
    )
    cur.executescript(
        """
    CREATE VIEW IF NOT EXISTS v_shortages AS
    SELECT
      ol.order_id,
      ol.product_id AS component_id,
      ol.qty AS required_qty,
      COALESCE(
        (SELECT SUM(i.qty_change) FROM inventory i WHERE i.product_id = ol.product_id),
        0
      ) AS qty_on_hand,
      CASE
        WHEN COALESCE(
          (SELECT SUM(i.qty_change) FROM inventory i WHERE i.product_id = ol.product_id),
          0
        ) < ol.qty
        THEN ol.qty - COALESCE(
          (SELECT SUM(i.qty_change) FROM inventory i WHERE i.product_id = ol.product_id),
          0
        )
        ELSE 0
      END AS shortage_qty
    FROM order_lines ol;
    """
    )
    cur.executescript(
        """
    CREATE VIEW IF NOT EXISTS v_planned_time AS
    SELECT
      o.order_id,
      COALESCE(SUM(ol.qty) * 0.1, 0) AS planned_hours,
      COALESCE(SUM(CASE WHEN t.hours IS NOT NULL THEN t.hours ELSE 0 END), 0) AS completed_hours,
      MAX(
        COALESCE(SUM(ol.qty) * 0.1, 0)
        - COALESCE(SUM(CASE WHEN t.hours IS NOT NULL THEN t.hours ELSE 0 END), 0),
        0
      ) AS remaining_hours,
      CASE
        WHEN COALESCE(SUM(ol.qty) * 0.1, 0) > 0
        THEN ROUND(
          100.0 * COALESCE(SUM(CASE WHEN t.hours IS NOT NULL THEN t.hours ELSE 0 END), 0)
          / COALESCE(SUM(ol.qty) * 0.1, 0),
          2
        )
        ELSE 0
      END AS efficiency
    FROM orders o
    LEFT JOIN order_lines ol ON o.order_id = ol.order_id
    LEFT JOIN timesheets t ON o.order_id = t.order_id
    GROUP BY o.order_id;
    """
    )
    # Insert minimal seed data for development views
    cur.execute(
        "INSERT OR IGNORE INTO orders(order_id, order_date, customer_id, status, due_date) VALUES (?,?,?,?,?)",
        ("ORD-0002", None, "CUST-ALFA", "Planned", None),
    )
    cur.execute(
        "INSERT OR IGNORE INTO order_lines(order_id, line_no, product_id, qty, unit_price, discount_pct) VALUES (?,?,?,?,?,?)",
        ("ORD-0002", 1, "P-100", 20, 30, 0.05),
    )
    cur.execute(
        "INSERT OR IGNORE INTO order_lines(order_id, line_no, product_id, qty, unit_price, discount_pct) VALUES (?,?,?,?,?,?)",
        ("ORD-0002", 2, "P-101", 10, 5, 0),
    )
    cur.execute(
        "INSERT OR IGNORE INTO timesheets(emp_id, ts_date, order_id, operation_no, hours) VALUES (?,?,?,?,?)",
        ("E-01", None, "ORD-0002", 1, 2),
    )
    cur.execute(
        "INSERT OR IGNORE INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES (?,?,?,?,?)",
        ("TXN-PO-2", None, "P-100", 200, "PO"),
    )
    cur.execute(
        "INSERT OR IGNORE INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES (?,?,?,?,?)",
        ("TXN-PO-3", None, "P-101", 50, "PO"),
    )
    conn.commit()

    cur.executescript(
        """
    CREATE TABLE IF NOT EXISTS order_id_seq (
      prefix TEXT PRIMARY KEY,
      last_suffix INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO order_id_seq(prefix, last_suffix) VALUES ('ORD', 1);
    """
    )


def fetch_all(sql: str, params: Optional[Tuple] = None) -> List[dict]:
    pool = _get_pool()
    if pool is None:
        # sqlite path
        with get_conn() as conn:
            cur = conn.cursor()
            # translate %s placeholders (Postgres style) to ? for sqlite
            sql_exec = sql.replace("%s", "?") if params else sql
            # Convert Decimal params to float for sqlite binding
            bind_params = params
            if params:
                bind_params = tuple(
                    float(p) if isinstance(p, Decimal) else p for p in params
                )
            cur.execute(sql_exec, bind_params or ())
            rows = cur.fetchall()
            cur.close()
            # convert sqlite3.Row to dict
            return [dict(r) for r in rows]
    else:
        with get_conn() as conn:
            if PSYCOPG3_AVAILABLE:
                with conn.cursor(row_factory=dict_row) as cur:  # type: ignore
                    cur.execute(sql, params or ())
                    return cur.fetchall()
            else:
                from psycopg2.extras import RealDictCursor  # type: ignore

                with conn.cursor(cursor_factory=RealDictCursor) as cur:  # type: ignore
                    cur.execute(sql, params or ())
                    return cur.fetchall()


def fetch_one(sql: str, params: Optional[Tuple] = None) -> Optional[dict]:
    pool = _get_pool()
    if pool is None:
        with get_conn() as conn:
            cur = conn.cursor()
            sql_exec = sql.replace("%s", "?") if params else sql
            cur.execute(sql_exec, params or ())
            row = cur.fetchone()
            return dict(row) if row is not None else None
    else:
        with get_conn() as conn:
            if PSYCOPG3_AVAILABLE:
                with conn.cursor(row_factory=dict_row) as cur:  # type: ignore
                    cur.execute(sql, params or ())
                    return cur.fetchone()
            else:
                from psycopg2.extras import RealDictCursor  # type: ignore

                with conn.cursor(cursor_factory=RealDictCursor) as cur:  # type: ignore
                    cur.execute(sql, params or ())
                    return cur.fetchone()


def _fetch_returning_rows(cur):
    """Return list of dict rows from cursor regardless of backend."""
    if cur.description is None:
        return []
    columns = [col[0] for col in cur.description]
    rows = cur.fetchall()
    normalized = []
    for row in rows:
        if isinstance(row, dict):
            normalized.append(row)
        elif hasattr(row, "_mapping"):
            normalized.append(dict(row._mapping))
        else:
            normalized.append({col: row[idx] for idx, col in enumerate(columns)})
    return normalized


def execute(sql: str, params: Optional[Tuple] = None, returning: bool = False):
    """Execute SQL (INSERT, UPDATE, DELETE).
    For INSERT/UPDATE with `returning=True`, return list[dict] rows just like fetch_* helpers.
    """
    pool = _get_pool()
    if pool is None:
        with get_conn() as conn:
            cur = conn.cursor()
            sql_exec = sql.replace("%s", "?") if params else sql
            bind_params = params
            if params:
                bind_params = tuple(
                    float(p) if isinstance(p, Decimal) else p for p in params
                )
            cur.execute(sql_exec, bind_params or ())
            rows = _fetch_returning_rows(cur) if returning else None
            conn.commit()
            return rows
    else:
        with get_conn() as conn:
            if PSYCOPG3_AVAILABLE:
                with conn.cursor() as cur:  # type: ignore
                    cur.execute(sql, params or ())
                    return _fetch_returning_rows(cur) if returning else None
            else:
                from psycopg2.extras import RealDictCursor  # type: ignore

                with conn.cursor(cursor_factory=RealDictCursor) as cur:  # type: ignore
                    cur.execute(sql, params or ())
                    if returning:
                        rows = cur.fetchall()
                        return rows if isinstance(rows, list) else list(rows)
                    return None


def init_db():
    """Initializes the database and creates tables if they don't exist."""
    global POOL
    db_url = os.getenv("DATABASE_URL")

    if db_url:
        # PostgreSQL setup
        # ... existing code

        # Use PostgreSQL syntax for table creation
        commands = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS api_keys (
                id SERIAL PRIMARY KEY,
                key_hash TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP WITH TIME ZONE,
                is_active BOOLEAN DEFAULT TRUE,
                description TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS admin_audit (
                id SERIAL PRIMARY KEY,
                event_type TEXT NOT NULL,
                event_by TEXT,
                event_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                details JSONB
            )
            """,
        ]
        # ... existing code
    else:
        # SQLite fallback
        # ... existing code

        # Use SQLite syntax for table creation
        commands = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_hash TEXT NOT NULL UNIQUE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_used_at TEXT,
                is_active INTEGER DEFAULT 1,
                description TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS admin_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                event_by TEXT,
                event_time TEXT DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
            """,
        ]
        # ... existing code


def next_order_id(prefix: str = "ORD") -> str:
    pool = _get_pool()
    if pool is None:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(
                "SELECT last_suffix FROM order_id_seq WHERE prefix = ?", (prefix,)
            )
            row = cur.fetchone()
            suffix = (row[0] if row else 0) + 1
            cur.execute(
                "INSERT INTO order_id_seq(prefix, last_suffix) VALUES(?, ?) ON CONFLICT(prefix) DO UPDATE SET last_suffix=excluded.last_suffix",
                (prefix, suffix),
            )
            conn.commit()
            return f"{prefix}-{suffix:04d}"
    # Postgres path - rely on SQL_NEXT_ORDER_ID
    from queries import SQL_NEXT_ORDER_ID

    row = fetch_one(SQL_NEXT_ORDER_ID)
    suffix = row.get("next_suffix") if row else "0001"
    return f"{prefix}-{suffix}"
