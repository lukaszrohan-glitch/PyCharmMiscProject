# Railway Environment Setup Guide

## Critical Environment Variables

These environment variables **MUST** be set in Railway for production deployment:

### 🔴 REQUIRED (App will not start without these)

```bash
# JWT Secret - Generate with: openssl rand -hex 64
JWT_SECRET=<your-128-character-random-string>

# Database Connection
DATABASE_URL=<provided-by-railway-postgres-plugin>
```

### 🟠 RECOMMENDED (For security and monitoring)

```bash
# CORS Origins (comma-separated)
CORS_ORIGINS=https://synterra.up.railway.app,https://arkuszowniasmb.pl

# Admin Bootstrap (first-time setup)
ADMIN_EMAIL=admin@arkuszowniasmb.pl
ADMIN_PASSWORD=<strong-password-here>

# Sentry Error Tracking (optional but recommended)
SENTRY_DSN=<your-sentry-dsn>

# Environment identifier
ENV=production
```

### 🟢 OPTIONAL (Performance & Features)

```bash
# Redis for caching and distributed rate limiting
REDIS_URL=<redis-connection-string>

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_TIMEOUT=30
DB_CONNECT_TIMEOUT=10

# SSL Mode for Postgres
PG_SSLMODE=require

# Logging
LOG_LEVEL=INFO

# API Rate Limiting
API_KEYS=<comma-separated-api-keys-for-legacy-support>
```

## 🚀 Quick Setup Commands

### 1. Generate JWT Secret

```bash
# Linux/Mac
openssl rand -hex 64

# Windows PowerShell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[System.BitConverter]::ToString($bytes).Replace("-","").ToLower()
```

### 2. Set in Railway

```bash
# Via Railway CLI
railway variables set JWT_SECRET="<your-generated-secret>"
railway variables set ADMIN_EMAIL="your-email@company.com"
railway variables set ADMIN_PASSWORD="YourStrongPassword123!"

# Via Railway Dashboard
# Go to: Project > Variables > Add Variable
```

### 3. Verify Setup

After setting variables and deploying:

```bash
# Check health endpoint
curl https://synterra.up.railway.app/healthz
# Should return: {"ok": true}

# Check readiness
curl https://synterra.up.railway.app/readyz
# Should return: {"ready": true, "db": "postgres", "alembic_version": "..."}

# Test login
curl -X POST https://synterra.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@arkuszowniasmb.pl", "password": "YourStrongPassword123!"}'
# Should return access_token
```

## 🔒 Security Checklist

- [ ] JWT_SECRET is at least 64 characters (128 recommended)
- [ ] JWT_SECRET is randomly generated (not a password)
- [ ] ADMIN_PASSWORD meets complexity requirements (12+ chars, mixed case, numbers, symbols)
- [ ] DATABASE_URL uses SSL (sslmode=require)
- [ ] CORS_ORIGINS is set to specific domains (not "*")
- [ ] Environment is set to "production"
- [ ] Secrets are never committed to git

## 🐛 Troubleshooting

### App won't start

```
Error: JWT_SECRET is required
```
**Solution:** Set JWT_SECRET environment variable (see above)

### Tokens expire on every deploy

```
Users keep getting logged out after deployments
```
**Solution:** JWT_SECRET was not set or is changing. Set it as persistent env var in Railway.

### Database connection fails

```
Error: Failed to initialize DB connection pool
```
**Solution:** Verify DATABASE_URL is set correctly. Railway Postgres plugin auto-sets this.

### CORS errors in browser

```
Access blocked by CORS policy
```
**Solution:** Add your domain to CORS_ORIGINS:
```bash
railway variables set CORS_ORIGINS="https://your-domain.com"
```

## 📊 Monitoring Setup

### Enable Sentry (Recommended)

1. Create account at [sentry.io](https://sentry.io)
2. Create new Python project
3. Copy DSN
4. Set in Railway:
```bash
railway variables set SENTRY_DSN="your-dsn-here"
```

### Enable Redis Caching (Optional)

1. Add Redis plugin in Railway
2. Copy REDIS_URL from plugin
3. Set in Railway:
```bash
railway variables set REDIS_URL="redis://..."
```

## 🔄 Environment Updates

To update environment variables without downtime:

```bash
# Railway automatically restarts the service
railway variables set VAR_NAME="new-value"

# For multiple variables
railway variables set VAR1="value1" VAR2="value2"
```

## 📝 Notes

- Never commit `.env` file with production secrets to git
- Rotate JWT_SECRET quarterly (will log all users out)
- Keep ADMIN_PASSWORD in password manager
- Use separate secrets for staging vs production
- Monitor Railway logs for startup errors

## 🆘 Emergency Access

If you lose admin access:

1. Connect to Railway shell:
```bash
railway run bash
```

2. Reset admin password:
```bash
python -c "
import user_mgmt
user_mgmt.ensure_user_tables()
user_mgmt.reset_admin_password('admin@arkuszowniasmb.pl', 'NewPassword123!')
"
```

## 📞 Support

If you encounter issues:

1. Check Railway deployment logs
2. Review audit report: `BACKEND_AUDIT_REPORT.md`
3. Check health endpoints
4. Review Sentry errors (if enabled)

