# Start LocalTunnel for Public Access
# No signup needed - instant public URLs!

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  LOCALTUNNEL - INSTANT PUBLIC ACCESS" -ForegroundColor Cyan
Write-Host "  Arkuszownia SMB" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if localtunnel is installed
Write-Host "[CHECK] Checking if localtunnel is installed..." -ForegroundColor Yellow
$ltInstalled = Get-Command lt -ErrorAction SilentlyContinue

if (-not $ltInstalled) {
    Write-Host "[INFO] LocalTunnel not installed. Installing..." -ForegroundColor Yellow
    Write-Host ""
    npm install -g localtunnel
    Write-Host ""
    Write-Host "[OK] LocalTunnel installed!" -ForegroundColor Green
}

# Check if app is running
Write-Host "[CHECK] Testing if local app is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] Local app is running!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Local app not responding on port 8080" -ForegroundColor Yellow
    Write-Host ""
    $start = Read-Host "Start the app now? (y/n)"
    if ($start -eq "y") {
        Write-Host "Starting app..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\lukas\PyCharmMiscProject; .\manage.ps1 start"
        Write-Host "Waiting for app to start (10 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host ""
        Write-Host "Please start your app first:" -ForegroundColor Yellow
        Write-Host "  .\manage.ps1 start" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "[INFO] Starting LocalTunnel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app will be accessible at:" -ForegroundColor White
Write-Host "  https://arkuszowniasmb.loca.lt" -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: First visit may show a captcha page" -ForegroundColor Yellow
Write-Host "      Just click through it once" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Press CTRL+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting in 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Write-Host ""

# Start localtunnel
lt --port 8080 --subdomain arkuszowniasmb

