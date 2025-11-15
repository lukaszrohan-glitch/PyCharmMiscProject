$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   SETUP CLOUDFLARED ON HOME.PL SERVER" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$sshHost = "serwer2581752@serwer2581752.home.pl"
$appDir = "/home/serwer2581752/arkuszowniasmb"

# Read TUNNEL_TOKEN from .env
$envContent = Get-Content .\.env
$tunnelToken = ($envContent | Select-String "TUNNEL_TOKEN=" | ForEach-Object { $_.Line -replace 'TUNNEL_TOKEN=', '' }).Trim()

if (-not $tunnelToken) {
    Write-Host "[!] ERROR: TUNNEL_TOKEN not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Installing cloudflared..." -ForegroundColor Yellow
$installCmd = @"
cd /tmp
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb
"@
ssh $sshHost bash -c "'$installCmd'" 2>&1 | Out-Null
Write-Host "   [+] Cloudflared installed" -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Creating configuration..." -ForegroundColor Yellow
$configContent = @"
tunnel: arkuszowniasmb
credentials-file: /home/serwer2581752/.cloudflared/cert.pem

ingress:
  - hostname: api.arkuszowniasmb.pl
    service: http://localhost:8000
  - service: http_status:404
"@

$tempFile = [System.IO.Path]::Combine($env:TEMP, "config.yml")
Set-Content -Path $tempFile -Value $configContent -Encoding UTF8
scp -q $tempFile "${sshHost}:/tmp/config.yml" 2>&1 | Out-Null

$setupCmd = @"
mkdir -p $appDir/.cloudflared
mkdir -p /home/serwer2581752/.cloudflared
mv /tmp/config.yml $appDir/.cloudflared/config.yml
"@
ssh $sshHost bash -c "'$setupCmd'" 2>&1 | Out-Null
Remove-Item $tempFile
Write-Host "   [+] Configuration ready" -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Installing tunnel service..." -ForegroundColor Yellow
$authCmd = @"
export TUNNEL_TOKEN=$tunnelToken
cloudflared tunnel install
"@
ssh $sshHost bash -c "'$authCmd'" 2>&1 | Out-Null
Write-Host "   [+] Tunnel authenticated" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Starting service..." -ForegroundColor Yellow
ssh $sshHost "sudo systemctl daemon-reload; sudo systemctl enable cloudflared; sudo systemctl start cloudflared" 2>&1 | Out-Null
Write-Host "   [+] Service running" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        CLOUDFLARED SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verify status:" -ForegroundColor Yellow
Write-Host "   ssh $sshHost 'sudo systemctl status cloudflared'" -ForegroundColor Gray
Write-Host ""
Write-Host "Check logs:" -ForegroundColor Yellow
Write-Host "   ssh $sshHost 'sudo journalctl -u cloudflared -n 20'" -ForegroundColor Gray
Write-Host ""
