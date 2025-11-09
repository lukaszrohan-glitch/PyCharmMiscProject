# Quick Cloudflare Tunnel Configuration
# This script will help you get and configure your tunnel token

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   CLOUDFLARE TUNNEL - QUICK CONFIGURATION                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Your tunnel information:" -ForegroundColor Yellow
Write-Host "  Tunnel ID: 9320212e-f379-4261-8777-f9623823beee" -ForegroundColor Green
Write-Host "  Domain: arkuszowniasmb.pl" -ForegroundColor Green
Write-Host "  DNS: ✅ Configured" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Get your tunnel token" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening Cloudflare Dashboard in your browser..." -ForegroundColor Yellow
Write-Host ""

# Open Cloudflare Zero Trust dashboard
Start-Process "https://one.dash.cloudflare.com/"

Write-Host "In your browser:" -ForegroundColor White
Write-Host "  1. Navigate to: Zero Trust → Access → Tunnels" -ForegroundColor White
Write-Host "  2. Find tunnel: 9320212e-f379-4261-8777-f9623823beee" -ForegroundColor White
Write-Host "  3. Click on the tunnel name" -ForegroundColor White
Write-Host "  4. Click 'Configure' tab" -ForegroundColor White
Write-Host "  5. Scroll to 'Install connector'" -ForegroundColor White
Write-Host "  6. Select 'Docker' from the dropdown" -ForegroundColor White
Write-Host "  7. Copy the token from the docker run command" -ForegroundColor White
Write-Host "     (It's the long string after --token)" -ForegroundColor White
Write-Host ""
Write-Host "The token looks like: eyJhIjoiNzk4M2E3Zj..." -ForegroundColor Gray
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 2: Paste your token here" -ForegroundColor Cyan
Write-Host ""

$token = Read-Host "Paste your Cloudflare Tunnel token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "`n❌ No token provided. Exiting..." -ForegroundColor Red
    exit 1
}

Write-Host "`n✓ Token received!" -ForegroundColor Green
Write-Host ""

# Validate token format (should start with eyJ)
if (-not $token.StartsWith("eyJ")) {
    Write-Host "⚠️  Warning: Token doesn't look correct (should start with 'eyJ')" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 3: Saving configuration" -ForegroundColor Cyan
Write-Host ""

# Update .env file
$envPath = Join-Path (Split-Path -Parent $PSCommandPath) ".env"
$envContent = Get-Content $envPath -Raw

if ($envContent -match 'CLOUDFLARE_TUNNEL_TOKEN=.*') {
    $envContent = $envContent -replace 'CLOUDFLARE_TUNNEL_TOKEN=.*', "CLOUDFLARE_TUNNEL_TOKEN=$token"
} else {
    $envContent += "`nCLOUDFLARE_TUNNEL_TOKEN=$token"
}

Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "✓ Token saved to .env file" -ForegroundColor Green
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 4: Starting Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host ""

# Stop any existing cloudflared container
Write-Host "Stopping any existing tunnel..." -NoNewline
docker-compose stop cloudflared 2>&1 | Out-Null
Write-Host " Done" -ForegroundColor Green

# Start tunnel with production profile
Write-Host "Starting tunnel..." -NoNewline
docker-compose --profile production up -d cloudflared 2>&1 | Out-Null
Start-Sleep -Seconds 2
Write-Host " Done" -ForegroundColor Green
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 5: Checking connection" -ForegroundColor Cyan
Write-Host ""
Write-Host "Waiting for tunnel to establish connection..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Check logs
$logs = docker-compose logs cloudflared --tail 20 2>&1 | Out-String

if ($logs -match "Connection.*established" -or $logs -match "Registered tunnel") {
    Write-Host "`n✅ SUCCESS! Tunnel is connected!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your site is now accessible at:" -ForegroundColor Cyan
    Write-Host "  🌐 https://arkuszowniasmb.pl" -ForegroundColor Green
    Write-Host "  🌐 https://www.arkuszowniasmb.pl" -ForegroundColor Green
    Write-Host ""

    Write-Host "Testing public access..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://arkuszowniasmb.pl" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Public site is accessible!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Site not yet accessible (DNS may still be propagating)" -ForegroundColor Yellow
        Write-Host "   Wait 5-10 minutes and try: https://arkuszowniasmb.pl" -ForegroundColor Gray
    }
} else {
    Write-Host "`n⚠️  Tunnel started but connection not confirmed yet" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check the logs:" -ForegroundColor White
    Write-Host "  docker-compose logs cloudflared -f" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Recent logs:" -ForegroundColor White
    docker-compose logs cloudflared --tail 10
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  Check status:  docker-compose ps cloudflared" -ForegroundColor White
Write-Host "  View logs:     docker-compose logs cloudflared -f" -ForegroundColor White
Write-Host "  Stop tunnel:   docker-compose stop cloudflared" -ForegroundColor White
Write-Host "  Restart:       docker-compose restart cloudflared" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to exit..." -NoNewline
Read-Host

