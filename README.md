# Synterra - Manufacturing Management System

Manufacturing and order management system for small and medium businesses.

## Refactor & Features – 2025-11-16

This session focused on sustainability and usability. Summary of the changes:

- Backend modularization (routers)
  - Added `routers/` and moved endpoints by domain:
    - `routers/orders.py` – `/api/orders`, `/api/order-lines`
    - `routers/products.py` – `/api/products`
    - `routers/customers.py` – `/api/customers`
    - `routers/employees.py` – `/api/employees`
    - `routers/timesheets.py` – `/api/timesheets`
    - `routers/inventory.py` – `/api/inventory`
    - `routers/analytics.py` – `/api/finance`, `/api/shortages`, `/api/planned-time`
    - `routers/auth.py` – `/api/auth/*`, `/api/user/profile`
    - `routers/admin.py` – admin users/plans (JWT), admin API keys (x-admin-key), admin audit, import CSV/JSON
  - `main.py` now includes these routers. Legacy handlers are still present for safety; they can be deleted in the next cleanup pass.

- Centralized configuration (Pydantic Settings)
  - New `config.py` using `pydantic-settings` to load `.env` and env vars.
  - DB pooling and timeouts (`db.py`), JWT secrets/expirations (`user_mgmt.py`), and CORS (`main.py`) read from `config.settings`.
  - New deps: `pydantic-settings`, `python-multipart` (already added to `requirements.txt`).

- Hardened onboarding for writes
  - New `security.py` consolidates `check_api_key` and `check_admin_key`.
  - WRITE endpoints now require a valid JWT or API key. The old behavior that allowed unauthenticated writes when no API keys existed has been removed. Public GETs remain accessible.

- Admin audit logging
  - New `admin_audit.py` with SQLite and Postgres support.
  - Tables created in both environments:
    - SQLite: created in `db._init_sqlite_schema`.
    - Postgres: created in `scripts/init.sql` (idempotent DDL).
  - Admin actions audited: `create_user`, `create_plan`, `import_json`, `import_csv`.
  - New endpoint: `GET /api/admin/audit?limit=100` (JWT admin) to view events.

- CSV import (schema-aware) with UploadFile
  - Path unchanged: `POST /api/import/csv` (moved to `routers/admin.py`).
  - Accepts JSON `{ entity_type, data }` OR multipart form-data with `entity_type` + `file` (CSV).
  - Supports `orders, products, customers, employees, timesheets, inventory`.
  - Requires a JWT admin token.

- Frontend updates
  - New components:
    - `frontend/src/components/AdminImport.jsx` – CSV upload UI (JWT admin only).
    - `frontend/src/components/AdminAudit.jsx` – admin audit viewer (JWT admin only).
    - `frontend/src/components/Calendar.jsx` – lightweight month calendar used by Timesheets.
    - `frontend/src/components/Approvals.jsx` – admin view for pending timesheets approvals.
  - `frontend/src/AdminPage.jsx` includes both components at the bottom.
  - API client additions in `frontend/src/services/api.js`:
    - `adminImportCSV(entityType, file)` and `adminListAdminAudit(limit)`.
    - `getTimesheetSummary({fromDate, toDate, empId})` – hours per day.
    - `getTimesheetWeeklySummary({fromDate, toDate, empId})` – hours per ISO week.
    - `exportTimesheetsCSV({fromDate, toDate, empId})` – CSV download.
    - `approveTimesheet(tsId)`, `unapproveTimesheet(tsId)` – admin approvals.

### How to pick up tomorrow

1) Install/refresh backend dependencies
```bash
pip install -r requirements.txt
```

2) Run backend and frontend (dev)
```bash
# backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# frontend
cd frontend && npm install && npm run dev
```

3) Verify new features
- Open Swagger UI at `http://localhost:8000/docs` and check grouped tags.
- CSV import (JWT admin):
  - Login to obtain a token (POST `/api/auth/login`), then use the token in the UI components (or via curl/Postman).
  - In the SPA admin page, use the “Admin Import (CSV)” widget to upload a CSV with headers matching the entity fields.
- Admin audit:
  - `GET /api/admin/audit?limit=50` (JWT admin) or use the “Admin Audit” widget in the SPA.

4) DB notes
- Postgres: `scripts/init.sql` now includes `admin_audit` table and helpful indexes; it is idempotent and safe.
- SQLite (dev): schema auto-created on first connection, including `admin_audit`.

5) Security changes to be aware of
- WRITE endpoints no longer allow the old onboarding fallback (unauthenticated writes). Use JWT or an API key.
- Admin APIs:
  - `/api/admin/*` (users/plans/audit/import) require JWT admin.
  - `/api/admin/api-keys*` use `x-admin-key`.

