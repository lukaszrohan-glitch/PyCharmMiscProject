import os
import secrets
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from fastapi import HTTPException, Depends, Header
from jose import jwt
from passlib.hash import bcrypt

from db import fetch_one, fetch_all, execute

JWT_SECRET = os.getenv('JWT_SECRET', 'dev-insecure-secret-change-me')
JWT_ALG = 'HS256'
JWT_EXP_MINUTES = int(os.getenv('JWT_EXP_MINUTES', '120'))

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
  subscription_plan TEXT DEFAULT 'free'
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
            pwd_hash = bcrypt.hash(os.getenv('ADMIN_PASSWORD', 'admin'))
            execute(SQL_INSERT_USER, (user_id, admin_email, None, pwd_hash, True, 'enterprise'), returning=True)
    except Exception:
        pass

# --- Auth helpers ---

def _make_token(user: Dict) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)
    payload = {
        'sub': user['user_id'],
        'email': user['email'],
        'is_admin': user['is_admin'],
        'exp': exp
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def login_user(email: str, password: str) -> Dict:
    user = fetch_one(SQL_GET_USER_BY_EMAIL, (email,))
    if not user or not user.get('active'):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    if not bcrypt.verify(password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = _make_token(user)
    return {'token': token, 'user': {k: user[k] for k in ['user_id','email','company_id','is_admin','subscription_plan']}}


def decode_token(auth_header: Optional[str]) -> Dict:
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing token')
    token = auth_header.split(' ',1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired token')


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

def create_user(email: str, company_id: Optional[str], is_admin: bool, subscription_plan: Optional[str]) -> Dict:
    # auto-generate password
    raw_password = secrets.token_hex(4)  # short initial password; user should change
    pwd_hash = bcrypt.hash(raw_password)
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
    if not user or not bcrypt.verify(old_password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Old password mismatch')
    new_hash = bcrypt.hash(new_password)
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

