cd 'C:\Users\lukas\PyCharmMiscProject'

Write-Host "Creating archive..." -ForegroundColor Yellow
$files = @(
    'docker-compose.yml',
    'Dockerfile', 
    'nginx.conf',
    '.env',
    'entrypoint.sh',
    'alembic.ini',
    'requirements.txt',
    'main.py',
    'auth.py',
    'db.py',
    'schemas.py',
    'queries.py',
    'user_mgmt.py',
    'logging_utils.py',
    'frontend/dist',
    'alembic',
    'scripts'
)

if (Test-Path deploy-app.zip) { Remove-Item deploy-app.zip }
Compress-Archive -Path $files -DestinationPath deploy-app.zip -Force | Out-Null
$size = (Get-Item deploy-app.zip).Length / 1MB
Write-Host "[OK] Archive created ($([math]::Round($size, 2)) MB)" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Manual Upload Instructions" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands in PowerShell:" -ForegroundColor White
Write-Host ""
Write-Host "1. Upload file:" -ForegroundColor Yellow
Write-Host "   scp -P 22222 deploy-app.zip serwer2581752@serwer2581752.home.pl:~/arkuszownia/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. SSH to server:" -ForegroundColor Yellow
Write-Host "   ssh -p 22222 serwer2581752@serwer2581752.home.pl" -ForegroundColor Gray
Write-Host ""
Write-Host "3. On server run:" -ForegroundColor Yellow
Write-Host "   cd ~/arkuszownia" -ForegroundColor Gray
Write-Host "   unzip -o deploy-app.zip" -ForegroundColor Gray
Write-Host "   mkdir -p logs/{nginx,cloudflared}" -ForegroundColor Gray
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host "   sleep 15" -ForegroundColor Gray
Write-Host "   docker-compose ps" -ForegroundColor Gray
Write-Host ""
