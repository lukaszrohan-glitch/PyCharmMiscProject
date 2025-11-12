#!/usr/bin/env python3
import os
import sys
import secrets
from passlib.hash import pbkdf2_sha256 as hasher

sys.path.append(os.path.dirname(__file__))
from db import execute, fetch_one

SQL_GET_USER_BY_EMAIL = "SELECT user_id, email FROM users WHERE email = %s LIMIT 1;"
SQL_INSERT_USER = "INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) VALUES (%s, %s, %s, %s, %s, %s) RETURNING user_id;"
SQL_UPDATE_PASSWORD = "UPDATE users SET password_hash = %s WHERE user_id = %s RETURNING user_id;"

def create_or_update_admin():
    email = os.getenv('ADMIN_EMAIL', 'admin@example.com').strip()
    password = os.getenv('ADMIN_PASSWORD', 'admin')
    company_id = os.getenv('ADMIN_COMPANY', 'SMB')
    plan = os.getenv('ADMIN_PLAN', 'enterprise')

    row = fetch_one(SQL_GET_USER_BY_EMAIL, (email,))
    if row:
        # Update password for existing admin/user
        pwd_hash = hasher.hash(password)
        execute(SQL_UPDATE_PASSWORD, (pwd_hash, row['user_id']), returning=True)
        print(f"Updated password for existing user: {email}")
        return

    user_id = 'admin'  # keep stable id for seeded admin
    pwd_hash = hasher.hash(password)
    execute(SQL_INSERT_USER, (user_id, email, company_id, pwd_hash, True, plan), returning=True)
    print("Admin user created successfully!")
    print(f"Email: {email}")
    print("Password: (taken from ADMIN_PASSWORD env)")

if __name__ == '__main__':
    try:
        create_or_update_admin()
    except Exception as e:
        print(f"Error creating/updating admin: {e}")
        sys.exit(1)
