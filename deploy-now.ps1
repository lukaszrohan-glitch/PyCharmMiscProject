param(
    [string]$SSHHost = "serwer2581752@serwer2581752.home.pl",
    [int]$SSHPort = 22222,
    [string]$RemoteDir = "arkuszownia"
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deploying Application NOW" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Building frontend..." -ForegroundColor Yellow
Push-Location frontend
& npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }
Pop-Location
Write-Host "[OK] Frontend built" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Creating deployment archive..." -ForegroundColor Yellow
$files = @(
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
)

foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Host "[WARN] Missing: $f" -ForegroundColor Yellow
    }
}

Compress-Archive -Path ($files + "frontend/dist", "alembic", "scripts") -DestinationPath deploy-app.zip -Force | Out-Null
Write-Host "[OK] Archive created" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Uploading to server..." -ForegroundColor Yellow
Write-Host "Enter SSH password when prompted" -ForegroundColor Gray
& scp -P $SSHPort deploy-app.zip "$($SSHHost):~/$RemoteDir/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Upload complete" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Starting application on remote server..." -ForegroundColor Yellow
$commands = @"
set -e
cd ~/$RemoteDir
unzip -o deploy-app.zip
mkdir -p logs/{nginx,cloudflared}
docker-compose down 2>/dev/null || true
docker-compose up -d
sleep 15
echo ""
echo "================================"
echo "Application Started!"
echo "================================"
docker-compose ps
"@

& ssh -p $SSHPort $SSHHost $commands

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your app:" -ForegroundColor Cyan
Write-Host "  Backend: http://serwer2581752.home.pl:8000" -ForegroundColor White
Write-Host "  Frontend: http://serwer2581752.home.pl:8088" -ForegroundColor White
Write-Host ""
Write-Host "Check logs:" -ForegroundColor Cyan
Write-Host "  ssh -p 22222 serwer2581752@serwer2581752.home.pl" -ForegroundColor Gray
Write-Host "  cd ~/$RemoteDir && docker-compose logs -f" -ForegroundColor Gray
Write-Host ""

Remove-Item deploy-app.zip -Force -ErrorAction SilentlyContinue | Out-Null
