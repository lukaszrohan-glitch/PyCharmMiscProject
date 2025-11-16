#!/bin/sh
APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set, using SQLite fallback"
elif echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  echo "ERROR: DATABASE_URL appears to be a template string (not substituted). Check Railway environment variables."
  exit 1
elif echo "$DATABASE_URL" | grep -qi postgres; then
  echo "Waiting for database at $(echo $DATABASE_URL | sed 's/:.*@/@/g')..."
  ATTEMPTS=0
  MAX_ATTEMPTS=300
  WAIT_TIME=1
  
  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    python - <<'EOF'
import os, socket, sys, time
from urllib.parse import urlparse
try:
    u = os.environ.get('DATABASE_URL')
    if not u:
        sys.exit(0)
    p = urlparse(u)
    host = p.hostname or 'db'
    port = p.port or 5432
    s = socket.socket()
    s.settimeout(3.0)
    s.connect((host, int(port)))
    s.close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
EOF
    
    if [ $? -eq 0 ]; then
      echo "✓ Database is reachable (after $ATTEMPTS attempts)"
      break
    fi
    
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $((ATTEMPTS % 30)) -eq 0 ]; then
      echo "Still waiting... ($ATTEMPTS/$MAX_ATTEMPTS seconds)"
    fi
    
    sleep $WAIT_TIME
    if [ $WAIT_TIME -lt 10 ]; then
      WAIT_TIME=$((WAIT_TIME + 1))
    fi
  done
  
  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "ERROR: Database not reachable after ${MAX_ATTEMPTS}s"
    echo "Deployment cannot proceed without database connection"
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
