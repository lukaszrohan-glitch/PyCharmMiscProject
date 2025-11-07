import os
import binascii
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import hashlib
import secrets
import json

from db import fetch_all, fetch_one, execute

SQL_CREATE_API_KEYS_TABLE = """
CREATE TABLE IF NOT EXISTS api_keys (
  id bigserial PRIMARY KEY,
  key_text text,
  key_hash text,
  salt text,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  last_used timestamptz
);
"""

SQL_CREATE_API_KEY_AUDIT_TABLE = """
CREATE TABLE IF NOT EXISTS api_key_audit (
  audit_id bigserial PRIMARY KEY,
  api_key_id bigint,
  event_type text NOT NULL,
  event_by text,
  event_time timestamptz NOT NULL DEFAULT now(),
  details text
);
"""

SQL_INSERT_API_KEY = """
INSERT INTO api_keys (key_text, key_hash, salt, label, created_at, active)
VALUES (%s, %s, %s, %s, COALESCE(%s, now()), COALESCE(%s, true))
RETURNING id, key_text, label, created_at, active;
"""

# For audit inserts do not rely on RETURNING to keep sqlite compatible
SQL_INSERT_AUDIT = """
INSERT INTO api_key_audit (api_key_id, event_type, event_by, details) VALUES (%s, %s, %s, %s);
"""

SQL_LIST_API_KEYS = """
SELECT id, key_text, label, created_at, active FROM api_keys ORDER BY created_at DESC;
"""

SQL_GET_API_KEY_BY_KEYTEXT = """
SELECT id, key_text, key_hash, salt, label, created_at, active FROM api_keys WHERE key_text = %s AND active = true LIMIT 1;
"""

SQL_GET_API_KEY_BY_HASH = """
SELECT id, key_text, key_hash, salt, label, created_at, active FROM api_keys WHERE active = true;
"""

SQL_DELETE_API_KEY_BY_ID = """
DELETE FROM api_keys WHERE id = %s RETURNING id;
"""

SQL_DELETE_API_KEY_BY_KEYTEXT = """
DELETE FROM api_keys WHERE key_text = %s RETURNING id;
"""

SQL_ROTATE_API_KEY = """
UPDATE api_keys SET active = false WHERE id = %s RETURNING id;
"""

SQL_UPDATE_LAST_USED = """
UPDATE api_keys SET last_used = now() WHERE id = %s RETURNING id;
"""


# hashing params
PBKDF2_ITERATIONS = int(os.getenv('APIKEY_PBKDF2_ITER', '200000'))
HASH_NAME = 'sha256'
SALT_BYTES = 16
KEY_BYTES = 32


def ensure_table():
    """Ensure the required API keys and audit tables exist in the database (Postgres path).
    For sqlite fallback the tables are created by the sqlite init in `db._init_sqlite_schema`.
    """
    try:
        # Create both tables if not present (Postgres)
        execute(SQL_CREATE_API_KEYS_TABLE)
        execute(SQL_CREATE_API_KEY_AUDIT_TABLE)
    except Exception:
        # If DB is not available or SQL dialect mismatch, ignore and rely on sqlite init
        pass


