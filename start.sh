#!/usr/bin/env bash
set -e

APP_MODULE=${APP_MODULE:-main:app}
PORT=${PORT:-8000}

# Best-effort migrations in background so liveness (/healthz) is available ASAP
if [ -f alembic.ini ] && [ -n "$DATABASE_URL" ] && ! echo "$DATABASE_URL" | grep -qE '^\$\{|^\$'; then
  (
    echo "[start] Launching Alembic migrations in background"
    attempts=0
    max_attempts=10
    until alembic upgrade head; do
      attempts=$((attempts+1))
      if [ $attempts -ge $max_attempts ]; then
        echo "[start] Alembic failed after $attempts attempts; continuing app"
        break
      fi
      echo "[start] Alembic failed (attempt $attempts/$max_attempts). Retrying in 5s..."
      sleep 5
    done
    echo "[start] Alembic background task finished"
  ) &
else
  echo "[start] Skipping migrations (no alembic.ini or DATABASE_URL not set)"
fi

echo "[start] Starting uvicorn $APP_MODULE on port $PORT"
exec uvicorn "$APP_MODULE" --host 0.0.0.0 --port "$PORT"

