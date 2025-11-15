$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   DEPLOY BACKEND TO HOME.PL SERVER" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$sshHost = "serwer2581752@serwer2581752.home.pl"
$appDir = "/home/serwer2581752/arkuszowniasmb"

Write-Host "[1/6] Testing SSH connection..." -ForegroundColor Yellow
$result = ssh $sshHost "echo test" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [+] SSH connected" -ForegroundColor Green
} else {
    Write-Host "   [!] SSH failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/6] Creating directories..." -ForegroundColor Yellow
ssh $sshHost "mkdir -p $appDir/logs $appDir/backups" 2>&1 | Out-Null
Write-Host "   [+] Directories ready" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Uploading files..." -ForegroundColor Yellow
$files = @("main.py", "auth.py", "user_mgmt.py", "db.py", "schemas.py", "logging_utils.py", "requirements.txt", ".env")
foreach ($file in $files) {
    if (Test-Path ".\$file") {
        Write-Host "   Uploading $file..." -ForegroundColor Gray
        scp -q ".\$file" "${sshHost}:${appDir}/" 2>&1 | Out-Null
    }
}
Write-Host "   [+] Files uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "[4/6] Setting up Python..." -ForegroundColor Yellow
$setupCmd = @"
cd $appDir
python3 -m venv venv
. venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
"@
ssh $sshHost bash -c "'$setupCmd'" 2>&1 | Out-Null
Write-Host "   [+] Python ready" -ForegroundColor Green

Write-Host ""
Write-Host "[5/6] Creating systemd service..." -ForegroundColor Yellow
$serviceContent = @"
[Unit]
Description=ArkuszowniaSMB Backend
After=network.target

[Service]
Type=simple
User=serwer2581752
WorkingDirectory=$appDir
Environment="PATH=$appDir/venv/bin"
ExecStart=$appDir/venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10
StandardOutput=append:$appDir/logs/backend.log
StandardError=append:$appDir/logs/backend.log

[Install]
WantedBy=multi-user.target
"@

$tempFile = [System.IO.Path]::Combine($env:TEMP, "arkuszowniasmb.service")
Set-Content -Path $tempFile -Value $serviceContent -Encoding UTF8
scp -q $tempFile "${sshHost}:/tmp/arkuszowniasmb.service" 2>&1 | Out-Null
Remove-Item $tempFile
Write-Host "   [+] Service file ready" -ForegroundColor Green

Write-Host ""
Write-Host "[6/6] Initializing database..." -ForegroundColor Yellow
$initCmd = @"
cd $appDir
. venv/bin/activate
python3 -c 'from db import init_db; init_db()'
"@
ssh $sshHost bash -c "'$initCmd'" 2>&1 | Out-Null
Write-Host "   [+] Database initialized" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "        DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps (run on server via SSH):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. sudo mv /tmp/arkuszowniasmb.service /etc/systemd/system/" -ForegroundColor Gray
Write-Host "2. sudo systemctl daemon-reload" -ForegroundColor Gray
Write-Host "3. sudo systemctl enable arkuszowniasmb" -ForegroundColor Gray
Write-Host "4. sudo systemctl start arkuszowniasmb" -ForegroundColor Gray
Write-Host ""
Write-Host "Then test:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:8000/healthz" -ForegroundColor Gray
Write-Host ""
