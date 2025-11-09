# Cloudflare Tunnel Configuration Script
# ASCII-only version to avoid encoding issues

param()

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSCommandPath
$EnvFile = Join-Path $ProjectRoot ".env"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE TUNNEL - QUICK CONFIGURATION" -ForegroundColor Cyan
Write-Host "  Arkuszownia SMB - Public Network Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Your tunnel information:" -ForegroundColor Yellow
Write-Host "  Tunnel ID: 9320212e-f379-4261-8777-f9623823beee" -ForegroundColor Green
Write-Host "  Domain: arkuszowniasmb.pl" -ForegroundColor Green
Write-Host "  DNS: CONFIGURED" -ForegroundColor Green
Write-Host ""

Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "STEP 1: Get your tunnel token" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Opening Cloudflare Dashboard..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

# Open Cloudflare Zero Trust dashboard
Start-Process "https://one.dash.cloudflare.com/"

Write-Host ""
Write-Host "In your browser, follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Navigate to: Zero Trust -> Access -> Tunnels" -ForegroundColor White
Write-Host "  2. Find tunnel: 9320212e-f379-4261-8777-f9623823beee" -ForegroundColor White
Write-Host "  3. Click on the tunnel name" -ForegroundColor White
Write-Host "  4. Click 'Configure' tab" -ForegroundColor White
Write-Host "  5. Scroll to 'Install connector'" -ForegroundColor White
Write-Host "  6. Select 'Docker' from dropdown" -ForegroundColor White
Write-Host "  7. Copy the token from the docker run command" -ForegroundColor White
Write-Host "     (Long string after --token)" -ForegroundColor White
Write-Host ""
Write-Host "Example token: eyJhIjoiNzk4M2E3Zj..." -ForegroundColor Gray
Write-Host ""

Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "STEP 2: Paste your token" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Paste your Cloudflare Tunnel token here"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host ""
    Write-Host "[ERROR] No token provided. Exiting..." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Token received!" -ForegroundColor Green
Write-Host ""

# Validate token format
if (-not $token.StartsWith("eyJ")) {
    Write-Host "[WARNING] Token format looks incorrect (should start with 'eyJ')" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "STEP 3: Saving configuration" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    $defaultEnv = @"
DATABASE_URL=postgresql://smb_user:smb_password@db:5432/smbtool
API_KEYS=dev-key-change-in-production
ADMIN_KEY=admin-change-in-production
CORS_ORIGINS=http://localhost:8080,http://localhost:3000,https://arkuszowniasmb.pl
ALLOWED_HOSTS=localhost,127.0.0.1,arkuszowniasmb.pl
CLOUDFLARE_TUNNEL_TOKEN=
"@
    Set-Content -Path $EnvFile -Value $defaultEnv
}

# Update token in .env
$envContent = Get-Content $EnvFile -Raw
if ($envContent -match 'CLOUDFLARE_TUNNEL_TOKEN=.*') {
    $envContent = $envContent -replace 'CLOUDFLARE_TUNNEL_TOKEN=.*', "CLOUDFLARE_TUNNEL_TOKEN=$token"
} else {
    $envContent += "`nCLOUDFLARE_TUNNEL_TOKEN=$token"
}

Set-Content -Path $EnvFile -Value $envContent -NoNewline

Write-Host "[OK] Token saved to .env file" -ForegroundColor Green
Write-Host ""

Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "STEP 4: Starting Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Stop any existing cloudflared
Write-Host "Stopping any existing tunnel..." -NoNewline
docker-compose stop cloudflared 2>&1 | Out-Null
Write-Host " Done" -ForegroundColor Green

# Start tunnel
Write-Host "Starting tunnel with production profile..." -NoNewline
docker-compose --profile production up -d cloudflared 2>&1 | Out-Null
Start-Sleep -Seconds 2
Write-Host " Done" -ForegroundColor Green
Write-Host ""

Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host "STEP 5: Checking connection" -ForegroundColor Cyan
Write-Host "----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "Waiting for tunnel to establish connection (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check logs
$logs = docker-compose logs cloudflared --tail 20 2>&1 | Out-String

if ($logs -match "Connection.*established" -or $logs -match "Registered tunnel") {
    Write-Host ""
    Write-Host "[SUCCESS] Tunnel is connected!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your site is now accessible at:" -ForegroundColor Cyan
    Write-Host "  https://arkuszowniasmb.pl" -ForegroundColor Green
    Write-Host "  https://www.arkuszowniasmb.pl" -ForegroundColor Green
    Write-Host ""

    Write-Host "Testing public access..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2

    try {
        $response = Invoke-WebRequest -Uri "https://arkuszowniasmb.pl" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] Public site is accessible!" -ForegroundColor Green
        }
    } catch {
        Write-Host "[INFO] Site not yet accessible (DNS may still be propagating)" -ForegroundColor Yellow
        Write-Host "       Wait 5-10 minutes and try: https://arkuszowniasmb.pl" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "[INFO] Tunnel started but connection not confirmed yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check the logs with:" -ForegroundColor White
    Write-Host "  docker-compose logs cloudflared -f" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Recent logs:" -ForegroundColor White
    docker-compose logs cloudflared --tail 10
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "[COMPLETE] Configuration finished!" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  Check status:  docker-compose ps cloudflared" -ForegroundColor White
Write-Host "  View logs:     docker-compose logs cloudflared -f" -ForegroundColor White
Write-Host "  Stop tunnel:   docker-compose stop cloudflared" -ForegroundColor White
Write-Host "  Restart:       docker-compose restart cloudflared" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host

