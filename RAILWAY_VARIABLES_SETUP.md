# Railway Environment Variables Setup Guide

## Required Variables

These environment variables MUST be set in your Railway project dashboard:

### 1. JWT_SECRET (CRITICAL - Security)
```
JWT_SECRET=c6bcd7456a5d3bbc704aefe37e4b2af431f0e8226cbbe456c6cc73bb384ba1bb0d81cb2bf5fee214161e17153a37da030737fdc18520217faa969cd5befcb48d
```

**Why it's needed**: This secret is used to sign and verify JWT tokens for user authentication. Without it, login will fail.

### 2. ADMIN_EMAIL
```
ADMIN_EMAIL=admin@arkuszowniasmb.pl
```

### 3. ADMIN_PASSWORD
```
ADMIN_PASSWORD=Admin123!@#Secure
```

### 4. DATABASE_URL
**Note**: Railway automatically provides this when you attach a PostgreSQL database. Don't set it manually.

### 5. CORS_ORIGINS
```
CORS_ORIGINS=https://synterra.up.railway.app
```

## How to Set Variables on Railway

### Method 1: Railway Dashboard (Recommended)
1. Go to https://railway.app/dashboard
2. Click on your `PyCharmMiscProject` project
3. Click on the service (backend)
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Add each variable above one by one

### Method 2: Railway CLI
```powershell
# Link to your project first
railway link

# Set variables
railway variables --set "JWT_SECRET=c6bcd7456a5d3bbc704aefe37e4b2af431f0e8226cbbe456c6cc73bb384ba1bb0d81cb2bf5fee214161e17153a37da030737fdc18520217faa969cd5befcb48d"
railway variables --set "ADMIN_EMAIL=admin@arkuszowniasmb.pl"
railway variables --set "ADMIN_PASSWORD=Admin123!@#Secure"
railway variables --set "CORS_ORIGINS=https://synterra.up.railway.app"
```

## Verification

After setting variables, verify they're present:
```powershell
railway variables --kv
```

Or check in the Railway dashboard under Variables tab.

## Troubleshooting

### Login returns 401 or 500 error
- Check JWT_SECRET is set correctly (no typos, no extra spaces)
- Verify DATABASE_URL is present (Railway should auto-provide this)
- Check backend logs: `railway logs`

### "Internal Server Error" on login
- Usually means JWT_SECRET is missing or DATABASE_URL is wrong
- Check logs: `railway logs --tail`

### Site loads but can't authenticate
- CORS_ORIGINS might be incorrect
- JWT_SECRET might have been changed after tokens were issued
- Clear browser cookies and try again

## Current Configuration Status

Based on your setup:
- ✅ JWT_SECRET generated (needs to be set on Railway)
- ✅ Admin credentials defined
- ⚠️ Railway CLI might need re-authentication
- 🔄 Variables need to be set via dashboard

## Next Steps

1. **Set JWT_SECRET on Railway dashboard immediately**
2. Set other environment variables
3. Restart the Railway service (happens automatically after adding vars)
4. Test login at https://synterra.up.railway.app
5. Monitor logs: `railway logs --tail`

---

Generated: November 28, 2025
Project: PyCharmMiscProject (Synterra)
Railway Service: backend

