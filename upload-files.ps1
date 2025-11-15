$SSHHost = "serwer2581752@serwer2581752.home.pl"
$SSHPort = 22222
$RemoteDir = "~/arkuszownia"

Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "[OK] Frontend built" -ForegroundColor Green
Write-Host ""

Write-Host "Uploading files to server..." -ForegroundColor Yellow
Write-Host "You will need to enter SSH password multiple times" -ForegroundColor Gray
Write-Host ""

scp -P $SSHPort -r frontend/dist $SSHHost`:$RemoteDir/
scp -P $SSHPort docker-compose.yml $SSHHost`:$RemoteDir/
scp -P $SSHPort Dockerfile $SSHHost`:$RemoteDir/
scp -P $SSHPort nginx.conf $SSHHost`:$RemoteDir/
scp -P $SSHPort .env $SSHHost`:$RemoteDir/
scp -P $SSHPort entrypoint.sh $SSHHost`:$RemoteDir/
scp -P $SSHPort alembic.ini $SSHHost`:$RemoteDir/
scp -P $SSHPort requirements.txt $SSHHost`:$RemoteDir/
scp -P $SSHPort main.py $SSHHost`:$RemoteDir/
scp -P $SSHPort auth.py $SSHHost`:$RemoteDir/
scp -P $SSHPort db.py $SSHHost`:$RemoteDir/
scp -P $SSHPort schemas.py $SSHHost`:$RemoteDir/
scp -P $SSHPort queries.py $SSHHost`:$RemoteDir/
scp -P $SSHPort user_mgmt.py $SSHHost`:$RemoteDir/
scp -P $SSHPort logging_utils.py $SSHHost`:$RemoteDir/
scp -P $SSHPort -r alembic $SSHHost`:$RemoteDir/
scp -P $SSHPort -r scripts $SSHHost`:$RemoteDir/

Write-Host ""
Write-Host "[OK] All files uploaded" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps on server:" -ForegroundColor Cyan
Write-Host "  cd ~/arkuszownia" -ForegroundColor Gray
Write-Host "  mkdir -p logs/{nginx,cloudflared}" -ForegroundColor Gray
Write-Host "  docker-compose up -d" -ForegroundColor Gray
Write-Host "  docker-compose ps" -ForegroundColor Gray
