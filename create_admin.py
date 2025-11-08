#!/usr/bin/env python3
import sys
import os
import secrets
import bcrypt
sys.path.append(os.path.dirname(__file__))

from db import execute

def create_admin():
    email = 'ciopqj@gmail.com'
    password = 'SMB#Admin2025!'  # More secure password
    company_id = 'SMB'
    is_admin = True
    subscription_plan = 'premium'

    # Bcrypt password hashing
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    pwd_hash = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

    user_id = f'U-{secrets.token_hex(3)}'

    try:
        rows = execute("INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) VALUES (%s, %s, %s, %s, %s, %s) RETURNING user_id, email, company_id, is_admin, subscription_plan;",
                      (user_id, email, company_id, pwd_hash, is_admin, subscription_plan),
                      returning=True)
        if rows:
            print(f"Admin user created successfully!")
            print(f"Login with:")
            print(f"Email: {email}")
            print(f"Password: {password}")
        else:
            print("Failed to create user")
    except Exception as e:
        print(f"Error creating admin: {e}")

if __name__ == '__main__':
    create_admin()
