# Production Deployment Script
# Run this to deploy all improvements to production
# Usage: .\deploy-improvements.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Production Deployment - Arkuszownia SMB" -ForegroundColor Cyan
Write-Host "Version 1.1.0 - 2025-11-20" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (!$?) {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green

# Pull latest changes
Write-Host "`nPulling latest changes..." -ForegroundColor Yellow
git pull origin main
if (!$?) {
    Write-Host "✗ Git pull failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Latest code pulled" -ForegroundColor Green

# Stop existing containers
Write-Host "`nStopping existing containers..." -ForegroundColor Yellow
docker-compose down
Write-Host "✓ Containers stopped" -ForegroundColor Green

# Rebuild images
Write-Host "`nRebuilding Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache
if (!$?) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Images built successfully" -ForegroundColor Green

# Start services
Write-Host "`nStarting services..." -ForegroundColor Yellow
docker-compose up -d
if (!$?) {
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Services started" -ForegroundColor Green

# Wait for services to be ready
Write-Host "`nWaiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Health checks
Write-Host "`nRunning health checks..." -ForegroundColor Yellow

$healthzUrl = "http://localhost:8080/healthz"
$readyzUrl = "http://localhost:8080/readyz"
$metricsUrl = "http://localhost:8080/metrics"

try {
    $health = Invoke-RestMethod -Uri $healthzUrl -TimeoutSec 5 -ErrorAction Stop
    if ($health.ok -eq $true) {
        Write-Host "  ✓ /healthz OK" -ForegroundColor Green
    }
}
catch {
    Write-Host "  ✗ /healthz FAILED" -ForegroundColor Red
}

try {
    $ready = Invoke-RestMethod -Uri $readyzUrl -TimeoutSec 5 -ErrorAction Stop
    if ($ready.ready -eq $true) {
        Write-Host "  ✓ /readyz OK (DB: $($ready.db))" -ForegroundColor Green
    }
}
catch {
    Write-Host "  ✗ /readyz FAILED" -ForegroundColor Red
}

try {
    $metrics = Invoke-WebRequest -Uri $metricsUrl -TimeoutSec 5 -ErrorAction Stop
    if ($metrics.StatusCode -eq 200) {
        Write-Host "  ✓ /metrics OK (Prometheus endpoint active)" -ForegroundColor Green
    }
}
catch {
    Write-Host "  ✗ /metrics FAILED" -ForegroundColor Red
}

# Test security headers
Write-Host "`nVerifying security headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $healthzUrl -Method Head -ErrorAction Stop
    $headers = $response.Headers

    $securityHeaders = @(
        "X-Request-ID",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection"
    )

    foreach ($header in $securityHeaders) {
        if ($headers.ContainsKey($header)) {
            Write-Host "  ✓ $header present" -ForegroundColor Green
        }
        else {
            Write-Host "  ✗ $header missing" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "  ✗ Could not verify headers" -ForegroundColor Red
}

# Display service URLs
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nService URLs:" -ForegroundColor Yellow
Write-Host "  Backend API:      http://localhost:8080" -ForegroundColor White
Write-Host "  Frontend:         http://localhost:5173" -ForegroundColor White
Write-Host "  API Docs:         http://localhost:8080/api/docs" -ForegroundColor White
Write-Host "  Metrics:          http://localhost:8080/metrics" -ForegroundColor White
Write-Host "  Health Check:     http://localhost:8080/healthz" -ForegroundColor White
Write-Host "  Readiness:        http://localhost:8080/readyz" -ForegroundColor White

Write-Host "`nProduction URL:" -ForegroundColor Yellow
Write-Host "  https://arkuszowniasmb.pl" -ForegroundColor Cyan

Write-Host "`nView logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor Gray

Write-Host "`nMonitoring:" -ForegroundColor Yellow
Write-Host "  curl http://localhost:8080/metrics" -ForegroundColor Gray

Write-Host "`n✓ Deployment successful!`n" -ForegroundColor Green

