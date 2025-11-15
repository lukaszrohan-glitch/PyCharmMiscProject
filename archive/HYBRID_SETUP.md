# Hybrid Setup: Docker (Services) + Native Cloudflared

## Overview

This setup combines:
- **Docker**: PostgreSQL, FastAPI Backend, Nginx
- **Native**: Cloudflared tunnel (standalone `.exe`)
- **External**: Frontend dist (already on home.pl)

## What Changed

### docker-compose.yml
- ✅ Removed `cloudflared` service
- ✅ Removed `frontend-build` service  
- ✅ Added ports to `db` (5432) and `backend` (8000) for easier debugging
- ✅ Kept `nginx` for frontend + API routing

### cloudflared-config-pl.yml
- ✅ Updated `logfile` to `./logs/cloudflared-pl.log` (accessible)
- ✅ Changed `loglevel` from debug to info
- ✅ Updated ingress service from Docker hostname to `http://127.0.0.1:8088`

### New Files
- ✅ `start-hybrid.cmd` - Single command to start everything

## Quick Start

```powershell
# 1. Start Docker services
cd C:\Users\lukas\PyCharmMiscProject
start-hybrid.cmd
```

This will:
1. Start PostgreSQL container
2. Start Backend (FastAPI) container
3. Start Nginx container
4. Launch Cloudflared tunnel (blocking - Ctrl+C to stop)

## Manual Commands

### Start Docker Only
```powershell
docker-compose up -d
```

Check services:
```powershell
docker-compose ps
docker-compose logs -f
```

### Start Cloudflared Separately
```powershell
# Terminal 1: Docker
docker-compose up -d

# Terminal 2: Cloudflared
cloudflared.exe tunnel run --token %TUNNEL_TOKEN%
# Or with config file:
cloudflared.exe tunnel run --config cloudflared-config-pl.yml
```

## Debugging

### Check Docker Containers
```powershell
# View all containers
docker-compose ps

# View logs
docker-compose logs db       # Database
docker-compose logs backend  # FastAPI API
docker-compose logs nginx    # Nginx proxy

# Real-time logs
docker-compose logs -f backend
```

### Test Backend Directly
```powershell
# Backend health check
curl http://localhost:8000/healthz

# API access via Nginx
curl http://localhost:8088/api/orders
```

### Test Database Connection
```powershell
# Check from host
psql -h localhost -U smb_user -d smbtool

# From inside container
docker-compose exec db psql -U smb_user -d smbtool
```

### Cloudflared Tunnel Status
```powershell
# Check logs
type logs\cloudflared-pl.log

# Verify tunnel is running
curl -I https://arkuszowniasmb.pl
```

## Configuration Files

### .env
No changes needed if already set up. Verify:
```env
DATABASE_URL=postgresql://smb_user:smb_password@db:5432/smbtool
VITE_API_BASE=https://arkuszowniasmb.pl
ENVIRONMENT=production
```

### nginx.conf
Already configured correctly:
- Serves frontend from `./frontend/dist`
- Proxies `/api/` to `http://backend:8000`
- Works with Cloudflared tunnel

### cloudflared-config-pl.yml
Routes both domains to localhost:8088 (Nginx):
```yaml
ingress:
  - hostname: arkuszowniasmb.pl
    service: http://127.0.0.1:8088
  - hostname: www.arkuszowniasmb.pl
    service: http://127.0.0.1:8088
```

## Stopping Everything

### Stop Docker Only
```powershell
docker-compose stop
# or
docker-compose down
```

### Stop Cloudflared
Press `Ctrl+C` in the terminal where it's running

### Stop All
```powershell
docker-compose down
# Then Ctrl+C on Cloudflared
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Check: `docker ps`

### "Backend container keeps restarting"
```powershell
docker-compose logs backend
# Check DATABASE_URL is correct
# Run migrations: docker-compose exec backend alembic upgrade head
```

### "Nginx returns 502 Bad Gateway"
- Verify backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Test backend: `curl http://localhost:8000/healthz`

### "Cloudflared tunnel fails to connect"
- Verify token in `.env` is valid
- Check tunnel is created in Cloudflare dashboard
- View logs: `type logs\cloudflared-pl.log`

### "Frontend shows blank page"
- Check nginx logs: `docker-compose logs nginx`
- Verify frontend dist exists: `dir frontend\dist`
- Check API calls in browser console (Network tab)

## Performance Notes

- Database is isolated in container (managed independently)
- Backend container handles all Python/FastAPI logic
- Nginx routes requests efficiently
- Cloudflared tunnel is native (no Docker overhead)

## Production Considerations

1. **Secrets**: Change all defaults in `.env`
2. **Logs**: Monitor `logs/` directory regularly
3. **Database**: Set up regular backups (`docker-compose exec db pg_dump ...`)
4. **SSL**: Already handled by Cloudflare tunnel
5. **Monitoring**: Check `docker-compose logs` periodically

## Next Steps

1. Run `start-hybrid.cmd`
2. Test: `curl https://arkuszowniasmb.pl`
3. Open browser: `https://arkuszowniasmb.pl`
4. Log in with: `admin@arkuszowniasmb.pl / SMB#Admin2025!`
