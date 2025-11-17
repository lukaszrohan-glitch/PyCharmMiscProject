# Railway.app Deployment Guide

## Prerequisites
- GitHub account with repository access
- Railway.app account (free tier supports $5 monthly credits)

## Step 1: Push Code to GitHub
Your code is already committed and pushed. Verify with:
```bash
git log --oneline -5
```

## Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"Create New Project"**
4. Select **"Deploy from GitHub"**
5. Authorize Railway to access your GitHub account
6. Select the repository: `PyCharmMiscProject`
7. Click **"Create project"**

## Step 3: Configure Services
Railway will auto-detect your `Dockerfile`. 

### Add PostgreSQL Database
1. In your Railway project dashboard, click **"Add Service"**
2. Select **"PostgreSQL"**
3. Configure if needed (defaults are fine)

### Backend Service
- **Name**: PyCharmMiscProject (or auto-generated)
- **Build Command**: (leave empty - uses Dockerfile)
- **Start Command**: `sh entrypoint.sh`
- **Port**: 8000

## Step 4: Set Environment Variables
In Railway dashboard, go to **Variables** tab:

```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
ADMIN_KEY=ak_prod_v1_xK9lM2nO3pQ4rS5tU6vW7xY8zA9bC0dE1fG2hI3jJ4kK5lL6mM7nN8oO9pP0qQ1rR2sS3tT4uU5vV6wW7xX8yY9zZ0aA1bB2cC3dD4eE5f
API_KEYS=sk_prod_v1_mZpqRsTuVwXyZ0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1
JWT_SECRET=jwt_prod_v1_nO9pQ0rS1tU2vW3xY4zA5bC6dE7fG8hI9jJ0kK1lL2mM3nN4oO5pP6qQ7rR8sS9tT0uV1wW2xX3yY4zZ5aA6bB7cC8dD9eE0fF1gG2hH3iI4jJ5
CORS_ORIGINS=https://your-railway-domain.railway.app,https://your-frontend-domain.railway.app
ENVIRONMENT=production
DEBUG=false
```

**Note**: Railway automatically provides `DATABASE_URL` after adding PostgreSQL. Remove the one you set manually if Railway creates it.

## Step 5: Automatic Database URL
When you add PostgreSQL, Railway automatically creates `DATABASE_URL`. You can:
1. Use Railway's auto-generated one (recommended)
2. Or reference it in Variables as `${{Postgres.DATABASE_URL}}`

## Step 6: Deploy
1. Click **"Deploy"** button
2. Watch build logs in the **"Build Logs"** tab
3. Check **"Deploy Logs"** tab for runtime logs
4. Once deployed, Railway provides a public URL

## Step 7: Verify Deployment
Once Railway shows "Deployment Successful":

```bash
curl https://your-app-domain.railway.app/healthz
# Should return: {"ok":true}
```

## Frontend Deployment
1. Create a separate Railway service for frontend
2. Or deploy frontend to Vercel (recommended for React):
   - Go to [vercel.com](https://vercel.com)
   - Import from GitHub
   - Set build command: `npm run build` (in frontend directory)
   - Update frontend API calls to point to Railway backend

## Accessing Services
- **Backend API**: `https://your-app-domain.railway.app/api/*`
- **Health Check**: `https://your-app-domain.railway.app/healthz`
- **Admin Endpoints**: Use `ADMIN_KEY` header
- **API Endpoints**: Use `API_KEYS` header

## Troubleshooting

### Build Fails
Check **Build Logs** for errors. Common issues:
- Missing dependencies in `requirements.txt`
- Python version mismatch
- Binary package compatibility

### Container Won't Start
Check **Deploy Logs**:
- `DATABASE_URL` not set correctly
- Port conflicts
- Application startup errors

### Migrations Fail
- Logs show "Could not parse SQLAlchemy URL"? 
- Verify `DATABASE_URL` is valid PostgreSQL connection string
- Alembic will use SQLite fallback if PostgreSQL unavailable

### Connection Issues
- Frontend can't reach backend API?
  - Check `CORS_ORIGINS` environment variable includes frontend domain
  - Verify backend service is running (check Deploy Logs)
  - Ensure API routes are correct (e.g., `/api/orders`)

## Important Notes
1. **First Deploy**: May take 3-5 minutes
2. **Auto-Deploy**: Every GitHub push to `main` triggers auto-deployment
3. **Database**: PostgreSQL data persists across restarts
4. **SSL/TLS**: Automatic with *.railway.app domains
5. **Backups**: Set up in Railway dashboard for production data

## Environment Variables to Rotate
Before production, update these in Railway:
- `ADMIN_KEY`: Generate new with `python -c "import secrets; print(secrets.token_urlsafe(48))"`
- `API_KEYS`: Same generation method
- `JWT_SECRET`: Same generation method

## Custom Domain (Optional)
In Railway dashboard:
1. Go to **Settings**
2. Add custom domain
3. Configure DNS records as Railway instructs

## Local Testing Before Deploy
```bash
# Build Docker image locally
docker build -t app:latest .

# Run with PostgreSQL in docker-compose
docker-compose up

# Test endpoint
curl http://localhost:8000/healthz
```

## Support
- Railway docs: https://docs.railway.app
- Discord community: https://discord.gg/railway
