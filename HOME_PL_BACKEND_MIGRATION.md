# Home.pl Backend Migration Guide

Complete guide to migrate FastAPI backend from Docker to home.pl remote server with cloudflared tunnel.

---

## Prerequisites

- **home.pl account**: serwer2581752.home.pl
- **SSH access enabled** in home.pl panel (Konta → SSH/SFTP)
- **Cloudflare account** with arkuszowniasmb.pl domain
- **Cloudflare tunnel token** (in your `.env` file)

---

## Phase 1: Prepare Your Local Machine

### Step 1: Verify SSH Access

```powershell
# Test connection to home.pl
ssh serwer2581752@serwer2581752.home.pl whoami

# If this fails, enable SSH in home.pl panel first
```

### Step 2: Verify Required Files

Ensure these files exist locally:
- `main.py`
- `auth.py`
- `user_mgmt.py`
- `db.py`
- `schemas.py`
- `logging_utils.py`
- `requirements.txt`
- `.env` (with TUNNEL_TOKEN)

### Step 3: Run Deployment Script

```powershell
# Make sure TUNNEL_TOKEN is in .env
cat .env | Select-String "TUNNEL_TOKEN"

# Run the main deployment
.\deploy-to-homepl.ps1

# If you encounter permission errors, run PowerShell as Administrator
```

---

## Phase 2: Complete Server Setup (via SSH)

After running the deployment script, connect to your server:

```powershell
ssh serwer2581752@serwer2581752.home.pl
```

### Step 1: Install Systemd Service

```bash
# Copy service file to systemd
sudo mv /tmp/arkuszowniasmb.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable arkuszowniasmb
sudo systemctl start arkuszowniasmb

# Verify it's running
sudo systemctl status arkuszowniasmb
```

### Step 2: Test Backend Health

```bash
# Check if backend is responding
curl http://localhost:8000/healthz

# Should return: {"status": "healthy"}
```

### Step 3: Initialize Database (First Time Only)

```bash
cd /home/serwer2581752/arkuszowniasmb
source venv/bin/activate

# Create admin user
python3 create_admin.py

# Run migrations if using PostgreSQL
python3 -m alembic upgrade head
```

---

## Phase 3: Configure Cloudflared Tunnel

### Step 1: Install Cloudflared (on remote server)

```bash
cd /tmp
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
cloudflared --version
```

### Step 2: Authenticate with Cloudflare

```bash
# Create credentials directory
mkdir -p ~/.cloudflared

# Authenticate (opens Cloudflare login in browser - use SSH tunneling if needed)
cloudflared tunnel login

# This creates ~/.cloudflared/cert.pem
```

### Step 3: Create Tunnel Configuration

Create `/home/serwer2581752/arkuszowniasmb/.cloudflared/config.yml`:

```yaml
tunnel: arkuszowniasmb
credentials-file: /home/serwer2581752/.cloudflared/cert.pem

ingress:
  - hostname: api.arkuszowniasmb.pl
    service: http://localhost:8000
  - hostname: arkuszowniasmb.pl
    service: http_status:404
  - service: http_status:404
```

### Step 4: Create Systemd Service for Cloudflared

Create `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflared Tunnel
After=network.target

[Service]
Type=simple
User=serwer2581752
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/serwer2581752/arkuszowniasmb/.cloudflared/config.yml run arkuszowniasmb
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## Phase 4: Configure DNS & Frontend

### Step 1: Update DNS Records in Cloudflare

1. Go to **Cloudflare Dashboard** → **DNS**
2. Add/Update these records:

| Type | Name | Value |
|------|------|-------|
| CNAME | api | arkuszowniasmb.pl (or tunnel DNS) |
| CNAME | www | arkuszowniasmb.pl |
| A | arkuszowniasmb.pl | Your home.pl public IP |

### Step 2: Configure Frontend .env

Update `.env` in your `frontend/` directory:

```env
VITE_API_BASE=https://api.arkuszowniasmb.pl
VITE_API_KEY=dev-key-change-in-production
```

### Step 3: Build & Deploy Frontend

```bash
cd frontend
npm run build

# Upload dist folder to home.pl via FTP
.\upload_to_homepl.ps1
```

---

## Verification Checklist

### Test Backend Health

```bash
# From your local machine
curl https://api.arkuszowniasmb.pl/healthz
```

Should return:
```json
{"status": "healthy"}
```

### Test Login Endpoint

```bash
curl -X POST https://api.arkuszowniasmb.pl/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key-change-in-production" \
  -d '{"email": "admin@arkuszowniasmb.pl", "password": "SMB#Admin2025!"}'
