Write-Host "Comprehensive Health Check" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

$allGood = $true

# 1. Check Docker containers
Write-Host "[1/8] Docker Containers..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}}" | Where-Object { $_ -match "smb_" }
if ($containers.Count -ge 3) {
    Write-Host "   [OK] All containers running ($($containers.Count))" -ForegroundColor Green
    $containers | ForEach-Object { Write-Host "      - $_" -ForegroundColor Gray }
} else {
    Write-Host "   [FAIL] Missing containers!" -ForegroundColor Red
    $allGood = $false
}

# 2. Check database connection (FIXED: using smb_user instead of smbuser)
Write-Host "`n[2/8] Database Connection..." -ForegroundColor Yellow
try {
    $dbCheck = docker exec smb_db psql -U smb_user -d smbtool -c "SELECT 1;" 2>&1
    if ($dbCheck -match "1 row") {
        Write-Host "   [OK] Database accessible" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Database connection failed" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] Cannot connect to database" -ForegroundColor Red
    $allGood = $false
}

# 3. Check table counts (FIXED: using smb_user and smbtool)
Write-Host "`n[3/8] Database Tables..." -ForegroundColor Yellow
$tables = @('customers', 'products', 'orders', 'order_lines', 'inventory')
foreach ($table in $tables) {
    try {
        $count = docker exec smb_db psql -U smb_user -d smbtool -t -c "SELECT COUNT(*) FROM $table;" 2>&1
        $count = $count.Trim()
        if ($count -match '^\d+$') {
            Write-Host "   [OK] $table : $count rows" -ForegroundColor Green
        } else {
            Write-Host "   [FAIL] $table : Error" -ForegroundColor Red
            $allGood = $false
        }
    } catch {
        Write-Host "   [FAIL] $table : Cannot query" -ForegroundColor Red
        $allGood = $false
    }
}

# 4. Check frontend
Write-Host "`n[4/8] Frontend (Nginx)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -and $response.Content -match "Arkuszownia") {
        Write-Host "   [OK] Frontend accessible" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Frontend responds but content unexpected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [FAIL] Frontend unreachable" -ForegroundColor Red
    $allGood = $false
}

# 5. Check backend health
Write-Host "`n[5/8] Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/healthz" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Backend healthy" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Backend unhealthy (HTTP $($response.StatusCode))" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] Backend unreachable" -ForegroundColor Red
    $allGood = $false
}

# 6. Check API endpoint with key
Write-Host "`n[6/8] API Endpoint Test..." -ForegroundColor Yellow
try {
    $headers = @{'X-API-Key' = 'changeme123'}
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/products" -Headers $headers -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $products = ($response.Content | ConvertFrom-Json)
        Write-Host "   [OK] API working ($($products.Count) products)" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] API error (HTTP $($response.StatusCode))" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] API call failed: $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

# 7. Check API docs
Write-Host "`n[7/8] API Documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/docs" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200 -and $response.Content -match "FastAPI") {
        Write-Host "   [OK] API docs accessible" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] API docs respond but content unexpected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [FAIL] API docs unreachable" -ForegroundColor Red
    $allGood = $false
}

# 8. Check logs for errors
Write-Host "`n[8/8] Recent Logs..." -ForegroundColor Yellow
$backendLogs = docker logs smb_backend --tail 20 2>&1
$errorCount = ($backendLogs | Select-String -Pattern "ERROR|CRITICAL|Exception" | Measure-Object).Count
if ($errorCount -eq 0) {
    Write-Host "   [OK] No recent errors in backend logs" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Found $errorCount error(s) in recent logs" -ForegroundColor Yellow
    Write-Host "      Run: docker logs smb_backend" -ForegroundColor Gray
}

# Final verdict
Write-Host "`n================================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "[SUCCESS] ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
    Write-Host "`nYour app is ready to use!" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:8080/docs" -ForegroundColor White
    Write-Host "   API Key:  changeme123" -ForegroundColor Yellow
} else {
    Write-Host "[ISSUES] SOME PROBLEMS DETECTED" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check logs: docker-compose logs" -ForegroundColor Gray
    Write-Host "   2. Restart: docker-compose restart" -ForegroundColor Gray
    Write-Host "   3. Fresh start: .\fresh-start-simple.ps1" -ForegroundColor Gray
}
Write-Host "================================================" -ForegroundColor Cyan