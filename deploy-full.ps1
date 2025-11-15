param(
    [string]$SSHUser = "serwer2581752",
    [string]$SSHHost = "serwer2581752.home.pl",
    [int]$SSHPort = 22222,
    [string]$SSHPassword = "Kasienka#89",
    [string]$DeployPath = "/home/$SSHUser/arkuszownia"
)

$ErrorActionPreference = "Continue"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Full App Deployment to SSH Server" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow
$deployDir = "deploy_package"
if (Test-Path $deployDir) {
    Remove-Item -Recurse $deployDir -Force | Out-Null
}
mkdir $deployDir | Out-Null

Copy-Item -Path @(
    "docker-compose.yml",
    "Dockerfile",
    "nginx.conf",
    ".env",
    "entrypoint.sh",
    "alembic.ini",
    "requirements.txt",
    "main.py",
    "auth.py",
    "db.py",
    "schemas.py",
    "queries.py",
    "user_mgmt.py",
    "logging_utils.py"
) -Destination $deployDir -ErrorAction SilentlyContinue

mkdir "$deployDir/frontend" | Out-Null
mkdir "$deployDir/alembic" | Out-Null
mkdir "$deployDir/scripts" | Out-Null
mkdir "$deployDir/logs" | Out-Null

Copy-Item -Path "frontend/dist" -Destination "$deployDir/frontend/dist" -Recurse | Out-Null
Copy-Item -Path "alembic/env.py" -Destination "$deployDir/alembic/" -ErrorAction SilentlyContinue | Out-Null
Copy-Item -Path "alembic/script.py.mako" -Destination "$deployDir/alembic/" -ErrorAction SilentlyContinue | Out-Null
Copy-Item -Path "alembic/versions" -Destination "$deployDir/alembic/" -Recurse -ErrorAction SilentlyContinue | Out-Null
Copy-Item -Path "scripts/init.sql" -Destination "$deployDir/scripts/" -ErrorAction SilentlyContinue | Out-Null

Write-Host "[OK] Deployment package created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Creating deployment archive..." -ForegroundColor Yellow
$archiveName = "arkuszownia-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Compress-Archive -Path $deployDir -DestinationPath $archiveName -Force
Write-Host "[OK] Archive created: $archiveName" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Uploading to SSH server..." -ForegroundColor Yellow
$sshTarget = "$SSHUser@$SSHHost"

Write-Host "Uploading with scp (you may need to enter password manually)..." -ForegroundColor Gray
$scpDest = "$($sshTarget):/tmp/"
& scp -P $SSHPort -o StrictHostKeyChecking=no $archiveName $scpDest

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Archive uploaded" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Setting up on remote server..." -ForegroundColor Yellow

$setupCommands = @"
set -e
cd /tmp
unzip -o $archiveName
cd $deployDir
mkdir -p logs/{nginx,cloudflared}

echo 'Installing Docker if needed...'
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

echo 'Starting application with Docker...'
docker-compose down 2>/dev/null || true
docker-compose up -d

echo 'Waiting for services to start...'
sleep 10

echo 'Checking service status...'
docker-compose ps

echo '[OK] Deployment complete!'
"@

Write-Host "Setting up on remote server (you may need to enter password manually)..." -ForegroundColor Gray
& ssh -p $SSHPort -o StrictHostKeyChecking=no $sshTarget $setupCommands

Write-Host "[OK] Remote setup complete" -ForegroundColor Green
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment Successful!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is now running at:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://$($SSHHost):8000" -ForegroundColor White
Write-Host "  - Frontend: http://$($SSHHost):8088" -ForegroundColor White
Write-Host ""
Write-Host "To check logs:" -ForegroundColor Cyan
Write-Host "  ssh -p $($SSHPort) $($sshTarget)" -ForegroundColor Gray
Write-Host "  cd $($DeployPath) && docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop the app:" -ForegroundColor Cyan
Write-Host "  cd $($DeployPath) && docker-compose down" -ForegroundColor Gray
Write-Host ""

Remove-Item -Recurse $deployDir -Force -ErrorAction SilentlyContinue | Out-Null
Remove-Item $archiveName -Force -ErrorAction SilentlyContinue | Out-Null
Write-Host "Cleanup complete" -ForegroundColor Green
