#!/bin/bash
set -e

APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

# Ustalanie DATABASE_URL z priorytetem: PRIVATE -> PUBLIC -> brak (SQLite)
if [ -z "$DATABASE_URL" ]; then
  if [ -n "$DATABASE_PRIVATE_URL" ]; then
    export DATABASE_URL="$DATABASE_PRIVATE_URL"
    echo "Using DATABASE_PRIVATE_URL (no egress fees)"
  elif [ -n "$DATABASE_PUBLIC_URL" ]; then
    export DATABASE_URL="$DATABASE_PUBLIC_URL"
    echo "WARNING: Using DATABASE_PUBLIC_URL - this may incur egress fees. Consider switching to DATABASE_PRIVATE_URL."
  fi
fi

# Walidacja DATABASE_URL + diagnostyka
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set, using SQLite fallback"
elif echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  echo "ERROR: DATABASE_URL appears to be a template string (not substituted). Check Railway environment variables."
  exit 1
elif echo "$DATABASE_URL" | grep -qi postgres; then
  DB_URL_DISPLAY=$(echo "$DATABASE_URL" | sed 's/:.*@/@/g')
  echo ""
  echo "=== Database Connection Diagnostics ==="
  python3 << 'DIAGEOF'
import os
from urllib.parse import urlparse

url = os.environ.get('DATABASE_URL', '')
if url:
    p = urlparse(url)
    print(f"URL Host:     {p.hostname}")
    print(f"URL Port:     {p.port}")
    print(f"URL Database: {p.path}")
    print(f"URL User:     {p.username}")
    print(f"URL Password: {'***' if p.password else '(none)'}")
    if 'sslmode' in url:
        import re
        sslmode = re.search(r'sslmode=([^&\s]+)', url)
        print(f"URL SSL Mode: {sslmode.group(1) if sslmode else 'not set'}")
    print("")
    print(f"Masked CONNECTION_URL: {p.scheme}://{p.username}:***@{p.hostname}:{p.port}{p.path}")
DIAGEOF

  echo "=== Starting Connection Wait (timeout: 300s) ==="
  echo ""
  echo "Waiting for PostgreSQL database at $DB_URL_DISPLAY..."

  ATTEMPTS=0
  MAX_ATTEMPTS=300
  WAIT_TIME=1

  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    python3 << 'PYEOF'
import os
import sys
from urllib.parse import urlparse

database_url = os.environ.get('DATABASE_URL', '')
if not database_url:
    print("[DB Check] No DATABASE_URL", file=sys.stderr)
    sys.exit(0)

try:
    import psycopg2
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

try:
    parsed = urlparse(database_url)
    host = parsed.hostname or 'localhost'
    port = parsed.port or 5432

    if not HAS_PSYCOPG2:
        # Fallback: zwykły socket check
        print("[DB Check] psycopg2 not available, doing socket check only", file=sys.stderr)
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect((host, int(port)))
        s.close()
        sys.exit(0)

    user = parsed.username or 'postgres'
    password = parsed.password or ''
    database = parsed.path.lstrip('/') or 'postgres'

    print(f"[DB Check] Attempting connection to {host}:{port}/{database}", file=sys.stderr)

    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connect_timeout=10,
        sslmode='allow'
    )
    conn.close()
    print("[DB Check] Connection successful", file=sys.stderr)
    sys.exit(0)

except Exception as e:
    msg = str(e)
    # Typowe błędy auth/nazwy bazy – akceptujemy, aplikacja wystartuje
    if any(x in msg for x in ("FATAL", "does not exist", "password authentication")):
        print(f"[DB Check] Authentication/DB error (acceptable): {msg}", file=sys.stderr)
        sys.exit(0)
    print(f"[DB Check] Connection error: {type(e).__name__}: {msg}", file=sys.stderr)
    sys.exit(1)
PYEOF

    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo "✓ Database is reachable (after $ATTEMPTS attempts)"
      break
    fi

    ATTEMPTS=$((ATTEMPTS+1))
    if [ $((ATTEMPTS % 30)) -eq 0 ]; then
      echo "Still waiting for database... ($ATTEMPTS/$MAX_ATTEMPTS seconds)"
    fi

    sleep $WAIT_TIME
    if [ $WAIT_TIME -lt 10 ]; then
      WAIT_TIME=$((WAIT_TIME + 1))
    fi
  done

  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "ERROR: Database not reachable after ${MAX_ATTEMPTS}s at $DB_URL_DISPLAY"
    echo "Check that:"
    echo "  - DATABASE_URL environment variable is correctly set in Railway"
    echo "  - PostgreSQL instance is running"
    echo "  - Network connectivity exists between app and database"
    exit 1
  fi
fi

# Alembic migrations (jeśli mamy config i DATABASE_URL)
if [ -f alembic.ini ] && [ -n "$DATABASE_URL" ] && ! echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  echo "Running Alembic migrations..."
  if ! alembic upgrade head; then
    echo "ERROR: Alembic migrations failed"
    exit 1
  fi
  echo "✓ Migrations completed successfully"
fi

echo "Starting uvicorn $APP_MODULE on port $PORT"
exec uvicorn "$APP_MODULE" --host 0.0.0.0 --port "$PORT"
