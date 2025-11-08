#!/usr/bin/env bash
# scripts/check_endpoints.sh
# Quick endpoint checks for local dev environment (bash - WSL/Git Bash)
# Usage: bash ./scripts/check_endpoints.sh

HOST="127.0.0.1"
PORT=8080
BASE="http://${HOST}:${PORT}"

truncate_text() {
  local s="$1"
  local len=${2:-800}
  if [ -z "$s" ]; then
    printf ""
    return
  fi
  if [ ${#s} -le $len ]; then
    printf "%s" "$s"
  else
    printf "%s...(truncated)" "${s:0:$len}"
  fi
}

echo "Checking site: $BASE"

echo "\nGET / -> first 400 chars"
index=$(curl -sS "$BASE/" 2>/dev/null || true)
truncate_text "$index" 400

echo "\n\nGET /api/healthz -> status and body"
health=$(curl -sS -w "\nHTTP_STATUS:%{http_code}" "$BASE/api/healthz" 2>/dev/null || true)
echo "$health"

echo "\nGET /api/products -> truncated"
prod=$(curl -sS "$BASE/api/products" 2>/dev/null || true)
truncate_text "$prod" 800

echo "\n\nGET /api/customers -> truncated"
cust=$(curl -sS "$BASE/api/customers" 2>/dev/null || true)
truncate_text "$cust" 800

echo "\n\nNote: run this from WSL or Git Bash to avoid PowerShell curl alias issues."

