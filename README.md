# Arkuszownia SMB - Manufacturing Management System

System zarządzania produkcją dla małych i średnich przedsiębiorstw.

## Quick Start (Windows/PowerShell)

### Prerequisites
- Docker Desktop (with WSL2)
- Node.js 18+ (for local frontend development)
- Git

### 1. Start the Application

```powershell
# Clone and enter directory
cd C:\Users\lukas\PyCharmMiscProject

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Access the Application

- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/healthz

### 3. Default Credentials

API Key (for testing): `dev-key-change-in-production`
Admin Key: `admin-change-in-production`

⚠️ **IMPORTANT**: Change these in production via `.env` file!

## PowerShell Helper Commands

### Check Application Health
```powershell
# Test API
Invoke-WebRequest -Uri "http://localhost:8080/api/healthz" -UseBasicParsing

# Test Products endpoint
$headers = @{'X-API-Key'='dev-key-change-in-production'}
Invoke-WebRequest -Uri "http://localhost:8080/api/products" -Headers $headers -UseBasicParsing
```

### Container Management
```powershell
# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View specific service logs
docker-compose logs backend
docker-compose logs nginx
docker-compose logs db

# Rebuild and restart
docker-compose up -d --build
```

### Database Access
```powershell
# Connect to PostgreSQL
docker-compose exec db psql -U smb_user -d smbtool

# Backup database
docker-compose exec db pg_dump -U smb_user smbtool > backup.sql

# Restore database
Get-Content backup.sql | docker-compose exec -T db psql -U smb_user smbtool
```

### Frontend Development
```powershell
cd frontend

# Install dependencies
npm install

# Dev mode (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │ http://localhost:8080
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Nginx (Port 8080)                      │
│  - Serves static frontend (React/Vite)                     │
│  - Proxies /api/* to backend                                │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             │ /                            │ /api/*
             ↓                              ↓
┌────────────────────────┐    ┌───────────────────────────────┐
│   Frontend (React)     │    │   Backend (FastAPI/Python)    │
│   - Built with Vite    │    │   - Port 8000                 │
│   - Stored in /dist    │    │   - REST API                  │
└────────────────────────┘    │   - Authentication            │
                              └──────────┬────────────────────┘
                                         │
                                         ↓
                              ┌──────────────────────────────┐
                              │   PostgreSQL Database        │
                              │   - Port 5432 (internal)     │
                              │   - Persistent data          │
                              └──────────────────────────────┘
```

## Project Structure

```
C:\Users\lukas\PyCharmMiscProject\
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── styles/        # CSS files
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── dist/              # Built files (served by nginx)
│   ├── package.json
│   └── vite.config.js
├── backend/               # Python FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── db.py             # Database connection
│   ├── queries.py        # SQL queries
│   ├── schemas.py        # Pydantic models
│   └── requirements.txt
├── scripts/
│   └── init.sql          # Database initialization
├── logs/                 # Application logs
├── docker-compose.yml    # Docker orchestration
├── nginx.conf           # Nginx configuration
├── Dockerfile           # Backend container
└── .env                 # Environment variables
```

## Configuration

### Environment Variables (.env)

```env
DATABASE_URL=postgresql://smb_user:smb_password@db:5432/smbtool
API_KEYS=your-secure-api-key-here
ADMIN_KEY=your-secure-admin-key-here
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com
ALLOWED_HOSTS=localhost,yourdomain.com
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
```

### Nginx Configuration

The main nginx.conf handles:
- Static file serving from `/usr/share/nginx/html`
- API proxying to backend service
- Security headers
- Gzip compression
- SPA routing (all routes → index.html)

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

# Restart nginx
docker-compose restart nginx
```

### API not responding

```powershell
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check health
Invoke-WebRequest -Uri "http://localhost:8080/api/healthz" -UseBasicParsing
```

### Database connection issues

```powershell
# Check database status
docker-compose logs db

# Restart database
docker-compose restart db

# Verify connection
docker-compose exec backend python -c "from db import get_db; next(get_db())"
```

### Port conflicts

If port 8080 is already in use:

1. Edit `docker-compose.yml`:
   ```yaml
   nginx:
     ports:
       - "8081:80"  # Change 8080 to another port
   ```

2. Restart:
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

### Clear everything and start fresh

```powershell
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove frontend build
Remove-Item -Recurse -Force frontend\dist

# Rebuild everything
cd frontend
npm install
npm run build
cd ..
docker-compose up -d --build
```

## Production Deployment

### With Cloudflare Tunnel

1. Create a Cloudflare Tunnel at https://one.dash.cloudflare.com/
2. Copy the tunnel token
3. Add to `.env`:
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=your-actual-tunnel-token
   ```
4. Start with production profile:
   ```powershell
   docker-compose --profile production up -d
   ```

### Security Checklist

- [ ] Change `API_KEYS` in `.env`
- [ ] Change `ADMIN_KEY` in `.env`
- [ ] Update `ALLOWED_HOSTS` with your domain
- [ ] Update `CORS_ORIGINS` with your domain
- [ ] Enable HTTPS (via Cloudflare or reverse proxy)
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Review nginx security headers
- [ ] Set up monitoring

## Development

### Backend Development

```powershell
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run locally (requires PostgreSQL)
$env:DATABASE_URL="postgresql://smb_user:smb_password@localhost:5432/smbtool"
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

## License

Proprietary - Arkuszownia SMB

## Support

For issues and questions, contact: admin@arkuszowniasmb.pl

