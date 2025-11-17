# Repository Guidelines

## Project Structure & Module Organization
- Backend FastAPI app lives at `main.py` with domain routers in `routers/` (orders, products, customers, employees, timesheets, inventory, analytics, auth, admin).
- Shared settings and helpers: `config.py`, `security.py`, `db.py`, `admin_audit.py`, plus central schemas in `schemas.py`.
- SQL assets: `scripts/init.sql` seeds Postgres schema; `_dev_db.sqlite` is the default dev DB. Alembic config sits in `alembic/`.
- Frontend SPA resides in `frontend/` (React); API helpers in `frontend/src/services/api.js`; admin views in `frontend/src/components/*`.
- Tests are under `tests/` (pytest). Supporting ops and health scripts live in `scripts/` and repo-level `*.cmd`/`*.ps1` utilities.

## Build, Test, and Development Commands
- Backend install: `pip install -r requirements.txt` (use `requirements-dev.txt` for full dev tooling, `requirements-postgres.txt` for Postgres drivers).
- Run backend (reload): `uvicorn main:app --reload --host 0.0.0.0 --port 8000` (Swagger at `/docs`).
- Run frontend: `cd frontend && npm install && npm run dev` (Vite dev server).
- Execute tests: `pytest` from repo root (respects `tests/`).
- SQLite cleanup: remove `_dev_db.sqlite` if you need a fresh local database; Postgres setup uses `scripts/init.sql`.

## Architecture Overview
- FastAPI app (`main.py`) wires domain routers via dependency-injected services in `db.py`, `security.py`, and `config.py`.
- Persistence: SQLite for dev (`_dev_db.sqlite`) and Postgres in production (DDL in `scripts/init.sql`; alembic for migrations).
- Frontend SPA talks to backend REST endpoints and expects JWT for admin flows; admin-key routes remain for legacy admin API keys.

## Coding Style & Naming Conventions
- Python: follow PEP 8, prefer explicit imports, snake_case for functions/vars, PascalCase for Pydantic models, and UPPER_SNAKE for constants.
- FastAPI routers: group endpoints by domain in `routers/<domain>.py`; keep request/response models in `schemas.py` when shared.
- React: use functional components, hooks, and camelCase props; colocate component-specific styles/assets near the component.
- Env files: `.env` for local defaults; do not commit secrets. Reference values via `config.settings`.

## Testing Guidelines
- Framework: pytest. Name tests `test_*.py` and functions `test_*`.
- Target coverage: exercise new endpoints, auth checks, and DB interactions. Include regression tests for CSV import, admin audit, and timesheet summaries when touching those areas.
- For HTTP tests use `httpx.AsyncClient` with the FastAPI app factory pattern (see existing `tests/`).

## Commit & Pull Request Guidelines
- Commits: keep messages in imperative mood (e.g., "Add admin audit endpoint"). Squash or keep small logical commits as preferred, but avoid mixing unrelated changes.
- PRs: include a brief summary, testing notes (commands run), and links to related issues. Add screenshots/GIFs for UI changes in `frontend/`. Call out schema or security-impacting changes explicitly.

## CI / CD Notes
- Pip audit/check: repository includes dependency checks; keep `pip check` or equivalent passing before merging.
- Lint/format: run project lint/format hooks if configured (respect `requirements-dev.txt` tools); keep CI green before raising PRs.
- Railway: deployment docs in `README_RAILWAY.md`; Postgres env vars and CORS origins must be set per `config.py`.

## Security & Configuration Tips
- API writes require JWT or admin key; maintainers should verify `security.py` flows when modifying auth.
- Keep `.env` local; production secrets come from environment variables. Validate CORS/domain settings in `config.py` when adding new frontends.
- Database: migrations live in `alembic/`; keep `scripts/init.sql` idempotent for Postgres deploys.
