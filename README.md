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

### With Cloudflare Tunnel - SSH-Based Setup (home.pl)

**Goal**: Establish a permanent public tunnel via home.pl server to expose the local application

#### Prerequisites
- Active home.pl hosting account with SSH/SFTP enabled
- SSH access configured: `Konta → SSH/SFTP` in home.pl control panel
- Cloudflare Tunnel token from https://one.dash.cloudflare.com/
- Credentials format: `username@domain.home.pl` (e.g., `serwer2581752@serwer2581752.home.pl`)

#### Setup Script: `setup-homepl-tunnel.ps1`

The script automates tunnel deployment on the remote home.pl server:

```powershell
# Run with your tunnel token
powershell -File .\setup-homepl-tunnel.ps1 -TunnelToken "your-cloudflare-tunnel-token"
```

**What the script does**:
1. Tests SSH connectivity to home.pl server
2. Downloads and installs cloudflared on remote server
3. Creates tunnel configuration with ingress rules for both domains
4. Sets up systemd service for automatic restart on server reboot
5. Starts the tunnel and verifies connectivity

**Configuration**:
- Tunnels to: `http://localhost:8088` (nginx on local Docker)
- Supports domains:
  - `arkuszowniasmb.com` / `www.arkuszowniasmb.com`
  - `arkuszowniasmb.pl` / `www.arkuszowniasmb.pl`

#### Current Status - SSH Connection Issue

**Issue**: SSH connection times out when connecting to home.pl server
```
ssh: connect to host serwer2581752.home.pl port 22: Connection timed out
```

**Root Cause**: The home.pl server (serwer2581752.home.pl) is currently unreachable on port 22

**Troubleshooting Steps**:

1. **Verify SSH is enabled** in home.pl control panel:
   - Log in to https://www.home.pl/
   - Go to `Konta → SSH/SFTP`
   - Ensure SSH access is activated

2. **Test connectivity manually**:
   ```powershell
   # Check DNS resolution
   nslookup serwer2581752.home.pl
   
   # Test SSH connectivity
   ssh -v serwer2581752@serwer2581752.home.pl "echo test"
   
   # If behind NAT/firewall, check if port 22 is accessible
   Test-NetConnection -ComputerName serwer2581752.home.pl -Port 22
   ```

3. **Common fixes**:
   - Contact home.pl support if SSH is disabled
   - Check if SSH port is blocked by ISP/firewall
   - Verify correct username/domain format
   - Wait 15-30 minutes after enabling SSH for propagation

4. **Alternative approach** - Local Windows Cloudflare Tunnel:
   If SSH to home.pl fails permanently, set up cloudflared locally:
   ```powershell
   # Download cloudflared.exe to project directory
   # Create tunnel in Cloudflare dashboard with token
   # Run: .\cloudflared.exe tunnel --token "your-token-here"
   ```

#### Monitor Tunnel Status

Once connected, monitor the remote tunnel:
```powershell
# View live logs from tunnel on home.pl
ssh serwer2581752@serwer2581752.home.pl 'sudo journalctl -u cloudflared -f'

# Check service status
ssh serwer2581752@serwer2581752.home.pl 'sudo systemctl status cloudflared'

# Restart tunnel if needed
ssh serwer2581752@serwer2581752.home.pl 'sudo systemctl restart cloudflared'
```

#### For Future Work

**Next Steps if connection is restored**:
1. Run the setup script with valid tunnel token
2. Verify domains are routed through Cloudflare in Zero Trust dashboard
3. Test public access via https://arkuszowniasmb.pl
4. Update DNS records if needed
5. Monitor tunnel logs for stability

**Documentation Files**:
- `CLOUDFLARE_TUNNEL_GUIDE.md` - Detailed tunnel configuration reference
- `DEPLOYMENT_READY.md` - Complete deployment checklist
- `NETWORK_APP_ANALYSIS.md` - System architecture and health status

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

