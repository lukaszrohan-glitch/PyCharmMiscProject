
Write-Host "Database Diagnostics" -ForegroundColor Cyan
Write-Host "===================`n" -ForegroundColor Cyan

# Check if container is running
Write-Host "[1/6] Container Status..." -ForegroundColor Yellow
$dbContainer = docker ps --filter "name=smb_db" --format "{{.Names}}"
if ($dbContainer) {
    Write-Host "   [OK] Container running: $dbContainer" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] Container not running!" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d smb_db" -ForegroundColor Yellow
    exit 1
}

# Check container logs
Write-Host "`n[2/6] Recent Logs..." -ForegroundColor Yellow
$logs = docker logs smb_db --tail 30 2>&1
Write-Host $logs -ForegroundColor Gray

# Check if PostgreSQL is ready
Write-Host "`n[3/6] PostgreSQL Ready Check..." -ForegroundColor Yellow
$ready = docker exec smb_db pg_isready -U smbuser 2>&1
Write-Host "   $ready" -ForegroundColor Gray

# Check database exists
Write-Host "`n[4/6] Database Existence..." -ForegroundColor Yellow
$dbList = docker exec smb_db psql -U smbuser -lqt 2>&1
Write-Host $dbList -ForegroundColor Gray

# Try simple connection
Write-Host "`n[5/6] Connection Test..." -ForegroundColor Yellow
$connTest = docker exec smb_db psql -U smbuser -d smbdb -c "\dt" 2>&1
Write-Host $connTest -ForegroundColor Gray

# Check environment variables
Write-Host "`n[6/6] Environment Check..." -ForegroundColor Yellow
$env = docker exec smb_db env | Select-String "POSTGRES"
Write-Host $env -ForegroundColor Gray

Write-Host "`n===================`n" -ForegroundColor Cyan
