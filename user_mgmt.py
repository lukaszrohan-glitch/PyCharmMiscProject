import os
import secrets
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from fastapi import HTTPException, Depends, Header
from jose import jwt, JWTError
from passlib.hash import pbkdf2_sha256 as hasher

from db import fetch_one, fetch_all, execute
from config import settings

# JWT settings
JWT_SECRET = settings.JWT_SECRET
JWT_ALG = 'HS256'
JWT_EXP_MINUTES = settings.JWT_EXP_MINUTES
JWT_REFRESH_DAYS = settings.JWT_REFRESH_DAYS

MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15

# --- Table creation (Postgres path) ---

SQL_CREATE_USERS = """
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  company_id TEXT,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subscription_plan TEXT DEFAULT 'free',
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TEXT,
  password_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""

SQL_CREATE_PLANS = """
CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_orders INTEGER,
  max_users INTEGER,
  features TEXT
);
"""

# --- Queries ---

SQL_GET_USER_BY_EMAIL = """
SELECT user_id,
       email,
       company_id,
       password_hash,
       is_admin,
       active,
       subscription_plan,
       failed_login_attempts,
       last_failed_login
FROM users
WHERE email = %s
LIMIT 1;
"""

SQL_GET_USER_BY_ID = """
SELECT user_id,
       email,
       company_id,
       password_hash,
       is_admin,
       active,
       subscription_plan,
       failed_login_attempts,
       last_failed_login
FROM users
WHERE user_id = %s
LIMIT 1;
"""

SQL_INSERT_USER = """
INSERT INTO users (
  user_id, email, company_id, password_hash, is_admin, subscription_plan
)
VALUES (%s, %s, %s, %s, %s, %s)
RETURNING user_id, email, company_id, is_admin, subscription_plan;
"""

SQL_LIST_USERS = """
SELECT user_id, email, company_id, is_admin, active, subscription_plan
FROM users
ORDER BY created_at DESC;
"""

SQL_UPDATE_PASSWORD = """
UPDATE users
SET password_hash = %s,
    password_changed_at = CURRENT_TIMESTAMP,
    failed_login_attempts = 0,
    last_failed_login = NULL
WHERE user_id = %s
RETURNING user_id;
"""

SQL_INSERT_PLAN = """
INSERT INTO subscription_plans (
  plan_id, name, max_orders, max_users, features
)
VALUES (%s, %s, %s, %s, %s)
RETURNING plan_id, name, max_orders, max_users, features;
"""

SQL_LIST_PLANS = """
SELECT plan_id, name, max_orders, max_users, features
FROM subscription_plans
ORDER BY name;
"""

# --- Util ---

def ensure_user_tables():
    """
    Tworzy tabele users / subscription_plans (SQLite lub Postgres),
    oraz zapewnia istnienie użytkownika admina.
    """
    try:
        from db import _get_pool
        pool = _get_pool()

        if pool is None:
            # SQLite / fallback
            sql_users = """
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  company_id TEXT,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subscription_plan TEXT DEFAULT 'free',
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TEXT,
  password_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""
            sql_plans = """
CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_orders INTEGER,
  max_users INTEGER,
  features TEXT
);
"""
        else:
            # Postgres
            sql_users = SQL_CREATE_USERS
            sql_plans = SQL_CREATE_PLANS

        execute(sql_users)
        execute(sql_plans)

        admin_email = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
        admin_password = os.getenv('ADMIN_PASSWORD', 'SMB#Admin2025!')
        row = fetch_one(SQL_GET_USER_BY_EMAIL, (admin_email,))
        if not row:
            user_id = 'admin'
            pwd_hash = hasher.hash(admin_password)
            execute(
                SQL_INSERT_USER,
                (user_id, admin_email, None, pwd_hash, 1, 'enterprise'),
                returning=True
            )
            print(f"Admin user created: {admin_email}")
        else:
            if os.getenv('ADMIN_PASSWORD'):
                pwd_hash = hasher.hash(admin_password)
                execute(SQL_UPDATE_PASSWORD, (pwd_hash, row['user_id']), returning=True)
                print(f"Admin password updated for: {admin_email}")
            else:
                print(f"Admin user already exists: {admin_email}")
    except Exception as e:
        print(f"Error ensuring user tables: {e}")

