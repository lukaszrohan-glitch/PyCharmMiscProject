
param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          CLOUDFLARE TUNNEL TOKEN FIX                          " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Validate token format
if ($Token -notmatch '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$') {
    Write-Host "ERROR: Invalid token format!" -ForegroundColor Red
    Write-Host "Token should be in JWT format: xxxxx.yyyyy.zzzzz" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] Stopping existing tunnel..." -ForegroundColor Yellow
try {
    Stop-Service cloudflared -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
catch {
    Write-Host "   No service to stop" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/4] Testing token..." -ForegroundColor Yellow
$testLog = "$env:TEMP\cloudflared-test.log"
$testErr = "$env:TEMP\cloudflared-test.err"

$testProc = Start-Process -FilePath ".\cloudflared.exe" `
    -ArgumentList "tunnel", "--no-autoupdate", "run", "--token", $Token `
    -PassThru `
    -RedirectStandardOutput $testLog `
    -RedirectStandardError $testErr `
    -WindowStyle Hidden

Start-Sleep -Seconds 8

if ($testProc.HasExited) {
    Write-Host "   ERROR: Token test failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor Yellow
    Get-Content $testErr -ErrorAction SilentlyContinue | Select-Object -Last 20
    Write-Host ""
    Write-Host "Log output:" -ForegroundColor Yellow
    Get-Content $testLog -ErrorAction SilentlyContinue | Select-Object -Last 20
    exit 1
}

Stop-Process -Id $testProc.Id -Force
Write-Host "   OK Token is valid" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Installing tunnel service..." -ForegroundColor Yellow

# Uninstall old service
& ".\cloudflared.exe" service uninstall 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Install with token
& ".\cloudflared.exe" service install $Token

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERROR: Service installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   OK Service installed" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Starting tunnel..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    Start-Service cloudflared -ErrorAction Stop
    Start-Sleep -Seconds 3

    $service = Get-Service cloudflared
    if ($service.Status -eq "Running") {
        Write-Host "   OK Tunnel is running" -ForegroundColor Green
    }
    else {
        Write-Host "   WARNING Service status: $($service.Status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ERROR: Failed to start service" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                    TUNNEL FIXED                               " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your tunnel should now be accessible at your Cloudflare domain" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check status:" -ForegroundColor Yellow
Write-Host "   Get-Service cloudflared" -ForegroundColor White
Write-Host "   .\cloudflared.exe tunnel list" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "   Get-EventLog -LogName Application -Source cloudflared -Newest 20" -ForegroundColor White
Write-Host ""
