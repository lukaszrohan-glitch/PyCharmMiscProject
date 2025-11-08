#!/usr/bin/env python3
import sys
import os
import secrets
sys.path.append(os.path.dirname(__file__))

from passlib.hash import bcrypt
from db import execute

def create_admin():
    email = 'ciopqj@gmail.com'
    password = 'admin'
    company_id = 'SMB'
    is_admin = True
    subscription_plan = 'premium'

    raw_password = password[:72]  # Truncate to 72 bytes as required by bcrypt
    pwd_hash = bcrypt.hash(raw_password.encode('utf-8'))
    user_id = f'U-{secrets.token_hex(3)}'

    try:
        rows = execute("INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) VALUES (%s, %s, %s, %s, %s, %s) RETURNING user_id, email, company_id, is_admin, subscription_plan;", (user_id, email, company_id, pwd_hash, is_admin, subscription_plan), returning=True)
        if rows:
            print(f"Admin user created: {rows[0]}")
        else:
            print("Failed to create user")
    except Exception as e:
        print(f"Error creating admin: {e}")

if __name__ == '__main__':
    create_admin()