# --- Auth helpers ---

def _make_token(user: Dict) -> Dict[str, str]:
    # Access token
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)
    access_payload = {
        'sub': user['user_id'],
        'email': user['email'],
        'is_admin': user['is_admin'],
        'exp': exp,
        'type': 'access'
    }

    # Refresh token
    refresh_exp = datetime.utcnow() + timedelta(days=JWT_REFRESH_DAYS)
    refresh_payload = {
        'sub': user['user_id'],
        'exp': refresh_exp,
        'type': 'refresh'
    }

    return {
        'access_token': jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALG),
        'refresh_token': jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALG),
        'expires_in': JWT_EXP_MINUTES * 60
    }


def login_user(email: str, password: str) -> Dict:
    normalized_email = email.strip() if email else ''
    if not normalized_email:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    user = fetch_one(SQL_GET_USER_BY_EMAIL, (normalized_email,))
    if not user or not user.get('active'):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    # Check for lockout
    if user.get('failed_login_attempts', 0) >= MAX_LOGIN_ATTEMPTS:
        last_failed = user.get('last_failed_login')
        if last_failed:
            lockout_time = datetime.fromisoformat(str(last_failed))
            if datetime.utcnow() - lockout_time < timedelta(minutes=LOGIN_LOCKOUT_MINUTES):
                raise HTTPException(status_code=429, detail='Account temporarily locked')

    if not hasher.verify(password, user['password_hash']):
        # Update failed attempts
        execute(
            "UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1, "
            "last_failed_login = CURRENT_TIMESTAMP WHERE user_id = %s",
            (user['user_id'],)
        )
        raise HTTPException(status_code=401, detail='Invalid credentials')

    # Reset failed attempts on successful login
    execute(
        "UPDATE users SET failed_login_attempts = 0, last_failed_login = NULL WHERE user_id = %s",
        (user['user_id'],)
    )

    tokens = _make_token(user)
    return {
        'tokens': tokens,
        'user': {
            k: user[k]
            for k in ['user_id', 'email', 'company_id', 'is_admin', 'subscription_plan']
        }
    }


def decode_token(token: Optional[str]) -> Dict:
    """
    Oczekuje CZYSTEGO JWT (bez 'Bearer ').
    """
    if not token:
        raise HTTPException(status_code=401, detail='Missing token')
    try:
        if isinstance(token, (bytes, bytearray)):
            token = token.decode('utf-8', errors='ignore')
        if isinstance(token, str) and token.startswith('Bearer '):
            token = token.split(' ', 1)[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        # Additional validation
        if 'exp' not in payload:
            raise HTTPException(status_code=401, detail='Token missing expiration')
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    except Exception:
        raise HTTPException(status_code=401, detail='Token validation failed')


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    token = authorization.split(' ', 1)[1]
    payload = decode_token(token)
    user = fetch_one(SQL_GET_USER_BY_ID, (payload['sub'],))
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user


def require_admin(user=Depends(get_current_user)):
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail='Admin only')
    return user

# --- CRUD ops ---

