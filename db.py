import os
from contextlib import contextmanager
from typing import Optional, Tuple, Iterator, Any, List
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import TYPE_CHECKING

# Import psycopg2 types only for type checkers
if TYPE_CHECKING:
    from psycopg2.pool import SimpleConnectionPool  # type: ignore
    from psycopg2.extras import RealDictCursor  # type: ignore

# Try to import psycopg2 at runtime, but don't fail import entirely
try:
    import psycopg2  # type: ignore
    from psycopg2.pool import SimpleConnectionPool
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except Exception:
    PSYCOPG2_AVAILABLE = False

# sqlite fallback
import sqlite3

MINCONN = int(os.getenv("DB_POOL_MIN", "1"))
MAXCONN = int(os.getenv("DB_POOL_MAX", "10"))
DATABASE_URL = os.getenv("DATABASE_URL")
PG_SSLMODE = os.getenv("PG_SSLMODE")

POOL = None  # type: ignore

SQLITE_INIT_DONE = False
SQLITE_DB_PATH = os.path.join(os.getcwd(), "_dev_db.sqlite")


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
    # If DATABASE_URL or PG_* configured, require psycopg2
    if DATABASE_URL or os.getenv("PG_HOST") or os.getenv("PG_DB") or os.getenv("PG_USER"):
        if not PSYCOPG2_AVAILABLE:
            raise RuntimeError("psycopg2 not available. Install psycopg2-binary or set DATABASE_URL to empty for sqlite fallback.")
        dsn = DATABASE_URL
        if PG_SSLMODE and dsn and "sslmode=" not in dsn:
            dsn = _append_sslmode_to_url(dsn, PG_SSLMODE)
        return SimpleConnectionPool(MINCONN, MAXCONN, dsn=dsn)

    # sqlite fallback (development): use a simple connection per call
    return None


def _get_pool() -> Any:
    global POOL
    if POOL is None:
        try:
            POOL = _create_pool()
        except Exception as exc:
            raise RuntimeError("Failed to initialize DB connection pool: %s" % exc) from exc
    return POOL


@contextmanager
def get_conn() -> Iterator[Any]:
    """Yield a DB connection. For Postgres returns a psycopg2 connection from pool.
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
    # Create customers, products, orders, order_lines, employees, timesheets, inventory, api_keys, api_key_audit
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nip TEXT,
      address TEXT,
      email TEXT,
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
      due_date DATE
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
      notes TEXT
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
      created_at TEXT,
      active BOOLEAN DEFAULT 1,
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
    """)
    # Insert minimal seed data if missing
    cur.execute("INSERT OR IGNORE INTO customers(customer_id, name, nip, address, email) VALUES (?,?,?,?,?)", ('CUST-ALFA', 'Alfa Sp. z o.o.', '1234567890', 'Warszawa', 'biuro@alfa.pl'))
    cur.execute("INSERT OR IGNORE INTO products(product_id, name, std_cost, price) VALUES (?,?,?,?)", ('P-100', 'Gadzet A', 10, 30))
    cur.execute("INSERT OR IGNORE INTO products(product_id, name, std_cost, price) VALUES (?,?,?,?)", ('P-101', 'Komponent X', 2, 5))
    cur.execute("INSERT OR IGNORE INTO employees(emp_id, name, role, hourly_rate) VALUES (?,?,?,?)", ('E-01', 'Jan Kowalski', 'Operator', 45.00))
    cur.execute("INSERT OR IGNORE INTO orders(order_id, order_date, customer_id, status, due_date) VALUES (?,?,?,?,?)", ('ORD-0001', None, 'CUST-ALFA', 'Planned', None))
    cur.execute("INSERT OR IGNORE INTO order_lines(order_id, line_no, product_id, qty, unit_price, discount_pct) VALUES (?,?,?,?,?,?)", ('ORD-0001', 1, 'P-100', 50, 30, 0.05))
    cur.execute("INSERT OR IGNORE INTO inventory(txn_id, txn_date, product_id, qty_change, reason) VALUES (?,?,?,?,?)", ('TXN-PO-1', None, 'P-101', 500, 'PO'))
    conn.commit()


def fetch_all(sql: str, params: Optional[Tuple] = None) -> List[dict]:
    pool = _get_pool()
    if pool is None:
        # sqlite path
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            # convert sqlite3.Row to dict
            return [dict(r) for r in rows]
    else:
        with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            return cur.fetchall()


def fetch_one(sql: str, params: Optional[Tuple] = None) -> Optional[dict]:
    pool = _get_pool()
    if pool is None:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(sql, params or ())
            row = cur.fetchone()
            return dict(row) if row is not None else None
    else:
        with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            return cur.fetchone()


def execute(sql: str, params: Optional[Tuple] = None, returning: bool = False):
    pool = _get_pool()
    if pool is None:
        with get_conn() as conn:
            cur = conn.cursor()
            cur.execute(sql, params or ())
            if returning:
                rows = cur.fetchall()
                conn.commit()
                return [dict(r) for r in rows]
            conn.commit()
            return None
    else:
        with get_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or ())
            if returning:
                rows = cur.fetchall()
                conn.commit()
                return rows
            conn.commit()
            return None