def _hash_key(plaintext: str, salt: Optional[bytes] = None) -> Tuple[str, str]:
    if salt is None:
        salt = secrets.token_bytes(SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(HASH_NAME, plaintext.encode('utf-8'), salt, PBKDF2_ITERATIONS, dklen=KEY_BYTES)
    return binascii.hexlify(dk).decode('ascii'), binascii.hexlify(salt).decode('ascii')


def _verify_key(plaintext: str, stored_hash_hex: str, salt_hex: str) -> bool:
    salt = binascii.unhexlify(salt_hex)
    dk = hashlib.pbkdf2_hmac(HASH_NAME, plaintext.encode('utf-8'), salt, PBKDF2_ITERATIONS, dklen=KEY_BYTES)
    return binascii.hexlify(dk).decode('ascii') == stored_hash_hex


def create_api_key(label: Optional[str] = None, created_at: Optional[datetime] = None, active: bool = True) -> Dict[str, Any]:
    """Create a new API key. Returns a dict with id, label, created_at, active and plaintext 'api_key' (only here).
    The plaintext is shown only once and is not stored in plaintext long-term (key_text is stored but can be nullified later).
    """
    import db as _db

    plaintext = secrets.token_urlsafe(32)
    key_hash, salt = _hash_key(plaintext)

    # If using sqlite fallback (no pool), insert using sqlite-compatible placeholders and functions
    if getattr(_db, '_get_pool')() is None:
        # sqlite: use ? placeholders and datetime('now') instead of now()
        sql = """
        INSERT INTO api_keys (key_text, key_hash, salt, label, created_at, active)
        VALUES (?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, 1));
        """
        try:
            execute(sql, (None, key_hash, salt, label, created_at, 1), returning=False)
        except Exception:
            # best-effort insert; continue
            pass
        # fetch the inserted row by hash+salt
        try:
            row = fetch_one("SELECT id, key_text, label, created_at, active FROM api_keys WHERE key_hash = ? AND salt = ? LIMIT 1", (key_hash, salt))
        except Exception:
            row = None
    else:
        # Postgres path: use parametrized SQL with RETURNING
        rows = execute(SQL_INSERT_API_KEY, (None, key_hash, salt, label, created_at, active), returning=True)
        row = rows[0] if rows else None

    if row:
        # include plaintext only in the returned payload
        row['api_key'] = plaintext
    return row


def list_api_keys():
    return fetch_all(SQL_LIST_API_KEYS)


def get_api_key(key_text_or_plain: str):
    # First try to find by literal key_text (legacy or stored)
    row = None
    try:
        row = fetch_one(SQL_GET_API_KEY_BY_KEYTEXT, (key_text_or_plain,))
        if row:
            return row
    except Exception:
        pass

    # Otherwise, fetch all active keys with salt/hash and verify
    try:
        rows = fetch_all(SQL_GET_API_KEY_BY_HASH)
        for r in rows:
            if r.get('key_hash') and r.get('salt'):
                if _verify_key(key_text_or_plain, r['key_hash'], r['salt']):
                    return r
    except Exception:
        pass

    return None


def delete_api_key_by_id(key_id: int):
    rows = execute(SQL_DELETE_API_KEY_BY_ID, (key_id,), returning=True)
    return rows[0] if rows else None


def delete_api_key_by_keytext(key_text: str):
    rows = execute(SQL_DELETE_API_KEY_BY_KEYTEXT, (key_text,), returning=True)
    return rows[0] if rows else None


def rotate_api_key(key_id: int, by: Optional[str] = None) -> Dict[str, Any]:
    """Rotate an API key: deactivate the existing key (by id), create a new key, log audit. Returns new key row with plaintext."""
    # Deactivate old key
    try:
        execute(SQL_ROTATE_API_KEY, (key_id,))
    except Exception:
        pass
    # Create new key
    new_key_row = create_api_key(label=f'rotated-from-{key_id}')
    # Log audit (use helper to ensure sqlite gets event_time)
    try:
        details = { 'rotated_from': key_id, 'new_id': new_key_row.get('id') if new_key_row else None }
        log_api_key_event(new_key_row.get('id') if new_key_row else None, 'rotated', by, details)
    except Exception:
        pass
    return new_key_row


def log_api_key_event(api_key_id: Optional[int], event_type: str, event_by: Optional[str] = None, details: Optional[dict] = None):
    try:
        import db as _db
        payload = (api_key_id, event_type, event_by, json.dumps(details) if details else None)
        pool = getattr(_db, '_get_pool')()
        if pool is None:
            # sqlite: include event_time using datetime('now')
            sql = "INSERT INTO api_key_audit (api_key_id, event_type, event_by, event_time, details) VALUES (?, ?, ?, datetime('now'), ?)"
            execute(sql, payload, returning=False)
        else:
            # Postgres path
            execute(SQL_INSERT_AUDIT, payload, returning=True)
    except Exception:
        pass


def mark_last_used(api_key_id: int):
    try:
        execute(SQL_UPDATE_LAST_USED, (api_key_id,))
    except Exception:
        pass
