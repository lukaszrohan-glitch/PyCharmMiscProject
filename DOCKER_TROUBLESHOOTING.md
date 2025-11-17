# Docker Troubleshooting Guide

## Issue: Can't see anything in Docker containers

### Common causes and solutions:

## 1. Docker Desktop not running

**Symptoms:**
- `docker ps` returns nothing or "error during connect"
- No containers visible

**Fix:**
1. Open Start Menu
2. Search "Docker Desktop"
3. Click to start
4. Wait for Docker icon in system tray to show green/ready
5. Try again

**Quick check:**
```cmd
scripts\docker-diagnostic.cmd
```

---

## 2. No containers created yet

**Symptoms:**
- `docker ps -a` shows empty list
- Fresh install or after `docker compose down -v`

**Fix:**
Build and start containers:
```cmd
docker compose up -d --build
```

---

## 3. Containers exited/crashed

**Symptoms:**
- `docker ps` shows nothing
- `docker ps -a` shows containers with STATUS "Exited"

**Fix:**
Check logs to see why they exited:
```cmd
docker compose logs backend
docker compose logs frontend
docker compose logs db
```

Common issues:
- Port already in use (8000, 5173, 5432)
- Build failed
- Missing environment variables

Rebuild:
```cmd
docker compose down
docker compose up -d --build
```

---

## 4. Windows Terminal/PowerShell issues

**Symptoms:**
- Commands run but show no output
- Terminal seems frozen

**Fix:**
- Close and reopen terminal
- Try cmd.exe instead of PowerShell
- Use Windows Terminal app
- Check in Docker Desktop GUI: Containers tab shows everything

---

## 5. Docker using WSL2 backend issues

**Symptoms:**
- Docker Desktop starts but commands fail
- "error during connect" messages

**Fix:**
1. Open Docker Desktop Settings
2. General → Use WSL2 based engine (check/uncheck and restart)
3. Or switch to Hyper-V backend

---

## Alternative: Run WITHOUT Docker

If Docker continues to have issues, run locally:

```cmd
scripts\start-local.cmd
```

This runs:
- Backend: Python + SQLite (no Postgres needed)
- Frontend: Vite dev server

**Advantages:**
- No Docker needed
- Faster startup
- Easier debugging
- Hot reload works better

**Disadvantages:**
- Uses SQLite (not Postgres)
- Not identical to production
- Manual setup

---

## Verification Steps

### 1. Check Docker Desktop is running
```cmd
tasklist | findstr Docker
```
Should show "Docker Desktop.exe"

### 2. Check Docker daemon
```cmd
docker info
```
Should show system info (not error)

### 3. Check containers
```cmd
docker compose ps
```
Should show 3 services: db, backend, frontend

### 4. Check logs
```cmd
docker compose logs -f
```
Should show live logs from all services

### 5. Check ports
```cmd
netstat -ano | findstr ":8000 :5173 :5432"
```
Should show ports in use by Docker processes

---

## Quick Fixes

### Reset everything:
```cmd
scripts\reset-docker.cmd
```

### Fix frontend build error:
```cmd
scripts\fix-frontend-build.cmd
```

### Check Docker status:
```cmd
scripts\docker-diagnostic.cmd
```

### Run locally (no Docker):
```cmd
scripts\start-local.cmd
```

---

## Still stuck?

1. Restart Docker Desktop completely
2. Restart your computer
3. Check Docker Desktop → Troubleshoot → Clean/Purge data
4. Reinstall Docker Desktop
5. Use local development mode instead

## Access URLs when working:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- DB (internal): localhost:5432

Default credentials:
- API Key: `changeme123`
- Admin Key: `test-admin-key`

