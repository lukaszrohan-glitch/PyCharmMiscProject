$TunnelToken = "KLg_KyNRxf8u42hwDO9VvFttq5DfnGSAzReUCwIo"
$TunnelName = "arkuszownia-local"
$LocalPort = 8088

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan

mkdir .cloudflared -ErrorAction SilentlyContinue | Out-Null

$configPath = ".cloudflared\config.yml"
$config = @"
tunnel: $TunnelName
credentials-file: $(Resolve-Path .cloudflared)\cert.json

ingress:
  - hostname: arkuszowniasmb.pl
    service: http://localhost:$LocalPort
  - hostname: www.arkuszowniasmb.pl
    service: http://localhost:$LocalPort
  - hostname: api.arkuszowniasmb.pl
    service: http://localhost:$LocalPort
  - service: http_status:404
"@

Set-Content -Path $configPath -Value $config
Write-Host "[OK] Config created" -ForegroundColor Green

Write-Host ""
Write-Host "Running tunnel (press Ctrl+C to stop)..." -ForegroundColor Yellow
Write-Host ""

& .\cloudflared.exe tunnel --config $configPath run $TunnelName --token $TunnelToken
