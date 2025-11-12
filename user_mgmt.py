import os
import secrets
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from fastapi import HTTPException, Depends, Header
from jose import jwt, JWTError
from passlib.hash import pbkdf2_sha256 as hasher

from db import fetch_one, fetch_all, execute

# Use a strong secret key in production
JWT_SECRET = os.getenv('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALG = 'HS256'
JWT_EXP_MINUTES = int(os.getenv('JWT_EXP_MINUTES', '120'))
# Added missing refresh token lifetime constant (was causing NameError)
JWT_REFRESH_DAYS = int(os.getenv('JWT_REFRESH_DAYS', '7'))
MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_MINUTES = 15

# --- Table creation (Postgres path) ---
SQL_CREATE_USERS = """
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  company_id TEXT,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  subscription_plan TEXT DEFAULT 'free',
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login timestamptz,
  password_changed_at timestamptz DEFAULT now()
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
SQL_GET_USER_BY_EMAIL = "SELECT user_id, email, company_id, password_hash, is_admin, active, subscription_plan FROM users WHERE email = %s LIMIT 1;"
SQL_GET_USER_BY_ID = "SELECT user_id, email, company_id, password_hash, is_admin, active, subscription_plan FROM users WHERE user_id = %s LIMIT 1;"
SQL_INSERT_USER = "INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) VALUES (%s, %s, %s, %s, %s, %s) RETURNING user_id, email, company_id, is_admin, subscription_plan;"
SQL_LIST_USERS = "SELECT user_id, email, company_id, is_admin, active, subscription_plan FROM users ORDER BY created_at DESC;"
SQL_UPDATE_PASSWORD = "UPDATE users SET password_hash = %s WHERE user_id = %s RETURNING user_id;"
SQL_INSERT_PLAN = "INSERT INTO subscription_plans (plan_id, name, max_orders, max_users, features) VALUES (%s, %s, %s, %s, %s) RETURNING plan_id, name, max_orders, max_users, features;"
SQL_LIST_PLANS = "SELECT plan_id, name, max_orders, max_users, features FROM subscription_plans ORDER BY name;"

# --- Util ---

def ensure_user_tables():
    try:
        execute(SQL_CREATE_USERS)
        execute(SQL_CREATE_PLANS)
        # seed admin user if not exists
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
        row = fetch_one(SQL_GET_USER_BY_EMAIL, (admin_email,))
        if not row:
            user_id = 'admin'
            pwd_hash = hasher.hash(os.getenv('ADMIN_PASSWORD', 'admin'))
            execute(SQL_INSERT_USER, (user_id, admin_email, None, pwd_hash, True, 'enterprise'), returning=True)
    except Exception:
        pass

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
    user = fetch_one(SQL_GET_USER_BY_EMAIL, (email,))
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
            "UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1, last_failed_login = now() WHERE user_id = %s",
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
        'user': {k: user[k] for k in ['user_id','email','company_id','is_admin','subscription_plan']}
    }


def decode_token(auth_header: Optional[str]) -> Dict:
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    token = auth_header.split(' ',1)[1]
    try:
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
    payload = decode_token(authorization)
    user = fetch_one(SQL_GET_USER_BY_ID, (payload['sub'],))
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user


def require_admin(user=Depends(get_current_user)):
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail='Admin only')
    return user

# --- CRUD ops ---

def create_user(email: str, company_id: Optional[str], is_admin: bool, subscription_plan: Optional[str], initial_password: Optional[str] = None) -> Dict:
    # If caller supplies a password use it (trim to 72 bytes for hash libs that warn)
    raw_password = initial_password.strip() if initial_password else secrets.token_hex(8)
    if len(raw_password) > 72:
        raw_password = raw_password[:72]
    if len(raw_password) < 8:
        raise HTTPException(status_code=400, detail='Password too short (min 8 chars)')
    pwd_hash = hasher.hash(raw_password)
    user_id = f'U-{secrets.token_hex(3)}'
    rows = execute(SQL_INSERT_USER, (user_id, email, company_id, pwd_hash, is_admin, subscription_plan), returning=True)
    if not rows:
        raise HTTPException(status_code=500, detail='Failed to create user')
    row = rows[0]
    row['initial_password'] = raw_password
    return row


def list_users():
    return fetch_all(SQL_LIST_USERS)


def change_password(user_id: str, old_password: str, new_password: str):
    user = fetch_one(SQL_GET_USER_BY_ID, (user_id,))
    if not user or not hasher.verify(old_password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Old password mismatch')
    new_hash = hasher.hash(new_password)
    execute(SQL_UPDATE_PASSWORD, (new_hash, user_id), returning=True)
    return {'changed': True}


def create_plan(plan_id: str, name: str, max_orders: Optional[int], max_users: Optional[int], features: Optional[List[str]]):
    feat_str = ','.join(features) if features else None
    rows = execute(SQL_INSERT_PLAN, (plan_id, name, max_orders, max_users, feat_str), returning=True)
    return rows[0] if rows else None


def list_plans():
    rows = fetch_all(SQL_LIST_PLANS)
    for r in rows:
        if r.get('features'):
            r['features'] = r['features'].split(',')
    return rows
