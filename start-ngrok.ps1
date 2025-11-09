# Start ngrok Tunnel for Public Access
# Simple script to expose your local app to the internet

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  NGROK - PUBLIC ACCESS TUNNEL" -ForegroundColor Cyan
Write-Host "  Arkuszownia SMB" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok exists
if (-not (Test-Path ".\ngrok.exe")) {
    Write-Host "[ERROR] ngrok.exe not found in current directory!" -ForegroundColor Red
    Write-Host ""
    Write-Host "TO FIX:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://ngrok.com/download" -ForegroundColor White
    Write-Host "2. Download Windows version" -ForegroundColor White
    Write-Host "3. Extract ngrok.exe to: C:\Users\lukas\PyCharmMiscProject" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Opening download page..." -ForegroundColor Yellow
    Start-Process "https://ngrok.com/download"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
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
Write-Host "[INFO] Starting ngrok tunnel on port 8080..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app will be accessible at a public URL like:" -ForegroundColor White
Write-Host "  https://abc123def.ngrok.io" -ForegroundColor Green
Write-Host ""
Write-Host "Share that URL with anyone to give them access!" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Press CTRL+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting in 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Write-Host ""

# Start ngrok
.\ngrok http 8080

