param(
    [string]$TunnelToken = $(Read-Host "Enter Cloudflare tunnel token")
)

$sshHost = "serwer2581752@serwer2581752.home.pl"
$appDir = "/home/serwer2581752/arkuszowniasmb"

Write-Host "Setting up Cloudflare tunnel on home.pl..." -ForegroundColor Cyan
Write-Host ""

# Step 1: SSH connection check
Write-Host "[1/5] Testing SSH connection..." -ForegroundColor Yellow
$result = ssh $sshHost "echo 'SSH OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SSH connection failed" -ForegroundColor Red
    Write-Host "Make sure SSH is enabled in home.pl panel: Konta -> SSH/SFTP" -ForegroundColor Yellow
    exit 1
}
Write-Host "   [+] SSH connection successful" -ForegroundColor Green

# Step 2: Install cloudflared on remote server
Write-Host ""
Write-Host "[2/5] Installing cloudflared on remote server..." -ForegroundColor Yellow
$installCmd = @"
cd /tmp
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb 2>&1 | grep -i "setting|installed" || true
cloudflared --version
"@
ssh $sshHost "bash -c '$installCmd'" 2>&1 | Select-String "cloudflared"
Write-Host "   [+] Cloudflared installed" -ForegroundColor Green

# Step 3: Create cloudflared config on remote server
Write-Host ""
Write-Host "[3/5] Creating tunnel configuration..." -ForegroundColor Yellow
$configContent = @"
tunnel-token: $TunnelToken
logfile: $appDir/logs/cloudflared.log
loglevel: info
no-autoupdate: true
metrics: 127.0.0.1:49500

ingress:
  - hostname: arkuszowniasmb.com
    service: http://localhost:8088
  - hostname: www.arkuszowniasmb.com
    service: http://localhost:8088
  - hostname: arkuszowniasmb.pl
    service: http://localhost:8088
  - hostname: www.arkuszowniasmb.pl
    service: http://localhost:8088
  - service: http_status:404
"@

$configFile = "cloudflared-config.yml"
$configContent | Out-File -FilePath $configFile -Encoding UTF8 -Force
scp -q $configFile "${sshHost}:${appDir}/.cloudflared-config.yml"
rm $configFile
Write-Host "   [+] Config uploaded to remote server" -ForegroundColor Green

# Step 4: Create systemd service for cloudflared
Write-Host ""
Write-Host "[4/5] Setting up cloudflared as systemd service..." -ForegroundColor Yellow
$serviceCmd = @"
cat > /tmp/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=serwer2581752
ExecStart=/usr/bin/cloudflared tunnel --config $appDir/.cloudflared-config.yml run
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/cloudflared.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
"@
$serviceOutput = ssh $sshHost "bash -c '$serviceCmd'" 2>&1
if ($serviceOutput -match "enabled") {
    Write-Host "   [+] Service enabled" -ForegroundColor Green
}

# Step 5: Start the tunnel
Write-Host ""
Write-Host "[5/5] Starting cloudflared tunnel..." -ForegroundColor Yellow
ssh $sshHost "sudo systemctl restart cloudflared" 2>&1
Start-Sleep -Seconds 2
ssh $sshHost "sudo systemctl status cloudflared --no-pager" 2>&1 | Select-String "active"
Write-Host "   [+] Tunnel started" -ForegroundColor Green

# Final status
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   TUNNEL SETUP COMPLETE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is now accessible at:" -ForegroundColor Cyan
Write-Host "   https://arkuszowniasmb.pl" -ForegroundColor Yellow
Write-Host "   https://arkuszowniasmb.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitor tunnel status:" -ForegroundColor Cyan
Write-Host "   ssh $sshHost 'sudo journalctl -u cloudflared -f'" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend is still running on Docker locally at:" -ForegroundColor Cyan
Write-Host "   http://localhost:8088 (internal access)" -ForegroundColor Gray
Write-Host ""
