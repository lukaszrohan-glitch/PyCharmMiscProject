#!/usr/bin/env python3
import os
from passlib.hash import pbkdf2_sha256 as hasher
from db import fetch_one, execute

ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@arkuszowniasmb.pl')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'SMB#Admin2025!')

row = fetch_one("SELECT user_id FROM users WHERE email = %s LIMIT 1;", (ADMIN_EMAIL,))
if row:
    execute(
        "UPDATE users SET password_hash = %s, is_admin = %s, active = %s WHERE user_id = %s",
        (hasher.hash(ADMIN_PASSWORD), True, True, row['user_id']),
        returning=False,
    )
    print(f"Updated admin user password for {ADMIN_EMAIL}")
else:
    execute(
        "INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) VALUES (%s,%s,%s,%s,%s,%s)",
        ('admin', ADMIN_EMAIL, 'SMB', hasher.hash(ADMIN_PASSWORD), True, 'enterprise'),
        returning=False,
    )
    print(f"Created admin user {ADMIN_EMAIL}")