### Next steps (queued)
- DONE: Remove legacy duplicated endpoints from `main.py` (all routes are now under `routers/*`).
- Optionally merge or further split routers based on team preference.
- Frontend: add clear tabs for JWT-admin vs x-admin-key sections; small UX polish.
- Add delete/disable for users/plans and audit those changes.
- Add e2e test(s) for CSV import and admin audit list.

### File map (new/updated)
- Added: `routers/` package – `orders.py`, `products.py`, `customers.py`, `employees.py`, `timesheets.py`, `inventory.py`, `analytics.py`, `auth.py`, `admin.py`.
- Added: `config.py`, `security.py`, `admin_audit.py`.
- Added: `docs.py` (OpenAPI tags), `frontend/src/components/Calendar.jsx`.
- Updated: `main.py` (includes routers, uses settings & middleware), `db.py` (settings + sqlite admin_audit), `user_mgmt.py` (JWT via settings), `scripts/init.sql` (indexes + admin_audit), `frontend/src/services/api.js`, `frontend/src/AdminPage.jsx`.
  Also: `routers/timesheets.py` (summaries, export, approvals), `frontend/src/components/Timesheets.jsx` calendar integration and summaries.

If you want me to proceed with removing the legacy routes from `main.py` first thing next, I can do that as a single cleanup patch and then run tests.

## Deploy to Railway.app

### 1. Connect GitHub Repository
1. Go to https://railway.app
2. Sign in with GitHub
3. Create "New Project" → "Deploy from GitHub"
4. Select `PyCharmMiscProject` repository

### 2. Add PostgreSQL
- Click "Add" in Railway dashboard
- Select "PostgreSQL"
- Railway auto-provisions the database with `DATABASE_URL`

### 3. Configure Environment Variables
In Railway project settings, add from `.env.example`:
- `ADMIN_KEY` - Admin authentication key
- `API_KEYS` - Comma-separated API keys  
- `JWT_SECRET` - JWT signing secret (min 32 bytes)
- `CORS_ORIGINS` - Your Railway domain + any custom domains

### 4. Deploy
- Push to GitHub `main` branch
- Railway auto-deploys automatically
- App is live at `https://<project>.up.railway.app`

### 5. Configure Custom Domain (Optional)
If using a custom domain, add CNAME record in your DNS provider:
- **Name**: `@` (or your subdomain)
- **Type**: `CNAME`
- **Value**: `9a5mflht.up.railway.app` (your Railway domain)
- Then add your domain in Railway project settings → Domains

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Backend Setup
```powershell
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend
$env:DATABASE_URL="sqlite:///./dev.db"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Dev mode with hot reload
npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000/api  
- **Health**: http://localhost:8000/healthz
- **Ready**: http://localhost:8000/readyz (checks DB + Alembic migrations)

## API Testing

### Check Application Health
```powershell
# Test health check
Invoke-WebRequest -Uri "http://localhost:8000/healthz" -UseBasicParsing

# Test Products endpoint with API key
$headers = @{'X-API-Key'='dev-key-change-in-production'}
Invoke-WebRequest -Uri "http://localhost:8000/api/products" -Headers $headers -UseBasicParsing
```

### Frontend Build
```powershell
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Railway.app (Production)
```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ https://<project>.up.railway.app
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Railway Container                         │
│  - FastAPI backend + React frontend built-in                │
│  - SSL/HTTPS automatic                                      │
│  - Auto-scaling & load balancing                            │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │   Railway PostgreSQL          │
        │   - Auto-provisioned          │
        │   - Via DATABASE_URL env var  │
        └───────────────────────────────┘
```

### Local Development
```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
└──────────────────────┬──────────────────────────────────────┘
       Frontend Dev │                 Backend
       http://localhost:5173      http://localhost:8000
                    │                     │
                    ↓                     ↓
        ┌─────────────────┐   ┌──────────────────────────┐
        │ Vite Dev Server │   │ FastAPI Dev Server       │
        │ - Hot reload    │   │ - Auto-reload            │
        └─────────────────┘   │ - Debug enabled          │
                              └──────────┬───────────────┘
                                         │
                                         ↓
                              ┌──────────────────────────┐
                              │  SQLite Database         │
                              │  - dev.db (local file)   │
                              └──────────────────────────┘
```

## Project Structure

```
C:\Users\lukas\PyCharmMiscProject\
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── styles/        # CSS files
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── dist/              # Built files (served by Railway)
│   ├── package.json
│   └── vite.config.js
├── alembic/               # Database migrations
│   ├── env.py            # Alembic environment
│   ├── script.py.mako
│   └── versions/         # Migration files
├── main.py                # FastAPI application
├── db.py                  # Database connection & ORM
├── auth.py               # Authentication & API keys
├── user_mgmt.py          # User management
├── schemas.py            # Pydantic models
├── queries.py            # SQL queries
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container image for Railway
├── railway.json          # Railway.app configuration
├── .env.example          # Environment variable template
├── entrypoint.sh         # Docker startup script
└── logs/                 # Application logs
```

## Configuration

