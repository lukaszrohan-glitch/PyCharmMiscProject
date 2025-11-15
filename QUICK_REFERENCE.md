# Quick Reference Guide

## 🟢 System Status Commands

```bash
# Check all containers
docker-compose ps

# Check specific service logs
docker-compose logs backend
docker-compose logs nginx
docker-compose logs db

# Full system health
curl http://localhost:8088/api/healthz
```

---

## 🚀 Start/Stop Operations

```bash
# Start everything
docker-compose up -d

# Stop everything (keep data)
docker-compose stop

# Stop and remove (keep volumes)
docker-compose down

# Stop and remove everything (wipe data)
docker-compose down -v
```

---

## 🔗 Access Points

| Service | URL | Auth |
|---------|-----|------|
| Frontend | http://localhost:8088 | None |
| API (local) | http://localhost:8000 | API Key |
| Database | localhost:5432 | psql credentials |
| Health | http://localhost:8088/api/healthz | None |

---

## 🔑 API Key Testing

```bash
# List orders (requires API key)
curl -H "x-api-key: dev-key-change-in-production" http://localhost:8000/api/orders

# Get products (no auth needed)
curl http://localhost:8000/api/products

# Login (get JWT token)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arkuszowniasmb.pl","password":"YOUR_PASSWORD"}'
```

---

## 🗄️ Database Operations

```bash
# Connect to database
docker-compose exec -T db psql -U smb_user -d smbtool

# Inside psql:
\dt                    # List tables
SELECT * FROM orders;  # Query data
\q                     # Exit

# Backup database
docker-compose exec -T db pg_dump -U smb_user smbtool > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U smb_user smbtool
```

---

## 🧪 Testing

```bash
# Run all tests
docker-compose exec backend pytest tests/ -v

# Run specific test
docker-compose exec backend pytest tests/test_auth.py -v

# Run with coverage
docker-compose exec backend pytest tests/ --cov=.
```

---

## 🌐 Cloudflare Tunnel

```bash
# Start tunnel
cloudflared.exe --config cloudflared.yml

# Check tunnel status
curl https://arkuszowniasmb.com/api/healthz

# View tunnel logs
type C:\Users\lukas\.cloudflared\cloudflared.log

# Service control (Windows)
net start cloudflared
net stop cloudflared
```

---

## 🔧 Common Fixes

### **Frontend blank page**
```bash
cd frontend && npm run build && cd ..
docker-compose restart nginx
```

### **Port in use**
Edit `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8089:80"  # Change from 8088
```

### **Database won't connect**
```bash
docker-compose restart db
# Wait 30 seconds
curl http://localhost:8088/api/healthz
```

### **API returning 401 Unauthorized**
- Check API key in `.env`
- Verify header: `-H "x-api-key: YOUR_KEY"`

### **Tests fail with psycopg2 error**
```bash
# Run tests in Docker (recommended)
docker-compose exec backend pytest tests/
```

---

## 📊 Files to Know

| File | Purpose |
|------|---------|
| `.env` | Configuration & secrets |
| `docker-compose.yml` | Service orchestration |
| `nginx.conf` | Web server config |
| `main.py` | FastAPI backend |
| `frontend/src/App.jsx` | React frontend |
| `scripts/init.sql` | Database schema |
| `Dockerfile` | Container build |

---

## 🚨 Emergency Operations

### **Complete Reset**
```bash
docker-compose down -v
docker-compose up -d --build
# Wait 30 seconds for database initialization
curl http://localhost:8088/api/healthz
```

### **View Real-Time Logs**
```bash
docker-compose logs -f backend
# Press Ctrl+C to exit
```

### **Force Restart All**
```bash
docker-compose restart
```

---

## ✅ Health Check Script

```bash
@echo off
echo Checking Arkuszownia SMB health...
echo.

echo [1/4] Checking containers...
docker-compose ps | findstr /C:"Up" >nul && echo OK || echo FAILED

echo [2/4] Checking frontend...
curl -s http://localhost:8088/api/healthz | findstr /C:"ok" >nul && echo OK || echo FAILED

echo [3/4] Checking API...
curl -s http://localhost:8000/healthz | findstr /C:"ok" >nul && echo OK || echo FAILED

echo [4/4] Checking database...
docker-compose exec -T db psql -U smb_user -d smbtool -c "SELECT 1;" >nul 2>&1 && echo OK || echo FAILED

echo.
echo All checks complete!
```

---

## 📞 Documentation

Quick links to detailed docs:

- **Deployment**: `DEPLOYMENT_READY.md`
- **System Architecture**: `NETWORK_APP_ANALYSIS.md`
- **Cloudflare Setup**: `CLOUDFLARE_TUNNEL_GUIDE.md`
- **API Keys**: `API_KEYS_GUIDE.md`
- **User Management**: `docs/LOGIN_AND_USERS.md`
- **Development**: `README_DEV.md`
- **User Guide**: `README.md`

---

## 🎯 Useful Ports

- `8088` - Nginx (frontend)
- `8000` - FastAPI backend
- `5432` - PostgreSQL
- `5173` - Frontend dev server (Vite)
- `49500` - Cloudflare metrics

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
