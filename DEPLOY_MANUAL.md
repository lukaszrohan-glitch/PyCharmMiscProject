# Manual Deployment Instructions

## Prerequisites
- SSH access: `ssh -p 22222 serwer2581752@serwer2581752.home.pl`
- Password: `Kasienka#89`
- Docker installed on server

## Step 1: Connect to Server
```powershell
ssh -p 22222 serwer2581752@serwer2581752.home.pl
```

## Step 2: Create Deployment Directory
```bash
mkdir -p ~/arkuszownia
cd ~/arkuszownia
```

## Step 3: Upload Files

From your local machine in a separate terminal:

```powershell
$host = "serwer2581752@serwer2581752.home.pl"
$port = 22222
$localDir = "C:\Users\lukas\PyCharmMiscProject"

# Build frontend first
cd $localDir\frontend
npm run build
cd $localDir

# Upload core files
scp -P $port -r frontend/dist $host:~/arkuszownia/
scp -P $port docker-compose.yml $host:~/arkuszownia/
scp -P $port Dockerfile $host:~/arkuszownia/
scp -P $port nginx.conf $host:~/arkuszownia/
scp -P $port .env $host:~/arkuszownia/
scp -P $port entrypoint.sh $host:~/arkuszownia/
scp -P $port alembic.ini $host:~/arkuszownia/
scp -P $port requirements.txt $host:~/arkuszownia/
scp -P $port main.py $host:~/arkuszownia/
scp -P $port auth.py $host:~/arkuszownia/
scp -P $port db.py $host:~/arkuszownia/
scp -P $port schemas.py $host:~/arkuszownia/
scp -P $port queries.py $host:~/arkuszownia/
scp -P $port user_mgmt.py $host:~/arkuszownia/
scp -P $port logging_utils.py $host:~/arkuszownia/

# Upload directories
scp -P $port -r alembic $host:~/arkuszownia/
scp -P $port -r scripts $host:~/arkuszownia/
```

## Step 4: Start Application (on remote server)

```bash
cd ~/arkuszownia
mkdir -p logs/{nginx,cloudflared}

# Start Docker containers
docker-compose up -d

# Wait for startup
sleep 10

# Check status
docker-compose ps
```

## Step 5: Verify Services

```bash
# Check backend API
curl http://localhost:8000/healthz

# Check database connection
docker-compose exec backend python -c "from db import SessionLocal; SessionLocal()"

# View logs
docker-compose logs -f backend
```

## Step 6: Access Application

- Backend API: `http://serwer2581752.home.pl:8000`
- Frontend: `http://serwer2581752.home.pl:8088`

## Troubleshooting

### Check all services
```bash
docker-compose ps
```

### View specific logs
```bash
docker-compose logs backend
docker-compose logs db
docker-compose logs nginx
```

### Restart all services
```bash
docker-compose down
docker-compose up -d
```

### SSH into container
```bash
docker-compose exec backend bash
docker-compose exec db psql -U smb_user -d smbtool
```

### Stop everything
```bash
docker-compose down
```
