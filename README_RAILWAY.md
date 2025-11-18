# Synterra - Railway.app Deployment

**Simple, Direct Deployment to Railway.app**

This document provides step-by-step instructions for deploying Synterra to Railway.app without cloudflared, tunnels, or complex infrastructure.

## Quick Commands (Build/Start)

- Build command (Service → Settings → Build):
  ```bash
  pip install -r requirements.txt && cd frontend && npm ci && npm run build
  ```
- Start command (Service → Settings → Start):
  ```bash
  alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- Alternatively, Railway will use the provided `Procfile`:
  ```
  web: alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```

### Windows (PowerShell) equivalents

If you’re running locally in PowerShell, use these commands from the repo root (they avoid Bash `&&` and `${PORT:-8000}` syntax):

```powershell
# 1) Install Python deps
pip install -r requirements.txt

# 2) Build frontend
cd frontend
npm ci
npm run build
cd ..

# 3) Run DB migrations
alembic upgrade head

# 4) Start the app (use $env:PORT if present; else 8000)
$port = if ($env:PORT) { [int]$env:PORT } else { 8000 }
uvicorn main:app --host 0.0.0.0 --port $port
```

CMD one‑liner alternative:
```cmd
cmd /c "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"
```

## Architecture Overview

- **One Service: "app"** - Runs FastAPI backend + serves React frontend as static files
- **One Service: "Postgres"** - Database
- **No tunnels, no cloudflared, no hybrid setup** - Just a simple, scalable cloud deployment

---

## Prerequisites

1. **GitHub Repository** - This code must be in a GitHub repository
2. **Railway Account** - Free tier available at https://railway.app
3. **Node.js 18+** (local development)
4. **Python 3.9+** (local development)

---

## Preparation Checklist

### 1. Build Frontend Locally

Before deploying, ensure the frontend builds successfully:

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist/` with:
- `index.html`
- `assets/` directory with JS/CSS bundles

### 2. Verify Backend is Ready

The backend (main.py) already includes:
- ✅ FastAPI application
- ✅ Frontend SPA routing (serves `/` and all paths as SPA)
- ✅ Static file mounting at `/assets`
- ✅ API endpoints at `/api/*`

### 3. Review Environment Variables

Check `.env.example` for all required variables:

```env
DATABASE_URL=postgresql://user:password@localhost/arkuszownia
ADMIN_KEY=<strong-random-key-32-chars-min>
API_KEYS=key1,key2,key3
JWT_SECRET=<strong-random-key-32-chars-min>
CORS_ORIGINS=https://yourdomain.up.railway.app
```

---

## Railway Setup - Step by Step

### Step 1: Create a New Project

1. Visit https://railway.app
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub
5. Select the Synterra repository
6. Railway will detect Python and create a service

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **New** (top right)
2. Select **Database** → **PostgreSQL**
3. Railway automatically creates a `DATABASE_URL` variable
4. Name the service "Postgres" (optional, for clarity)

### Step 3: Configure Environment Variables

Go to the **app** service settings:

1. Click **Variables** tab
2. Add all variables from `.env.example`:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Postgres service (auto-linked) |
| `ADMIN_KEY` | Random 32+ char string | Use strong password generator |
| `API_KEYS` | `key1,key2,key3` | Comma-separated API keys |
| `JWT_SECRET` | Random 32+ char string | For JWT token signing |
| `CORS_ORIGINS` | `https://<project>.up.railway.app` | Replace `<project>` with your Railway project name |

**Do NOT commit .env files to git** - Railway Variables are secure and encrypted.

### Step 4: Set Start Command

In the **app** service:

1. Go to **Settings** tab
2. Scroll to **Start Command**
3. Enter:

```bash
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

This tells Railway:
- Run the FastAPI app from `main.py`
- Listen on all interfaces (`0.0.0.0`)
- Use Railway's `PORT` variable, or default to `8000` locally

### Step 5: Enable Railway Domain

1. In the **app** service, go to **Networking** tab
2. Click **Generate Domain**
3. You'll get: `https://<generated-id>.up.railway.app`

Save this URL - it's your application's public address.

---

## Deployment

### Automatic Deploy from GitHub

1. Push code to your GitHub branch (typically `main`)
2. Railway automatically:
   - Clones your repo
   - Installs Python dependencies from `requirements.txt`
   - Installs Node.js dependencies for frontend
   - Runs `cd frontend && npm run build`
   - Starts the app with the Start Command

