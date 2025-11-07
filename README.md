SMB Tool — backend + PowerQuery integration

Quickstart (local, development)

Requirements: Docker & Docker Compose (for full-stack) or Node + Python for dev runs.

Development (fast, no Postgres required)

1) Create & activate venv, install dev deps

```powershell
py -3 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements-dev.txt
```

2) Run backend (sqlite fallback) — dev server listens on 8001

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

3) Run frontend (Vite)

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the frontend reads `frontend/.env` VITE_API_BASE (default http://localhost:8001/api).

Run unit tests

```powershell
pytest -q
```

Production / shareable (Docker Compose)

Use the production compose to build the backend (Postgres) and a static frontend served by nginx. This produces a shareable stack you can run on a server.

```bash
# build and start (production compose)
docker-compose -f docker-compose.prod.yml up --build -d
# frontend will be on http://<host>/ (port 80), backend on http://<host>:8000
```

E2E and CI

A GitHub Actions workflow is included at `.github/workflows/ci.yml` that:
- runs Python unit tests against a Postgres service
- runs Playwright E2E tests (chromium) against the running stack
- builds docker images

Notes and troubleshooting

- Local dev uses sqlite for convenience. To use Postgres locally, install Postgres and set `DATABASE_URL` or use the `docker-compose.prod.yml` stack.
- If you see `psycopg2` build errors on Windows, install Visual C++ Build Tools or use the production Docker image which installs required system packages.
- The frontend expects `VITE_API_BASE` to point at the backend `/api` root (e.g. http://localhost:8001/api for dev or http://<host>/api in production). Restart Vite after changing `.env`.

Power Query / Power BI

Use the provided Power Query M templates in `powerquery/` to fetch data from the endpoints. Adjust `apiBase` and API keys if needed.

Next steps
- Improve auth (rotateable API keys or JWT + user management)
- Add Alembic migrations (migrate from scripts/init.sql)
- Add more E2E coverage and CI gating for deployment

## Run & Test (concise)

- Create and activate virtualenv (Windows PowerShell):

```powershell
py -3 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```

- Run backend (sqlite fallback) for development:

```powershell
# development server (sqlite fallback)
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Run frontend (from `frontend/`):

```powershell
cd frontend
npm ci
npm run dev
```

- Run tests (unit + auth tests):

```powershell
pytest -q
```

## Migrations (Alembic)

- To run alembic migrations locally you can use the provided helper scripts:

PowerShell:

```powershell
# set DATABASE_URL if you want to run against Postgres
$env:DATABASE_URL = 'postgresql://user:pass@localhost:5432/smbtool'
./scripts/run_migrations.ps1
```

Bash / WSL:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/smbtool ./scripts/run_migrations.sh
```

Note: Development SQLite fallback uses the minimal schema defined in `db._init_sqlite_schema` for convenience. Alembic migrations are present in `alembic/versions` for Postgres deployments.

## Admin UI

- The frontend includes a simple Admin section (in the app main page) to list/create/delete API keys. Protect it by setting `ADMIN_KEY` in your environment (backend) and `VITE_ADMIN_KEY` in the frontend `.env` if used.

## Troubleshooting & terminal logs

If you saw memory errors in GitHub Desktop or during git operations ("Not enough memory resources are available to process this command"), common fixes:

- Free memory: close large apps (Chrome, IDEs), or reboot. Use Task Manager (Ctrl+Shift+Esc).
- Run git maintenance to shrink the repo and reduce memory pressure:

```powershell
git gc --aggressive --prune=now
```

- Use the Git CLI (`git` and `gh`) instead of GitHub Desktop when the UI fails.
- If you need to stop the development backend (uvicorn) started earlier, find and kill its process:

PowerShell:

```powershell
# find uvicorn/python processes
Get-Process python | Where-Object { $_.Path -like '*python*' } | Format-Table Id,ProcessName,WS
# kill by PID
Stop-Process -Id <PID>
```

CMD:

```cmd
tasklist /FI "IMAGENAME eq python.exe"
taskkill /PID <PID> /F
```

- If `gh auth login` prompts you to complete authentication in the browser, complete that flow. Do not paste passwords into chat; use the browser or a personal access token.
