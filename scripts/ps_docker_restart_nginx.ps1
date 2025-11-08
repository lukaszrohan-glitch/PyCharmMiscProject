# PowerShell helper to restart nginx service via docker-compose (PowerShell friendly)
param()

Write-Host "Restarting nginx via docker-compose..." -ForegroundColor Cyan
$proc = Start-Process -FilePath docker-compose -ArgumentList @('restart','nginx') -NoNewWindow -Wait -PassThru
if ($proc.ExitCode -ne 0) { Write-Error "docker-compose restart nginx failed with exit code $($proc.ExitCode)"; exit $proc.ExitCode }
Write-Host "nginx restarted." -ForegroundColor Green

