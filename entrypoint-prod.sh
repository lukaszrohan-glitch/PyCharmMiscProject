#!/bin/sh
APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -qi postgres; then
  echo "Waiting for database..."
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
      echo "Database not reachable after $ATTEMPTS attempts" >&2
      exit 1
    fi
    sleep 1
  done
fi

if [ -f alembic.ini ]; then
  echo "Running Alembic migrations..."
  alembic upgrade head || true
fi

echo "Setting up log rotation..."
if command -v logrotate &> /dev/null; then
  cron -f -l 2 &
  CRON_PID=$!
  echo "Log rotation enabled (PID: $CRON_PID)"
else
  echo "logrotate not available, log rotation disabled"
fi

echo "Starting uvicorn $APP_MODULE on port $PORT"
exec uvicorn "$APP_MODULE" --host 0.0.0.0 --port "$PORT"
