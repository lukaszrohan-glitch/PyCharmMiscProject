# Quick Start Guide - SMB Tool

## Problem: Can't see Docker containers?

You have **3 easy options** to run the app:

---

## Option 1: Diagnose Docker (RECOMMENDED FIRST)

Run this to check what's wrong:
```cmd
scripts\docker-diagnostic.cmd
```

This will tell you:
- ✓ Is Docker Desktop running?
- ✓ Can Docker commands work?
- ✓ Are there any containers?
- ✓ What's the status?

**If Docker Desktop isn't running:**
1. Open Start Menu
2. Type "Docker Desktop"
3. Click to open
4. Wait for whale icon in system tray to be green
5. Try the diagnostic again

---

## Option 2: Use Docker (after starting Desktop)

Once Docker Desktop is running:

### Simple start:
```cmd
docker compose up -d --build
```

### Full reset (if problems):
```cmd
scripts\reset-docker.cmd
```

### Check it's working:
```cmd
docker compose ps
```

Should show 3 services running:
- db (postgres)
- backend (python/fastapi)
- frontend (vite/react)

---

## Option 3: Run Locally (NO Docker needed) ⭐

**If Docker keeps having issues, skip it entirely:**

```cmd
scripts\start-local.cmd
```

This will:
1. ✓ Check Python is installed
2. ✓ Check Node.js is installed
3. ✓ Install dependencies
4. ✓ Start backend on port 8000
5. ✓ Start frontend on port 5173
6. ✓ Open 2 terminal windows (one for each)

**Advantages:**
- No Docker Desktop needed
- Faster startup
- Easier to debug
- Works even if Docker is broken

**What you get:**
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173 (Polish UI with 🇵🇱/🇬🇧 toggle)

---

## Access the App

Once running (either Docker or local):

**Frontend:** http://localhost:5173
- **Modern interface** with blue gradient header and color-coded status badges
- Default language: Polish (polski)
- Switch to English: click 🇬🇧 flag in header
- Admin panel: click "Toggle Admin" button
- **Color-coded statuses**: Cyan (New), Yellow (Planned), Orange (In Production), Green (Done), Purple (Invoiced)

**Backend API:** http://localhost:8000/docs

**Default credentials:**
- API Key: `changeme123`
- Admin Key: `test-admin-key`

---

## Common Issues

### "React is not defined" white page
**Fix:** Hard refresh (Ctrl+F5) or open in Incognito window

### Port already in use
**Fix:** Stop other services using ports 8000, 5173, or 5432

### Node not found
**Fix:** Install Node.js from https://nodejs.org (LTS version)

### Python not found
**Fix:** Install Python 3.9+ from https://python.org

---

## All Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `docker-diagnostic.cmd` | Check Docker status | First step when Docker isn't working |
| `start-local.cmd` | Run without Docker | Docker not available or having issues |
| `reset-docker.cmd` | Full Docker reset | Docker containers broken/corrupted |
| `fix-frontend-build.cmd` | Fix node_modules error | Docker build fails with symlink error |
| `frontend-dev.cmd` | Start frontend only | Just need frontend dev server |

---

## Still Stuck?

1. Try local mode: `scripts\start-local.cmd`
2. Check detailed guide: `DOCKER_TROUBLESHOOTING.md`
3. Make sure Docker Desktop is actually running (whale icon in tray)
4. Restart computer
5. Reinstall Docker Desktop

---

## What's Next?

Once the app is running:
1. Open http://localhost:5173
2. Set API key: paste `changeme123` and click "Set API key"
3. Create a test order
4. View finance panel for that order
5. Try switching between Polish (🇵🇱) and English (🇬🇧)

For production deployment, see README.md

