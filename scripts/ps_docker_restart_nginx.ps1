# PowerShell helper to restart nginx service via docker-compose (PowerShell friendly)
param(
    [string]$Service = 'nginx'
)

Write-Host "Restarting service '$Service' via docker-compose..." -ForegroundColor Cyan

# Use the call operator (&) so PowerShell passes arguments correctly to docker-compose
& docker-compose restart $Service
$rc = $LASTEXITCODE
if ($rc -ne 0) {
    Write-Error "docker-compose restart $Service failed with exit code $rc"
    exit $rc
}

Write-Host "$Service restarted." -ForegroundColor Green
