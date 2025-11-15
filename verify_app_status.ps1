Write-Host "`n" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "        ARKUSZOWNIA SMB - APPLICATION STATUS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Check containers
Write-Host "[1/5] Container Status" -ForegroundColor Yellow
$requiredContainers = @("smb_db", "smb_backend", "smb_nginx")
$buildContainer = "smb_frontend_build"

foreach ($container in $requiredContainers) {
    $status = docker ps --filter "name=$container" --format "{{.Status}}"
    if ($status -match "Up") {
        Write-Host "   [OK] $container : $status" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $container : NOT RUNNING" -ForegroundColor Red
        $allGood = $false
    }
}

# Frontend build container (one-time build, no need to run continuously)
$buildStatus = docker ps -a --filter "name=$buildContainer" --format "{{.Status}}"
if ($buildStatus -match "Exited" -or $buildStatus -match "Up") {
    Write-Host "   [OK] $buildContainer : Build completed" -ForegroundColor Green
} else {
    Write-Host "   [FAIL] $buildContainer : Build failed" -ForegroundColor Red
    $allGood = $false
}

# 2. Check database
Write-Host "`n[2/5] Database Connection" -ForegroundColor Yellow
try {
    $dbCheck = docker exec smb_db psql -U smb_user -d smbtool -c "SELECT 1;" 2>&1
    if ($dbCheck -match "1 row") {
        Write-Host "   [OK] PostgreSQL is responding" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Database not responding" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] Database error: $_" -ForegroundColor Red
    $allGood = $false
}

# 3. Check backend health
Write-Host "`n[3/5] Backend API Health" -ForegroundColor Yellow
try {
    $apiHealth = docker exec smb_backend curl -s http://localhost:8000/healthz 2>&1
    if ($apiHealth -match '"ok":true') {
        Write-Host "   [OK] Backend API is healthy" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Backend not responding correctly" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] Backend error: $_" -ForegroundColor Red
    $allGood = $false
}

# 4. Check frontend files
Write-Host "`n[4/5] Frontend Static Files" -ForegroundColor Yellow
try {
    $frontendFiles = docker exec smb_nginx ls -la /usr/share/nginx/html 2>&1
    if ($frontendFiles -match "index.html" -and $frontendFiles -match "assets") {
        Write-Host "   [OK] Frontend files are mounted" -ForegroundColor Green
        Write-Host "      - index.html present" -ForegroundColor Gray
        Write-Host "      - assets directory present" -ForegroundColor Gray
    } else {
        Write-Host "   [FAIL] Frontend files not found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] Frontend check error: $_" -ForegroundColor Red
    $allGood = $false
}

# 5. Check network routing
Write-Host "`n[5/5] Network Connectivity" -ForegroundColor Yellow
try {
    $routeCheck = docker exec smb_nginx curl -s http://backend:8000/healthz 2>&1
    if ($routeCheck -match '"ok":true') {
        Write-Host "   [OK] Nginx can reach backend" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Nginx cannot reach backend" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   [FAIL] Routing check error: $_" -ForegroundColor Red
    $allGood = $false
}

# Final summary
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "   [SUCCESS] APPLICATION IS FULLY OPERATIONAL" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Access your application:" -ForegroundColor Cyan
    Write-Host "      Frontend: http://localhost:8088" -ForegroundColor White
    Write-Host "      API Docs: http://localhost:8088/docs" -ForegroundColor White
    Write-Host "      API Base: http://localhost:8000" -ForegroundColor White
    Write-Host ""
    Write-Host "   Admin Credentials:" -ForegroundColor Cyan
    Write-Host "      Email: admin@arkuszowniasmb.pl" -ForegroundColor White
    Write-Host "      Password: (check .env file)" -ForegroundColor White
} else {
    Write-Host "   [WARNING] SOME ISSUES DETECTED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Troubleshooting:" -ForegroundColor Yellow
    Write-Host "      1. View logs: docker-compose logs -f [service-name]" -ForegroundColor Gray
    Write-Host "      2. Restart: docker-compose restart" -ForegroundColor Gray
    Write-Host "      3. Full reset: docker-compose down -v && docker-compose up -d" -ForegroundColor Gray
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
