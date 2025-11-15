
Write-Host "🚀 Fresh System Start" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Stop everything
Write-Host "[1/6] Stopping containers..." -ForegroundColor Yellow
docker-compose down -v 2>$null

# Clean Docker cache
Write-Host "[2/6] Cleaning Docker cache..." -ForegroundColor Yellow
docker system prune -f

# Rebuild images
Write-Host "[3/6] Building fresh images..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start services
Write-Host "[4/6] Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database
Write-Host "[5/6] Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker exec smb_db pg_isready -U smbuser 2>$null
        if ($result -match "accepting connections") {
            Write-Host "✅ Database ready!" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "   Attempt $i/30..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

# Populate test data
Write-Host "[6/6] Populating test data..." -ForegroundColor Yellow
.\populate-db.ps1 -Full

Write-Host "`n✅ System ready!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8080/docs" -ForegroundColor Cyan
Write-Host "🔑 Default API Key: changeme123" -ForegroundColor Yellow
