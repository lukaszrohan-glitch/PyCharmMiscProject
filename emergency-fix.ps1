
Write-Host ""
Write-Host "================================================================" -ForegroundColor Red
Write-Host "          EMERGENCY RECOVERY MODE                              " -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host ""

# Step 1: Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $null = docker version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "   OK Docker is running" -ForegroundColor Green
    }
}
catch {
    Write-Host "   Docker check failed" -ForegroundColor Red
}

if (-not $dockerRunning) {
    Write-Host "   ERROR Docker is not running!" -ForegroundColor Red
    Write-Host "   Start Docker Desktop and run this script again" -ForegroundColor Yellow
    pause
    exit 1
}

# Step 2: Stop everything
Write-Host ""
Write-Host "[2/6] Stopping all containers..." -ForegroundColor Yellow
$null = docker-compose down -v 2>&1
Write-Host "   OK Containers stopped" -ForegroundColor Green

# Step 3: Check for port conflicts
Write-Host ""
Write-Host "[3/6] Checking for port conflicts..." -ForegroundColor Yellow
$ports = @(8080, 8000, 5432)
$conflicts = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $conflicts += $port
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "   WARNING Port $port is in use by: $($process.ProcessName)" -ForegroundColor Yellow
    }
}

if ($conflicts.Count -gt 0) {
    Write-Host ""
    Write-Host "   Ports in use: $($conflicts -join ', ')" -ForegroundColor Red
    $kill = Read-Host "   Kill these processes? (yes/no)"
    if ($kill -eq "yes") {
        foreach ($port in $conflicts) {
            $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connection) {
                $null = Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "   OK Killed process on port $port" -ForegroundColor Green
            }
        }
    }
}

# Step 4: Check Dockerfile
Write-Host ""
Write-Host "[4/6] Checking Dockerfile..." -ForegroundColor Yellow
if (Test-Path "Dockerfile") {
    $dockerfile = Get-Content "Dockerfile" -Raw
    if ($dockerfile -match 'templates\*.*2>/dev/null') {
        Write-Host "   WARNING Found problematic templates line" -ForegroundColor Yellow
        Write-Host "   Fixing Dockerfile..." -ForegroundColor Yellow

        $fixed = $dockerfile -replace 'COPY --chown=app:app templates\* /app/templates/ 2>/dev/null \|\| true', 'RUN mkdir -p /app/templates && chown app:app /app/templates'
        Set-Content "Dockerfile" -Value $fixed -NoNewline

        Write-Host "   OK Dockerfile fixed" -ForegroundColor Green
    }
    else {
        Write-Host "   OK Dockerfile looks good" -ForegroundColor Green
    }
}
else {
    Write-Host "   ERROR Dockerfile not found!" -ForegroundColor Red
    exit 1
}

# Step 5: Rebuild and start
Write-Host ""
Write-Host "[5/6] Rebuilding containers..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$null = docker-compose build --no-cache 2>&1
$buildSuccess = ($LASTEXITCODE -eq 0)

if ($buildSuccess) {
    Write-Host "   OK Build successful" -ForegroundColor Green
}
else {
    Write-Host "   ERROR Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Showing build errors:" -ForegroundColor Yellow
    docker-compose build --no-cache
    pause
    exit 1
}

Write-Host ""
Write-Host "   Starting containers..." -ForegroundColor Yellow
$null = docker-compose up -d 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Containers started" -ForegroundColor Green
}
else {
    Write-Host "   ERROR Failed to start containers!" -ForegroundColor Red
    docker-compose logs
    pause
    exit 1
}

# Step 6: Wait and verify
Write-Host ""
Write-Host "[6/6] Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "   Checking container status..." -ForegroundColor Gray
$containerList = docker ps --format "{{.Names}}" 2>&1 | Out-String
$containers = $containerList -split "`r`n|`n" | Where-Object { $_.Trim() -ne "" }

$expected = @("smb_db", "smb_backend", "smb_nginx")
$running = @()
$missing = @()

foreach ($name in $expected) {
    $found = $false
    foreach ($container in $containers) {
        if ($container.Trim() -eq $name) {
            $found = $true
            break
        }
    }

    if ($found) {
        $running += $name
        Write-Host "   OK $name is running" -ForegroundColor Green
    }
    else {
        $missing += $name
        Write-Host "   ERROR $name is NOT running" -ForegroundColor Red
    }
}

# Final status
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    RECOVERY COMPLETE                          " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($missing.Count -eq 0) {
    Write-Host "SUCCESS ALL SERVICES RUNNING!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application at:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:8080" -ForegroundColor White
    Write-Host "   API Docs:  http://localhost:8080/docs" -ForegroundColor White
    Write-Host "   Health:    http://localhost:8080/api/healthz" -ForegroundColor White
}
else {
    Write-Host "WARNING SOME SERVICES FAILED TO START" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Missing containers: $($missing -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs with:" -ForegroundColor Yellow
    foreach ($name in $missing) {
        Write-Host "   docker logs $name" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the application: http://localhost:8080" -ForegroundColor White
Write-Host "   2. Check health: .\health-check-full.ps1" -ForegroundColor White
Write-Host "   3. View logs: docker-compose logs -f" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
