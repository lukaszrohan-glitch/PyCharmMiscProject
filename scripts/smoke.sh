#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:8000}"
echo "== Smoke test base: $BASE =="

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

curl -fsS "$BASE/healthz" >/dev/null && pass "/healthz" || fail "/healthz"
curl -fsS "$BASE/readyz"  >/dev/null && pass "/readyz"  || fail "/readyz"
curl -fsS "$BASE/api/products" >/dev/null && pass "/api/products" || fail "/api/products"
curl -fsS "$BASE/api/orders"   >/dev/null && pass "/api/orders"   || fail "/api/orders"

FROM="$(date +%Y-%m-01)"
TO="$(date -d "$FROM +1 month -1 day" +%Y-%m-%d 2>/dev/null || date -v+1m -v-1d +%Y-%m-%d 2>/dev/null || echo "$FROM")"

curl -fsS "$BASE/api/timesheets/summary?from=$FROM&to=$TO" >/dev/null && pass "/api/timesheets/summary" || fail "/api/timesheets/summary"
curl -fsS "$BASE/api/timesheets/weekly-summary?from=$FROM&to=$TO" >/dev/null && pass "/api/timesheets/weekly-summary" || fail "/api/timesheets/weekly-summary"

# Optional JWT admin tests if ADMIN_EMAIL/PASSWORD available
TOKEN=""
if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  RESP=$(curl -fsS -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}") || fail "/api/auth/login"
  # Try Python to parse JSON if available; else skip JWT tests
  if command -v python3 >/dev/null 2>&1; then
    TOKEN=$(python3 - << 'PY'
import json,sys
print(json.loads(sys.stdin.read()).get('tokens',{}).get('access_token',''))
PY
    <<<"$RESP")
  fi
  if [[ -n "$TOKEN" ]]; then
    curl -fsS "$BASE/api/timesheets/pending?from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN" >/dev/null && pass "/api/timesheets/pending" || fail "/api/timesheets/pending"
  else
    echo "[WARN] Could not parse access token; skipping JWT-only tests"
  fi
fi

# CSV endpoints (download discarded)
curl -fsS -o /dev/null "$BASE/api/timesheets/export.csv?from=$FROM&to=$TO" && pass "/api/timesheets/export.csv" || fail "/api/timesheets/export.csv"
curl -fsS -o /dev/null "$BASE/api/timesheets/export-summary.csv?from=$FROM&to=$TO" && pass "/api/timesheets/export-summary.csv" || fail "/api/timesheets/export-summary.csv"

echo "== Smoke test completed =="