```

### Check Logs

```bash
# Backend logs
ssh serwer2581752@serwer2581752.home.pl 'tail -f /home/serwer2581752/arkuszowniasmb/logs/backend.log'

# Cloudflared logs
ssh serwer2581752@serwer2581752.home.pl 'sudo journalctl -u cloudflared -f'
```

### Test Frontend Access

1. Visit: **https://arkuszowniasmb.pl**
2. Should see your React application
3. API calls should connect to backend via cloudflared tunnel

---

## Troubleshooting

### Backend not starting

```bash
# Check service status
sudo systemctl status arkuszowniasmb

# View logs
journalctl -u arkuszowniasmb -n 50

# Manually test Python
cd /home/serwer2581752/arkuszowniasmb
source venv/bin/activate
python3 main.py
```

### Cloudflared tunnel not connecting

```bash
# Check tunnel status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -n 100

# Verify credentials exist
ls -la ~/.cloudflared/
```

### API endpoints returning 502/404

```bash
# Verify backend is running locally
curl http://localhost:8000/healthz

# Check tunnel config
cat ~/.cloudflared/config.yml

# Test tunnel directly
cloudflared tunnel validate arkuszowniasmb
```

### Database connection errors

```bash
# Check DATABASE_URL in .env
grep DATABASE_URL /home/serwer2581752/arkuszowniasmb/.env

# If using SQLite (default), check file exists
ls -la /home/serwer2581752/arkuszowniasmb/app.db

# If using PostgreSQL, verify psycopg2 is installed
source venv/bin/activate
pip list | grep psycopg2
```

---

## Maintenance

### View Service Logs

```bash
# Backend
sudo systemctl status arkuszowniasmb -l

# Cloudflared
sudo systemctl status cloudflared -l

# Combined journal logs
journalctl -u arkuszowniasmb -u cloudflared -f
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart arkuszowniasmb

# Restart tunnel
sudo systemctl restart cloudflared

# Restart both
sudo systemctl restart arkuszowniasmb cloudflared
```

### Monitor System Resources

```bash
# Check server load
top -b -n 1 | head -10

# Check disk space
df -h

# Check memory usage
free -h
```

### Backup Database

```bash
cd /home/serwer2581752/arkuszowniasmb
source venv/bin/activate

# If using SQLite
cp app.db backups/app.db.$(date +%Y%m%d_%H%M%S)

# If using PostgreSQL
pg_dump -U smb_user smbtool > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Rollback Plan

If you need to revert to Docker:

```bash
# Stop remote services
ssh serwer2581752@serwer2581752.home.pl 'sudo systemctl stop arkuszowniasmb cloudflared'

# Restart Docker locally
docker-compose up -d

# Update frontend .env
# VITE_API_BASE=http://localhost:8088
# npm run build
# redeploy frontend
```

---

## Environment Variables Reference

Your `.env` file should contain:

```env
# Database - use SQLite for simplicity (default: app.db)
# Or PostgreSQL if you set it up on home.pl
DATABASE_URL=sqlite:///app.db

# Admin credentials - change these!
ADMIN_EMAIL=admin@arkuszowniasmb.pl
ADMIN_PASSWORD=SMB#Admin2025!

# JWT
JWT_SECRET=your-secret-key-change-in-production-32-bytes-minimum
JWT_EXP_MINUTES=120
JWT_REFRESH_DAYS=7

# API Keys - change these!
API_KEYS=dev-key-change-in-production
ADMIN_KEY=admin-change-in-production

# CORS - keep as is for home.pl deployment
CORS_ORIGINS=https://arkuszowniasmb.pl,https://www.arkuszowniasmb.pl,https://api.arkuszowniasmb.pl
ALLOWED_HOSTS=arkuszowniasmb.pl,www.arkuszowniasmb.pl,api.arkuszowniasmb.pl

# Cloudflare Tunnel
TUNNEL_TOKEN=your-token-from-cloudflare

# Environment
ENVIRONMENT=production
DEBUG=false
```

---

## Final Checklist

- [ ] SSH access working
- [ ] Backend files deployed
- [ ] Python environment created
- [ ] Systemd service installed & running
- [ ] Database initialized
- [ ] Cloudflared installed & authenticated
- [ ] Tunnel configured
- [ ] DNS records updated
- [ ] Frontend redeployed
- [ ] Health check passing
- [ ] Login endpoint working
- [ ] Frontend accessible via https://arkuszowniasmb.pl

---

**Support:** Check logs first, then review troubleshooting section above.
