param(
    [Parameter(Mandatory=$true, HelpMessage="Cloudflare Tunnel Token")]
    [string]$TunnelToken,
    [string]$TunnelName = "arkuszownia-local",
    [int]$LocalPort = 8088
)

$ErrorActionPreference = "Stop"

try {
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Cloudflare Tunnel Setup (Local)" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    
    $cloudflaredPath = ".\cloudflared.exe"
    if (-not (Test-Path $cloudflaredPath)) {
        throw "cloudflared.exe not found in current directory"
    }
    
    Write-Host "1. Creating configuration file..." -ForegroundColor Yellow
    $configDir = ".cloudflared"
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir | Out-Null
    }
    
    $configContent = @"
tunnel: $TunnelName
credentials-file: $(Resolve-Path $configDir)\cert.json

ingress:
  - hostname: arkuszowniasmb.pl
    service: http://localhost:$LocalPort
  - hostname: www.arkuszowniasmb.pl
    service: http://localhost:$LocalPort
  - hostname: api.arkuszowniasmb.pl
    service: http://localhost:$LocalPort
  - service: http_status:404
"@
    
    Set-Content -Path "$configDir\config.yml" -Value $configContent
    Write-Host "[OK] Configuration created" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "2. Checking cloudflared service..." -ForegroundColor Yellow
    $service = Get-Service -Name cloudflared -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "  Stopping existing service..." -ForegroundColor Gray
        Stop-Service -Name cloudflared -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        Write-Host "  Uninstalling existing service..." -ForegroundColor Gray
        & $cloudflaredPath service uninstall | Out-Null
        Start-Sleep -Seconds 2
    }
    
    Write-Host "[OK] Service cleaned up" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "3. Installing cloudflared service..." -ForegroundColor Yellow
    Write-Host "  Token: $($TunnelToken.Substring(0, 20))..." -ForegroundColor Gray
    
    & $cloudflaredPath service install --token $TunnelToken | Out-Null
    Write-Host "[OK] Service installed" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "4. Starting cloudflared service..." -ForegroundColor Yellow
    Start-Service -Name cloudflared
    Start-Sleep -Seconds 5
    
    $service = Get-Service -Name cloudflared
    if ($service.Status -eq "Running") {
        Write-Host "[OK] Service started successfully" -ForegroundColor Green
    } else {
        throw "Service failed to start. Status: $($service.Status)"
    }
    
    Write-Host ""
    Write-Host "5. Testing tunnel connectivity..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:$LocalPort/healthz" -UseBasicParsing -TimeoutSec 5
        Write-Host "[OK] Local service responding" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Could not reach local service" -ForegroundColor Yellow
        Write-Host "  Make sure Docker containers are running: docker-compose up -d" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://one.dash.cloudflare.com/tunnels" -ForegroundColor White
    Write-Host "2. Select your tunnel: $TunnelName" -ForegroundColor White
    Write-Host "3. Add public hostnames for your domains" -ForegroundColor White
    Write-Host "4. Update DNS records to point to Cloudflare" -ForegroundColor White
    Write-Host "5. Test access: https://arkuszowniasmb.pl" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "  View logs:     Get-EventLog -LogName Application -Source cloudflared -Newest 20" -ForegroundColor Gray
    Write-Host "  Stop service:  Stop-Service cloudflared" -ForegroundColor Gray
    Write-Host "  Start service: Start-Service cloudflared" -ForegroundColor Gray
    Write-Host "  Service status: Get-Service cloudflared" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "[ERROR] Setup failed: $_" -ForegroundColor Red
    exit 1
}
