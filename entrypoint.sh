#!/bin/sh
APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set, using SQLite fallback"
elif echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  echo "WARNING: DATABASE_URL appears to be a template string (not substituted)"
elif echo "$DATABASE_URL" | grep -qi postgres; then
  echo "Waiting for database at $(echo $DATABASE_URL | sed 's/:.*@/@/g')..."
  ATTEMPTS=0
  until python - <<'EOF'
import os, socket, sys
from urllib.parse import urlparse
try:
    u = os.environ.get('DATABASE_URL')
    if not u:
        sys.exit(0)
    p = urlparse(u)
    host = p.hostname or 'db'
    port = p.port or 5432
    s = socket.socket()
    s.settimeout(1.0)
    s.connect((host, int(port)))
    s.close()
except Exception:
    sys.exit(1)
EOF
  do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -gt 60 ]; then
      echo "Warning: Database not reachable after $ATTEMPTS attempts, continuing anyway"
      break
    fi
    sleep 1
  done
fi

if [ -f alembic.ini ] && [ -n "$DATABASE_URL" ] && ! echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  echo "Running Alembic migrations..."
  alembic upgrade head || echo "Note: Migrations failed or not applicable"
fi

echo "Starting uvicorn $APP_MODULE on port $PORT"
exec uvicorn "$APP_MODULE" --host 0.0.0.0 --port "$PORT"
