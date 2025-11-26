#!/usr/bin/env python3
import os, json, sys
import http.client

API_HOST = "backend"
API_PORT = 8000
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@arkuszowniasmb.pl")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "SMB#Admin2025!")

conn = http.client.HTTPConnection(API_HOST, API_PORT, timeout=10)
payload = json.dumps({"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
conn.request(
    "POST",
    "/api/auth/login",
    body=payload,
    headers={"Content-Type": "application/json"},
)
resp = conn.getresponse()
body = resp.read().decode()
print("LOGIN status:", resp.status, "body:", body)
if resp.status != 200:
    sys.exit(1)
login_data = json.loads(body)
access = login_data.get("tokens", {}).get("access_token") or login_data.get(
    "access_token"
)
if not access:
    print("No access token in login response")
    sys.exit(2)
conn.close()
conn = http.client.HTTPConnection(API_HOST, API_PORT, timeout=10)
conn.request("GET", "/api/user/profile", headers={"Authorization": f"Bearer {access}"})
resp2 = conn.getresponse()
body2 = resp2.read().decode()
print("PROFILE status:", resp2.status, "body:", body2)
if resp2.status != 200:
    sys.exit(3)
print("Auth flow OK")
