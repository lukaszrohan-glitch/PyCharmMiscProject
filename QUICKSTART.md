# Synterra - Quick Start Guide

## For Windows Users (5 minutes to production)

### Step 1: Prerequisites Check
```powershell
# Check if Docker is installed
docker --version

# Check if Node.js is installed
node --version

# Check if Git is installed
git --version
```

If any command fails, install:
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- **Node.js**: https://nodejs.org/ (LTS version)
- **Git**: https://git-scm.com/download/win

### Step 2: Clone or Navigate to Project
```powershell
cd C:\Users\lukas\PyCharmMiscProject
```

### Step 3: Start the Application
```powershell
.\manage.ps1 start
```

This will:
1. Build the React frontend
2. Start PostgreSQL database
3. Start FastAPI backend
4. Start Nginx reverse proxy

### Step 4: Verify Everything Works
```powershell
.\manage.ps1 test
```

You should see:
```
[1/3] Frontend... OK
[2/3] API health... OK
[3/3] API endpoint... OK

All tests passed!
```

### Step 5: Open the Application
Open your browser and go to:
**http://localhost:8080**

🎉 **You're done!**

---

## Common Commands

| Command | Description |
|---------|-------------|
| `.\manage.ps1 start` | Start all services |
| `.\manage.ps1 stop` | Stop all services |
| `.\manage.ps1 restart` | Restart services |
| `.\manage.ps1 rebuild` | Full rebuild |
| `.\manage.ps1 status` | Check status |
| `.\manage.ps1 logs` | View logs |
| `.\manage.ps1 test` | Run health checks |
| `.\manage.ps1 clean` | Remove everything |

## Troubleshooting

### Port 8080 already in use
Edit `docker-compose.yml` and change:
```yaml
nginx:
  ports:
    - "8081:80"  # Change 8080 to 8081
```

### Frontend shows blank page
```powershell
.\manage.ps1 rebuild
```

### Database issues
```powershell
.\manage.ps1 clean
.\manage.ps1 start
```

### View detailed logs
```powershell
docker-compose logs backend
docker-compose logs nginx
docker-compose logs db
```

## API Testing

### Using PowerShell
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8080/api/healthz" -UseBasicParsing

# Get products (requires API key)
$headers = @{'X-API-Key'='dev-key-change-in-production'}
Invoke-WebRequest -Uri "http://localhost:8080/api/products" -Headers $headers -UseBasicParsing
```

### Using curl (if installed)
```bash
# Health check
curl http://localhost:8080/api/healthz

# Get products
curl -H "X-API-Key: dev-key-change-in-production" http://localhost:8080/api/products
```

## Production Deployment

### 1. Update Security Settings
Edit `.env` file:
```env
API_KEYS=your-secure-random-key-here
ADMIN_KEY=your-secure-admin-key-here
```

### 2. Enable Cloudflare Tunnel (Optional)
1. Create tunnel at https://one.dash.cloudflare.com/
2. Copy the tunnel token
3. Add to `.env`:
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=your-token-here
   ```
4. Start with production profile:
   ```powershell
   docker-compose --profile production up -d
   ```

### 3. Set up Backups
```powershell
# Backup database
docker-compose exec db pg_dump -U smb_user smbtool > backup-$(Get-Date -Format 'yyyy-MM-dd').sql

# Restore database
Get-Content backup-2025-11-09.sql | docker-compose exec -T db psql -U smb_user smbtool
```

## Architecture Overview

```
Browser (You)
    ↓
http://localhost:8080
    ↓
┌─────────────────────────────────┐
│   Nginx (Reverse Proxy)         │
│   Port 8080                      │
│                                  │
│   ├─ / → Frontend (React)       │
│   └─ /api/* → Backend (FastAPI) │
└─────────────┬───────────────────┘
              │
    ┌─────────┴────────┐
    ↓                  ↓
┌─────────────┐  ┌──────────────┐
│  Frontend   │  │  Backend     │
│  (React)    │  │  (Python)    │
│  Static     │  │  Port 8000   │
│  Files      │  │              │
└─────────────┘  └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  PostgreSQL  │
                 │  Database    │
                 │  Port 5432   │
                 └──────────────┘
```

## Features

✅ **Order Management** - Create and track customer orders
✅ **Inventory Control** - Manage stock levels
✅ **Timesheet Tracking** - Log employee working hours
✅ **Financial Reports** - View revenue and costs
✅ **Multi-language** - Polish and English support
✅ **API Access** - RESTful API with authentication
✅ **Admin Panel** - User and key management

## Default Test Data

The system comes with sample data:
- 2 Products (P-100, P-101)
- 2 Customers (C-1001, C-1002)
- 2 Employees (E-1, E-2)
- Sample orders, inventory, and timesheets

## Need Help?

1. Check the main README.md for detailed documentation
2. Run `.\manage.ps1 help` for command help
3. View logs: `.\manage.ps1 logs`
4. Test health: `.\manage.ps1 test`

## System Requirements

- **OS**: Windows 10/11 with WSL2
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space
- **CPU**: 2 cores minimum

## Performance Tips

1. **Use SSD** - Database performs better on SSD
2. **Allocate more RAM to Docker** - In Docker Desktop settings
3. **Close unused applications** - Free up system resources
4. **Regular cleanup** - Run `.\manage.ps1 clean` periodically

---

**Version**: 1.0.0  
**Last Updated**: November 9, 2025  
**License**: Proprietary

