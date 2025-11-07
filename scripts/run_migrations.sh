#!/usr/bin/env bash
# Run Alembic migrations (Unix)
# Usage: ./scripts/run_migrations.sh

# Example: DATABASE_URL=postgresql://user:pass@localhost:5432/db ./scripts/run_migrations.sh

cd "$(dirname "$0")/.."
python -m alembic upgrade head

