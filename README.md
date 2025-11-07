# SMB Tool — Production Management System

🇬🇧 **English** | [🇵🇱 Polski](README_PL.md)

---

## 📚 Documentation

- **English:**
  - [Quick Start Guide](QUICKSTART.md)
  - [Network Access Guide](NETWORK_ACCESS_GUIDE.md)
  - [Docker Troubleshooting](DOCKER_TROUBLESHOOTING.md)
  
- **Polski:**
  - [Szybki Start](QUICKSTART_PL.md)
  - [Przewodnik Dostępu Sieciowego](NETWORK_ACCESS_GUIDE_PL.md)
  - [Rozwiązywanie Problemów z Dockerem](DOCKER_TROUBLESHOOTING_PL.md)

---

## ⚡ Quick Start

```bash
# Start the application
docker compose up -d

# Open in browser
http://localhost:5173
```

**Full documentation:** See [QUICKSTART.md](QUICKSTART.md) or [QUICKSTART_PL.md](QUICKSTART_PL.md)

---

## 🎯 Overview

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

## Frontend Development (Node not installed?)

If `where node` returns nothing, you have three easy options:

1. Use the helper script (adds default Node path for this session):

```cmd
scripts\set-node-path.cmd
```

2. Install Node LTS from https://nodejs.org (check "Add to PATH"). Close & reopen the terminal, then verify:

```cmd
where node
node -v
npm -v
```

3. Use Docker (no local Node needed):

```powershell
# from repo root
docker run -it --rm -p 5173:5173 -v ${PWD}/frontend:/app -w /app node:18-alpine sh -c "npm install && npm run dev -- --host 0.0.0.0"
```

### Quick scripts

| Purpose | Command (Windows cmd) |
|---------|-----------------------|
| Start dev server | `scripts\frontend-dev.cmd` |
| Build ESM+CJS lib | `scripts\frontend-build-lib.cmd` |
| Run audit fix | `scripts\frontend-audit-fix.cmd` |

The dev server runs at http://localhost:5173 (Polish UI default, 🇵🇱/🇬🇧 toggle in header).

**Network access:** The dev server listens on `0.0.0.0`, so you can access from other devices on your network:
- Find your local IP: `ipconfig` (look for IPv4 Address, e.g., 192.168.1.x)
- Access from network: `http://192.168.1.x:5173`

### Blank white page / `React is not defined`
Most common causes & fixes:

1. **Dev server not running** → start it (`scripts\frontend-dev.cmd`).
2. **Cached stale module** → Hard refresh (Ctrl+F5) or open in Incognito. **For network access:** clear cache on the remote device too.
3. **Node modules missing (first run)** → `npm install` (or use the Docker command above).
4. **React fallback:** `index.html` now loads React UMD unconditionally, so `window.React` is always available. To verify, open DevTools Console and run:

```js
window.React
```
Should output an object. If undefined after hard refresh, you might be hitting a cached version or a different server instance.

5. **Confirm App import:** open `http://localhost:5173/src/App.jsx` (or `http://YOUR_IP:5173/src/App.jsx`) and verify it starts with `import React`.

6. **Network-specific fix:** If accessing from another device on the network still shows the error after all the above:
   - Ensure Windows Firewall allows port 5173 (or disable temporarily to test).
   - Restart the dev server with the updated config (`scripts\frontend-dev.cmd`).
   - On the remote device, open an incognito/private window to bypass all cache.

### Production static build locally (without full compose)

```powershell
cd frontend
npm install
npm run build
npx serve -s dist -l 4173
# then open http://localhost:4173
```

Or via Docker multi-stage (already wired in `frontend/Dockerfile`).

## Library build (ESM & CJS)

We ship a simple library bundle for embedding the App elsewhere:

```powershell
scripts\frontend-build-lib.cmd
```
Outputs: `frontend/dist-lib/smbtool-app.es.js` and `frontend/dist-lib/smbtool-app.cjs.js`.

Quick CJS smoke test (PowerShell):

```powershell
node -e "const lib=require('./frontend/dist-lib/smbtool-app.cjs.js'); console.log(Object.keys(lib))"
```
Expected keys include `App` and `createAppRoot`.

## Internationalization (Polish default)

The UI defaults to Polish (pl) and stores language choice in `localStorage["app_lang"]`. Use 🇵🇱 / 🇬🇧 toggle to switch. Translation source: `frontend/src/i18n.js`.

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

## Complete Docker Reset

If you encounter persistent issues with Docker containers or need a fresh start, use the reset script:

**Windows (cmd.exe):**
```cmd
scripts\reset-docker.cmd
```

**Linux/Mac/WSL:**
```bash
chmod +x scripts/reset-docker.sh
./scripts/reset-docker.sh
```

### Quick fix for "invalid file request node_modules" error:

If you see: `failed to solve: invalid file request node_modules/.bin/.baseline-browser-mapping-CrYaFx2q`

This happens when Docker tries to copy corrupted node_modules symlinks. Quick fix:

**Windows:**
```cmd
scripts\fix-frontend-build.cmd
```

**Manual fix:**
```cmd
rmdir /s /q frontend\node_modules
docker compose build --no-cache frontend
docker compose up -d frontend
```

**Manual reset (if scripts don't work):**
```powershell
# Clean local node_modules first
Remove-Item -Recurse -Force frontend\node_modules -ErrorAction SilentlyContinue

# Stop and remove everything
docker compose down -v

# Clean Docker system
docker system prune -f

# Rebuild from scratch
docker compose build --no-cache

# Start services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

This will:
1. Stop and remove all containers, networks, and volumes
2. Clean up dangling images
3. Rebuild all images without cache
4. Start fresh services
5. Create a new database with seed data

After reset, access:
- Frontend: http://localhost:5173 (Polish UI, 🇵🇱/🇬🇧 toggle)
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

Default credentials:
- API Key: `changeme123`
- Admin Key: `test-admin-key`

## Can't See Anything in Docker Containers?

If `docker ps` or `docker compose ps` shows nothing, here are the most common causes:

### 1. Docker Desktop not running
**Check:** Open Docker Desktop from Start Menu. Wait for the whale icon in system tray to be green/white (not red).

**Quick diagnostic:**
```cmd
scripts\docker-diagnostic.cmd
```

### 2. No containers exist yet
**Fix:** Build and start:
```cmd
docker compose up -d --build
```

### 3. Containers crashed/exited
**Check logs:**
```cmd
docker compose logs backend
docker compose logs frontend
```

**Common issues:**
- Port conflicts (8000, 5173, 5432 already in use)
- Build failures
- Missing .env file

**Fix:** Rebuild everything:
```cmd
scripts\reset-docker.cmd
```

### 4. Terminal not showing output
**Try:**
- Close and reopen terminal
- Use cmd.exe instead of PowerShell
- Check Docker Desktop GUI → Containers tab directly

### 5. Alternative: Run locally WITHOUT Docker

If Docker continues to have issues, run everything locally:

```cmd
scripts\start-local.cmd
```

This starts:
- Backend (Python + SQLite) on http://localhost:8000
- Frontend (Vite) on http://localhost:5173

No Docker needed! Opens two terminal windows for backend and frontend.

**For detailed troubleshooting, see:** [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)