def create_user(
    email: str,
    company_id: Optional[str],
    is_admin: bool,
    subscription_plan: Optional[str],
    initial_password: Optional[str] = None
) -> Dict:
    from password_validator import validate_password_strength

    # Basic email validation
    if not email or not email.strip():
        raise Exception('Email is required')
    e = email.strip()
    if '@' not in e or '.' not in e.split('@')[-1]:
        raise Exception('Invalid email format')

    # Generate or validate password
    raw_password = initial_password.strip() if initial_password else secrets.token_hex(16)

    # Validate password strength (only if user-provided, skip for auto-generated)
    if initial_password:
        is_valid, errors = validate_password_strength(raw_password)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Password does not meet security requirements: {'; '.join(errors)}"
            )

    # Truncate to 72 chars for bcrypt
    if len(raw_password) > 72:
        raw_password = raw_password[:72]

    pwd_hash = hasher.hash(raw_password)
    user_id = f'U-{secrets.token_hex(3)}'
    try:
        rows = execute(
            SQL_INSERT_USER,
            (user_id, email, company_id, pwd_hash, 1 if is_admin else 0, subscription_plan),
            returning=True
        )
    except Exception as e:
        # Convert unique email violation to HTTPException (preserve legacy 500 semantics in tests)
        if 'UNIQUE constraint failed' in str(e) or 'duplicate key' in str(e).lower():
            raise HTTPException(status_code=500, detail='Email already exists')
        raise
    if not rows:
        # sqlite path without RETURNING: fetch the row explicitly
        row = fetch_one(
            "SELECT user_id, email, company_id, is_admin, subscription_plan FROM users WHERE user_id = %s",
            (user_id,)
        )
        if not row:
            raise HTTPException(status_code=500, detail='Failed to create user')
    else:
        row = rows[0]
    row['initial_password'] = raw_password
    return row


def list_users():
    return fetch_all(SQL_LIST_USERS)


def change_password(user_id: str, old_password: str, new_password: str):
    user = fetch_one(SQL_GET_USER_BY_ID, (user_id,))
    if not user or not hasher.verify(old_password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Old password mismatch')

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail='Password too short (min 8 chars)')

    new_hash = hasher.hash(new_password)
    rows = execute(SQL_UPDATE_PASSWORD, (new_hash, user_id), returning=True)
    if not rows:
        # sqlite path without RETURNING; assume success if user existed
        return {'changed': True}
    return {'changed': True}


def create_plan(
    plan_id: str,
    name: str,
    max_orders: Optional[int],
    max_users: Optional[int],
    features: Optional[List[str]]
):
    feat_str = ','.join(features) if features else None
    rows = execute(
        SQL_INSERT_PLAN,
        (plan_id, name, max_orders, max_users, feat_str),
        returning=True
    )
    if not rows:
        # sqlite path: fetch back
        return fetch_one(
            "SELECT plan_id, name, max_orders, max_users, features FROM subscription_plans WHERE plan_id = %s",
            (plan_id,)
        )
    return rows[0] if rows else None


def list_plans():
    rows = fetch_all(SQL_LIST_PLANS)
    for r in rows:
        if r.get('features'):
            r['features'] = r['features'].split(',')
    return rows


def request_password_reset(email: str) -> Dict:
    user = fetch_one(SQL_GET_USER_BY_EMAIL, (email,))
    # Nie zdradzamy, czy email istnieje
    if not user:
        return {'message': 'If email exists, reset link has been sent'}

    reset_token = jwt.encode(
        {
            'sub': user['user_id'],
            'type': 'reset',
            'exp': datetime.utcnow() + timedelta(hours=24)
        },
        JWT_SECRET,
        algorithm=JWT_ALG
    )
    # Tu normalnie wysyłka maila – teraz tylko zwracamy token
    return {'reset_token': reset_token, 'message': 'Reset token generated'}


def reset_password_with_token(token: str, new_password: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get('type') != 'reset':
            raise HTTPException(status_code=400, detail='Invalid token type')
        user_id = payload['sub']
    except JWTError:
        raise HTTPException(status_code=400, detail='Invalid or expired reset token')

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail='Password too short (min 8 chars)')

    new_hash = hasher.hash(new_password)
    rows = execute(SQL_UPDATE_PASSWORD, (new_hash, user_id), returning=True)
    if not rows:
        raise HTTPException(status_code=500, detail='Failed to change password')
    return {'changed': True}
