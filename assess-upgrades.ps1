
Write-Host "System Assessment & Upgrade Recommendations" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$recommendations = @()

# Check Python dependencies
Write-Host "[1/6] Checking Python Dependencies..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    $outdated = pip list --outdated 2>$null
    if ($outdated) {
        Write-Host "   [INFO] Some Python packages can be updated" -ForegroundColor Yellow
        $recommendations += @{
            Priority = "Medium"
            Category = "Dependencies"
            Item = "Python packages"
            Action = "Run: pip list --outdated"
        }
    } else {
        Write-Host "   [OK] Python packages up to date" -ForegroundColor Green
    }
}

# Check Node.js dependencies
Write-Host "`n[2/6] Checking Node.js Dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend/package.json") {
    Push-Location frontend
    $npmOutdated = npm outdated 2>$null
    Pop-Location
    if ($npmOutdated) {
        Write-Host "   [INFO] Some npm packages can be updated" -ForegroundColor Yellow
        $recommendations += @{
            Priority = "Medium"
            Category = "Dependencies"
            Item = "npm packages"
            Action = "cd frontend && npm outdated"
        }
    } else {
        Write-Host "   [OK] npm packages up to date" -ForegroundColor Green
    }
}

# Check Docker images
Write-Host "`n[3/6] Checking Docker Images..." -ForegroundColor Yellow
$images = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "postgres|nginx|python"
Write-Host "   Current images:" -ForegroundColor Gray
$images | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
$recommendations += @{
    Priority = "Low"
    Category = "Infrastructure"
    Item = "Docker images"
    Action = "Consider updating base images in docker-compose.yml"
}

# Check security
Write-Host "`n[4/6] Security Check..." -ForegroundColor Yellow
$securityIssues = @()

# Check for default passwords
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "changeme|password123|admin") {
        $securityIssues += "Default passwords detected in .env"
    }
}

# Check API key
$apiKey = docker exec smb_backend printenv API_KEY 2>$null
if ($apiKey -eq "changeme123") {
    $securityIssues += "Default API key in use"
}

if ($securityIssues.Count -gt 0) {
    Write-Host "   [WARN] Security issues found:" -ForegroundColor Red
    $securityIssues | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
    $recommendations += @{
        Priority = "HIGH"
        Category = "Security"
        Item = "Credentials"
        Action = "Update default passwords and API keys"
    }
} else {
    Write-Host "   [OK] No obvious security issues" -ForegroundColor Green
}

# Check performance
Write-Host "`n[5/6] Performance Check..." -ForegroundColor Yellow
$backendStats = docker stats smb_backend --no-stream --format "{{.CPUPerc}},{{.MemUsage}}" 2>$null
if ($backendStats) {
    Write-Host "   Backend: $backendStats" -ForegroundColor Gray
    $recommendations += @{
        Priority = "Low"
        Category = "Performance"
        Item = "Resource monitoring"
        Action = "Consider adding monitoring tools (Prometheus/Grafana)"
    }
}

# Check missing features
Write-Host "`n[6/6] Feature Gaps..." -ForegroundColor Yellow
$missingFeatures = @()

if (-not (Test-Path "tests/e2e")) {
    $missingFeatures += "E2E tests"
}
if (-not (Test-Path ".github/workflows")) {
    $missingFeatures += "CI/CD pipeline"
}
if (-not (Test-Path "docker-compose.prod.yml")) {
    $missingFeatures += "Production configuration"
}

if ($missingFeatures.Count -gt 0) {
    Write-Host "   [INFO] Missing features:" -ForegroundColor Yellow
    $missingFeatures | ForEach-Object { Write-Host "      - $_" -ForegroundColor Gray }
}

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "RECOMMENDATIONS SUMMARY" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$recommendations | Sort-Object Priority | ForEach-Object {
    $color = switch ($_.Priority) {
        "HIGH" { "Red" }
        "Medium" { "Yellow" }
        "Low" { "Gray" }
    }
    Write-Host "[$($_.Priority)] $($_.Category): $($_.Item)" -ForegroundColor $color
    Write-Host "   Action: $($_.Action)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "============================================`n" -ForegroundColor Cyan
