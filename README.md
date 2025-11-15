# Arkuszownia SMB - Manufacturing Management System

Manufacturing and order management system for small and medium businesses.

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
- `POST /api/timesheets` - Log timesheet entry

### Admin Endpoints (require X-Admin-Key header)
- `GET /api/admin/keys` - List API keys
- `POST /api/admin/keys` - Create new API key
- `DELETE /api/admin/keys/{key_id}` - Revoke API key

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

Proprietary - Arkuszownia SMB

## Support

For issues and questions, contact: admin@arkuszowniasmb.pl
