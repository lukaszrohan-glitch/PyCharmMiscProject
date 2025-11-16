#!/bin/bash
set -e
APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set, using SQLite fallback"
elif echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  echo "ERROR: DATABASE_URL appears to be a template string (not substituted). Check Railway environment variables."
  exit 1
elif echo "$DATABASE_URL" | grep -qi postgres; then
  DB_URL_DISPLAY=$(echo "$DATABASE_URL" | sed 's/:.*@/@/g')
  echo "Waiting for PostgreSQL database at $DB_URL_DISPLAY..."
  
  ATTEMPTS=0
  MAX_ATTEMPTS=300
  WAIT_TIME=1
  
  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    python3 - <<'PYEOF'
import os
import sys
import psycopg2
from urllib.parse import urlparse

try:
    database_url = os.environ.get('DATABASE_URL', '')
    if not database_url:
        sys.exit(0)
    
    parsed = urlparse(database_url)
    host = parsed.hostname or 'localhost'
    port = parsed.port or 5432
    user = parsed.username or 'postgres'
    password = parsed.password or ''
    database = parsed.path.lstrip('/') or 'postgres'
    
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connect_timeout=5,
        sslmode='require'
    )
    conn.close()
    sys.exit(0)
except psycopg2.OperationalError as e:
    if 'FATAL' in str(e) or 'does not exist' in str(e):
        sys.exit(0)
    sys.exit(1)
except Exception as e:
    sys.exit(1)
PYEOF
    
    if [ $? -eq 0 ]; then
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
