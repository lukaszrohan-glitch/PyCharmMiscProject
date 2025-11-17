from __future__ import annotations

import json
from typing import Optional, Dict, Any

from db import execute, fetch_all


SQL_CREATE_ADMIN_AUDIT = """
CREATE TABLE IF NOT EXISTS admin_audit (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  event_by TEXT,
  event_time TEXT,
  details TEXT
);
"""

SQL_CREATE_ADMIN_AUDIT_PG = """
CREATE TABLE IF NOT EXISTS admin_audit (
  audit_id bigserial PRIMARY KEY,
  event_type text NOT NULL,
  event_by text,
  event_time timestamptz NOT NULL DEFAULT now(),
  details jsonb
);
"""


def ensure_table():
    """Create admin_audit table if missing. Works for both sqlite and Postgres."""
    try:
        from db import _get_pool
        pool = _get_pool()
        if pool is None:
            # sqlite path: simple TEXT columns
            execute(SQL_CREATE_ADMIN_AUDIT)
        else:
            execute(SQL_CREATE_ADMIN_AUDIT_PG)
    except Exception:
        # best effort
        pass


def log_admin_event(event_type: str, event_by: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    try:
        from db import _get_pool
        pool = _get_pool()
        if pool is None:
            sql = "INSERT INTO admin_audit (event_type, event_by, event_time, details) VALUES (?, ?, datetime('now'), ?)"
            execute(sql, (event_type, event_by, json.dumps(details) if details else None), returning=False)
        else:
            sql = "INSERT INTO admin_audit (event_type, event_by, details) VALUES (%s, %s, %s)"
            execute(sql, (event_type, event_by, json.dumps(details) if details else None), returning=True)
    except Exception:
        # swallow errors to not break admin flows
        pass


def list_admin_audit(limit: int = 100):
    try:
        return fetch_all(
            "SELECT * FROM admin_audit ORDER BY audit_id DESC LIMIT %s",
            (limit,)
        )
    except Exception:
        return []

