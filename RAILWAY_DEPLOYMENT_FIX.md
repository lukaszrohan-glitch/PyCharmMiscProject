# Railway Deployment Fixes - Database Connection Issues

## Issues Fixed

### 1. **Insufficient Database Wait Timeout** (entrypoint.sh)
**Problem**: Database connection timeout after 60 seconds, causing deployment failures.
**Solution**:
- Increased timeout from 60s to 300s (5 minutes)
- Added exponential backoff (1-10 second increments)
- Increased socket timeout from 1.0s to 3.0s
- Added progress logging every 30 seconds
- Now **fails immediately** if database is unreachable (doesn't continue anyway)

### 2. **Failed Migrations Ignored** (entrypoint.sh)
**Problem**: Migrations were failing silently with `|| true`, app started without schema.
**Solution**:
- Changed from `alembic upgrade head || echo "..."` to proper error handling
- Deployment **exits with error code 1** if migrations fail
- Added clear success confirmation message

### 3. **Missing Connection Timeout Configuration** (db.py)
**Problem**: No timeout on psycopg2 connection pool, could hang indefinitely.
**Solution**:
- Added `DB_CONNECT_TIMEOUT` environment variable support (default: 10s)
- Applied timeout to connection DSN string
- Configurable via Railway environment variables

### 4. **Alembic Missing Error Handling** (alembic/env.py)
**Problem**: Migration errors not properly logged or handled.
**Solution**:
- Added logging setup for Alembic
- Validates `sqlalchemy.url` is configured before attempting migrations
- Catches and logs connection errors with proper exit codes
- Passes `connect_args` with timeout to SQLAlchemy engine

### 5. **Short Health Check Initial Delays** (railway.json)
**Problem**: Health checks started too early (5-10s), before database was ready.
**Solution**:
- Increased `initialDelaySeconds` to 30 for both liveness and readiness probes
- Gives entrypoint time to wait for database and run migrations

## Environment Variables for Railway

### Required
- **DATABASE_URL**: PostgreSQL connection string (provided by Railway)
  - Format: `postgresql://user:password@host:port/database`

### Optional
- **DB_POOL_MIN**: Minimum connections in pool (default: 1)
- **DB_POOL_MAX**: Maximum connections in pool (default: 10)
- **DB_CONNECT_TIMEOUT**: Connection timeout in seconds (default: 10)
- **PG_SSLMODE**: SSL mode for connections (optional)
- **CORS_ORIGINS**: Comma-separated list of allowed CORS origins
- **API_KEYS**: Comma-separated list of API keys
- **ADMIN_KEY**: Admin API key

## Testing the Fix

### Local Testing
```bash
# Simulate database unavailability
unset DATABASE_URL
sh entrypoint.sh

# Should use SQLite fallback and start successfully
```

### Railway Deployment
1. Ensure `DATABASE_URL` environment variable is set in Railway dashboard
2. Deploy code with new fixes
3. Watch deployment logs:
   - Should see "Waiting for database..." message
   - Should see progress messages every 30 seconds
   - Should see "✓ Database is reachable..."
   - Should see "✓ Migrations completed successfully"
   - Should see "Starting uvicorn..." and server should be running

### Troubleshooting

**If you see: "ERROR: Database not reachable after 300s"**
- Check Railway PostgreSQL instance is running
- Verify DATABASE_URL is correctly set
- Check network connectivity between app and database
- Look for PostgreSQL logs in Railway dashboard

**If you see: "ERROR: Alembic migrations failed"**
- Check alembic migration files in `/app/alembic/versions/`
- Verify database schema hasn't been modified externally
- Check for SQL errors in migration files

**If app shows connection timeouts after starting:**
- Increase DB_CONNECT_TIMEOUT to 15-20s
- Check database performance and load
- Verify connection pool settings (DB_POOL_MIN/MAX)

## Files Modified

1. **entrypoint.sh**
   - Added 5-minute timeout with exponential backoff
   - Proper error exit codes
   - Better logging

2. **db.py**
   - Added connection timeout configuration
   - Support for DB_CONNECT_TIMEOUT env var

3. **alembic/env.py**
   - Added error handling
   - Connection timeout passthrough
   - Proper logging and exit codes

4. **railway.json**
   - Increased health check initial delays to 30s

## Performance Improvements

- Exponential backoff reduces unnecessary polling during startup
- Connection timeouts prevent hanging connections
- Better error messages enable faster debugging
- Health check delays reduce false failures
