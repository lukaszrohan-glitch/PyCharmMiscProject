#!/bin/sh
set -e
APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

# Wait for Postgres if DATABASE_URL references postgres
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -qi postgres; then
  echo "Waiting for database... ($DATABASE_URL)"
  ATTEMPTS=0
  until python - <<'PY'
import os, socket, sys
from urllib.parse import urlparse
u = os.environ.get('DATABASE_URL')
if not u:
    sys.exit(0)
p = urlparse(u)
host = p.hostname or 'db'
port = p.port or 5432
s = socket.socket()
try:
    s.settimeout(1.0)
    s.connect((host, int(port)))
    s.close()
except Exception:
    sys.exit(1)
PY
  do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -gt 60 ]; then
      echo "Database not reachable after $ATTEMPTS attempts" >&2
      exit 1
    fi
    sleep 1
  done
fi

# Run alembic migrations if config present
if [ -f alembic.ini ]; then
  echo "Running Alembic migrations..."
  alembic upgrade head || echo "Alembic failed (continuing)" >&2
fi

# Start uvicorn
echo "Starting uvicorn $APP_MODULE on port $PORT"
exec uvicorn "$APP_MODULE" --host 0.0.0.0 --port "$PORT"
