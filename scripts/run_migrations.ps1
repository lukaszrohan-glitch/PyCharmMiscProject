# Run Alembic migrations (PowerShell)
# Usage: ./scripts/run_migrations.ps1

# Ensure DATABASE_URL env var is set, e.g.:
# $env:DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'

Set-Location -Path (Resolve-Path "${PSScriptRoot}\..")
python -m alembic upgrade head