### Manual Redeploy

If needed, force redeploy:
1. Go to **Deployments** tab
2. Click the 3-dot menu on the latest deployment
3. Select **Rerun Deployment**

---

## Verification

### 1. Check Backend Health

```bash
curl https://<your-app>.up.railway.app/api/healthz
# Should return: {"ok": true}
```

### 2. Check Frontend Loads

1. Open `https://<your-app>.up.railway.app` in browser
2. You should see the Synterra login page
3. Check browser DevTools → Network tab:
   - `index.html` should load
   - `/assets/*` files should load (JS/CSS)
   - No 404 errors for assets

### 3. Test Frontend → Backend Communication

1. Log in with test credentials
2. Check DevTools → Network tab:
   - Requests to `/api/*` should succeed (2xx/3xx status)
   - Look for any CORS errors (would show in Console)

### 4. Verify Admin Key Protection

Test an admin endpoint without the key:
```bash
curl https://<your-app>.up.railway.app/api/admin/users
# Should return: {"detail": "Invalid admin key"}
```

Test with the key:
```bash
curl -H "X-Admin-Key: <your-admin-key>" https://<your-app>.up.railway.app/api/admin/users
# Should return user list
```

---

## Custom Domain (Optional)

If you have a domain (e.g., `arkuszownia.example.com`):

1. Get your Railway domain from **Networking** tab
2. In your domain registrar:
   - Create a `CNAME` record pointing to Railway's domain
   - OR use Railway's custom domain feature in **Networking** tab
3. Update `CORS_ORIGINS` to include your custom domain:
   ```
   https://arkuszownia.example.com,https://<railway>.up.railway.app
   ```

---

## Database Migrations

If you have Alembic migrations:

1. SSH into Railway or use Railway CLI
2. Run migrations before first deploy or use a release script

**In Railway:**
- Use **Monitoring** tab to view logs
- Check for migration errors

Alternatively, set up a "release" phase in Railway to run migrations automatically. See Railway docs for details.

---

## Troubleshooting

### Problem: "Frontend not built"

**Solution:** Ensure `frontend/dist/` is built before deploy:
```bash
cd frontend
npm run build
```
Or add this to your deploy script.

### Problem: Assets return 404

**Solution:** 
- Check that `frontend/dist/assets/` exists
- Verify `main.py` mounts `/assets` correctly
- Check Railway logs for mounting errors

### Problem: CORS errors

**Solution:**
- Update `CORS_ORIGINS` in Variables to match your domain
- Check that API requests include proper headers
- Frontend should send requests to `/api/*` (same origin)

### Problem: Database connection fails

**Solution:**
- Verify `DATABASE_URL` is set in Variables
- Check it matches PostgreSQL service connection string
- Look at Railway logs for connection errors

### Problem: 502 Bad Gateway

**Solution:**
- Check Railway logs (Monitoring tab)
- Verify app starts without errors
- Ensure `uvicorn` can bind to `${PORT}`

---

## Performance & Costs

### Railway Free Tier

- 5 GB monthly egress
- $5 credits per month (usually covers hobby use)
- Postgres database included

### Scaling

As traffic grows:
1. Railway auto-scales horizontally (multiple instances)
2. Add more replicas in **Networking** → **Replicas**
3. Monitor database performance; upgrade if needed

---

## Security Best Practices

1. **Never commit .env files** - Use Railway Variables only
2. **Rotate API keys regularly** - Use admin panel
3. **Use strong ADMIN_KEY and JWT_SECRET** - Min 32 random characters
4. **Enable Railway's built-in security** - DDoS protection, etc.
5. **Monitor logs** - Check for suspicious activity
6. **Database backups** - Railway handles automatic backups

---

## Common Tasks

### View Logs

1. Go to **Monitoring** tab
2. See real-time logs from the app and database
3. Search for errors

### Restart the App

1. Go to **Deployments** tab
2. Click the running deployment's 3-dot menu
3. Select **Stop** then **Start**

### Update Environment Variables

1. Go to **Variables** tab
2. Edit values directly
3. Changes take effect on next app restart

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Set up Railway project and database
3. ✅ Configure environment variables
4. ✅ Verify deployment
5. ✅ Set up custom domain (if needed)
6. ✅ Monitor and scale as needed

---

## Support & Documentation

- **Railway Docs**: https://docs.railway.app
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev
- **Postgres Docs**: https://www.postgresql.org/docs

---

**Status: Ready for Railway.app deployment** ✅
