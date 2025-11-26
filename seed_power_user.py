#!/usr/bin/env python3
import os
import sys
from passlib.hash import pbkdf2_sha256 as hasher

sys.path.append(os.path.dirname(__file__))
from db import execute, fetch_one

SQL_GET_USER_BY_EMAIL = "SELECT user_id, email FROM users WHERE email = %s LIMIT 1;"
SQL_INSERT_USER = (
    "INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) "
    "VALUES (%s, %s, %s, %s, %s, %s) RETURNING user_id;"
)
SQL_UPDATE_PASSWORD = (
    "UPDATE users SET password_hash = %s WHERE user_id = %s RETURNING user_id;"
)


def create_or_update_power_user():
    """
    Tworzy lub aktualizuje użytkownika z pełnymi uprawnieniami biznesowymi
    (full access w aplikacji), ale BEZ uprawnień admina (is_admin = FALSE).
    """
    email = os.getenv("POWER_EMAIL", "power@example.com").strip()
    password = os.getenv("POWER_PASSWORD", "power")
    company_id = os.getenv("POWER_COMPANY", "SMB")
    plan = os.getenv("POWER_PLAN", "enterprise")
    user_id = os.getenv("POWER_USER_ID", "power")  # stabilne ID dla seedowanego usera

    row = fetch_one(SQL_GET_USER_BY_EMAIL, (email,))
    pwd_hash = hasher.hash(password)

    if row:
        # Aktualizujemy tylko hasło istniejącego usera
        execute(SQL_UPDATE_PASSWORD, (pwd_hash, row["user_id"]), returning=True)
        print(f"Updated password for existing non-admin user: {email}")
        return

    # Tworzymy nowego użytkownika z pełnym planem, ale bez admina
    execute(
        SQL_INSERT_USER,
        (user_id, email, company_id, pwd_hash, False, plan),
        returning=True,
    )
    print("Power (non-admin) user created successfully!")
    print(f"Email: {email}")
    print("Password: (taken from POWER_PASSWORD env)")


if __name__ == "__main__":
    try:
        create_or_update_power_user()
    except Exception as e:
        print(f"Error creating/updating power user: {e}")
        sys.exit(1)
