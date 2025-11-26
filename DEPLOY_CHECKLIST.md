# 🚀 Deploy Checklist - Synterra SMB

## Pre-Deployment Checks

### 1. Code Quality
- [ ] Run `npm run lint` in `frontend/` (must pass with 0 warnings)
- [ ] Run `pytest -q` in root (all tests must pass)
- [ ] Check for security vulnerabilities: `npm audit` in `frontend/`
- [ ] Verify no hardcoded secrets/credentials in code

### 2. Build & Test
```powershell
# Backend tests
cd C:\Users\lukas\PyCharmMiscProject
pytest -q

# Frontend lint & build
cd frontend
npm run lint
npm run build
```

### 3. Environment Variables
Verify these are set in Railway.app:
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (strong random string)
- `ADMIN_EMAIL` (default: admin@arkuszowniasmb.pl)
- `ADMIN_PASSWORD` (strong password for initial admin)
- `API_KEYS` (comma-separated list of API keys)
- `CLOUDFLARE_TUNNEL_TOKEN` (for arkuszowniasmb.pl routing)

### 4. Database Migration
```powershell
# Verify migrations are up to date
alembic current
alembic upgrade head
```

---

## Deployment Steps

### 1. Commit & Push
```powershell
git add -A
git commit -m "feat: your descriptive message"
git push origin main
```

### 2. Monitor Railway Deployment
1. Visit: https://railway.app/project/arkuszowniasmb
2. Watch **Build Logs** for compilation errors
3. Wait for **Deploy Logs** to show "Application startup complete"
4. Check **HTTP Logs** for any runtime errors

### 3. Health Checks
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "https://synterra.up.railway.app/healthz"
# Expected: {"ok":true}

# Test readiness endpoint
Invoke-RestMethod -Uri "https://synterra.up.railway.app/readyz"
# Expected: {"ready":true,"db":"postgres","version":"003"}
```

### 4. Test Public Domain
```powershell
# Test via Cloudflare tunnel
Invoke-RestMethod -Uri "https://arkuszowniasmb.pl/api/healthz"
# Expected: {"ok":true}
```

### 5. Smoke Test Key Features
- [ ] Login works (admin@arkuszowniasmb.pl)
- [ ] Orders page loads
- [ ] Can create new order (auto-ID generation)
- [ ] Inventory page loads
- [ ] CSV exports return data (not empty)
- [ ] Help button opens User Guide
- [ ] Settings page accessible
- [ ] Polish/English language switch works

---

## Rollback Procedure

If deployment fails:

```powershell
# 1. Revert to last working commit
git log --oneline -5  # Find last good commit
git revert <commit-hash>
git push origin main

# 2. Or force rollback via Railway UI
# Go to: Deployments → Select previous deployment → Redeploy
```

---

## Post-Deployment

### 1. Verify Logs
```powershell
# Check Railway logs for errors
# Dashboard → Deployments → [Latest] → Deploy Logs
```

### 2. Performance Check
- [ ] Page load time < 2s
- [ ] API response time < 500ms
- [ ] No console errors in browser DevTools

### 3. Update Documentation
- [ ] Update CHANGELOG.md with new features
- [ ] Update README.md if needed
- [ ] Tag release: `git tag v1.x.x && git push --tags`

---

## Common Issues & Fixes

### ❌ Railway Build Fails
**Symptom:** Build logs show npm/pip errors  
**Fix:** 
```powershell
# Verify locally first
cd frontend && npm install && npm run build
cd .. && pip install -r requirements.txt
pytest -q
```

### ❌ White Screen / Blank Page
**Symptom:** Frontend shows white page  
**Fix:** Check for:
- Missing environment variables in Railway
- JavaScript errors in browser console
- Incorrect API endpoint URLs
- CORS issues

### ❌ Database Connection Fails
**Symptom:** 500 errors, "database connection failed" in logs  
**Fix:**
- Verify `DATABASE_URL` is set in Railway
- Check Railway Postgres service is running
- Run migrations: `alembic upgrade head`

### ❌ Login Doesn't Work
**Symptom:** 401/403 errors on login  
**Fix:**
- Verify `JWT_SECRET` is set
- Check admin user exists: `python scripts/seed_or_update_admin.py`
- Clear browser cache/cookies

### ❌ CSV Exports Empty
**Symptom:** Downloaded CSV has only headers  
**Fix:**
- Check database has data
- Verify fetch_all() returns rows
- Test locally first: `pytest tests/test_exports.py -v`

---

## Quick Commands Reference

```powershell
# Full local test before deploy
cd C:\Users\lukas\PyCharmMiscProject
pytest -q && cd frontend && npm run lint && npm run build && cd ..

# Check Railway status
Invoke-RestMethod https://synterra.up.railway.app/healthz

# View recent commits
git log --oneline -10

# Create new release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## Contact & Support

- **Admin Email:** admin@arkuszowniasmb.pl  
- **Domain:** https://arkuszowniasmb.pl  
- **Railway:** https://railway.app  
- **GitHub:** https://github.com/lukaszrohan-glitch/PyCharmMiscProject

---

**Last Updated:** 2025-11-26  
**Current Version:** 1.0.0  
**Status:** ✅ Production Ready