### Environment Variables

For **local development**, create `.env`:
```env
DATABASE_URL=sqlite:///./dev.db
ADMIN_KEY=dev-admin-key-change-in-production
API_KEYS=dev-key-change-in-production
JWT_SECRET=your-jwt-secret-min-32-chars-dev
CORS_ORIGINS=http://localhost:5173,http://localhost:8000
```

For **Railway.app deployment**, configure in Railway's Variables panel:
- `ADMIN_KEY` - Admin authentication key
- `API_KEYS` - Comma-separated API keys  
- `JWT_SECRET` - JWT signing secret (min 32 bytes)
- `CORS_ORIGINS` - Your Railway domain

## API Endpoints

### Public Endpoints
- `GET /healthz` - Health check

### Protected Endpoints (require X-API-Key header)
- `GET /api/products` - List products
- `GET /api/customers` - List customers
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Record inventory transaction
- `GET /api/timesheets` - List timesheets
- `GET /api/timesheets/summary` - Daily totals (`from`, `to`, `emp_id`)
- `GET /api/timesheets/weekly-summary` - Weekly totals (`from`, `to`, `emp_id`)
- `GET /api/timesheets/export.csv` - CSV export (`from`, `to`, `emp_id`)
- `GET /api/timesheets/export-summary.csv` - Combined daily+weekly CSV (`from`, `to`, `emp_id`)
- `POST /api/timesheets` - Log timesheet entry

### Admin Endpoints (require X-Admin-Key header)
- `GET /api/admin/keys` - List API keys
- `POST /api/admin/keys` - Create new API key
- `DELETE /api/admin/keys/{key_id}` - Revoke API key

### Admin Endpoints (JWT admin)
- `GET /api/timesheets/pending` - List unapproved timesheets (`from`, `to`, `emp_id`)
- `POST /api/timesheets/{ts_id}/approve` - Approve timesheet
- `POST /api/timesheets/{ts_id}/unapprove` - Unapprove timesheet

## Troubleshooting

### Frontend shows blank page

```powershell
# Rebuild frontend
cd frontend
Remove-Item -Recurse -Force dist
npm run build
cd ..

# Restart backend service in Railway
# (Check Railway dashboard and redeploy)
```

### API not responding

```powershell
# Check backend logs locally
$env:DATABASE_URL="sqlite:///./dev.db"
uvicorn main:app --reload

# For Railway deployment, check Railway dashboard logs
# Ensure DATABASE_URL environment variable is set
```

### Database connection issues

For local development, SQLite is used by default at `./dev.db`.

For Railway deployment:
- PostgreSQL is auto-provisioned
- `DATABASE_URL` is automatically set by Railway
- Check Railway dashboard under "Variables" tab

### Port conflicts

If port 8000 is already in use during local development:

```powershell
$env:DATABASE_URL="sqlite:///./dev.db"
uvicorn main:app --reload --port 8001
```

## Production Deployment

### Railway.app (Recommended) ✅

For simple, scalable cloud deployment without complex infrastructure:

This is the recommended deployment method. It provides:
- ✅ One-click deployment from GitHub
- ✅ Automatic SSL/HTTPS
- ✅ Automatic scaling
- ✅ Integrated PostgreSQL database
- ✅ Free tier suitable for production use
- ✅ No tunnels, no reverse proxies, no complex setup

**Quick Start:**
1. Push code to GitHub
2. Sign up at https://railway.app
3. Connect GitHub repository
4. Add PostgreSQL database
5. Configure environment variables
6. Done! Your app is live at `https://<project>.up.railway.app`

### Security Checklist

- [ ] Change `API_KEYS` in Railway variables
- [ ] Change `ADMIN_KEY` in Railway variables
- [ ] Set `JWT_SECRET` to secure random value (min 32 bytes)
- [ ] Update `CORS_ORIGINS` with your domain
- [ ] Verify HTTPS is enabled (automatic on Railway)
- [ ] Set up database backups (Railway manages this)
- [ ] Monitor application health in Railway dashboard

## Development

### Backend Development

```powershell
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run locally with SQLite
$env:DATABASE_URL="sqlite:///./dev.db"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```powershell
cd frontend

# Dev mode with HMR
npm run dev

# Lint
npm run lint

# Build
npm run build
```

## Database Support

The application supports both:
- **SQLite** for local development (automatic, no setup required)
- **PostgreSQL** for production (via Railway.app)

The codebase automatically detects which database to use based on the `DATABASE_URL` environment variable.

## License

Proprietary - Synterra

## Support

For issues and questions, contact: admin@arkuszowniasmb.pl

## Live Demo (GitHub Pages)

- URL: https://lukaszrohan-glitch.github.io/PyCharmMiscProject/
- Built via `.github/workflows/deploy-frontend.yml` with `--base=/$REPO/`.
- If the link 404s, enable GitHub Pages in repo settings and rerun the workflow.
