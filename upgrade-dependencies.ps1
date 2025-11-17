
Write-Host "Dependency Upgrade Script" -ForegroundColor Cyan
Write-Host "=========================`n" -ForegroundColor Cyan

# Python dependencies
Write-Host "[1/2] Upgrading Python Dependencies..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    Write-Host "   Checking for updates..." -ForegroundColor Gray
    pip list --outdated --format=columns

    Write-Host "`n   Safe upgrades (patch versions):" -ForegroundColor Yellow
    $confirm = Read-Host "   Upgrade? (y/n)"
    if ($confirm -eq 'y') {
        pip install --upgrade pip
        pip install -r requirements.txt --upgrade
        pip freeze > requirements.txt
        Write-Host "   [OK] Python dependencies upgraded" -ForegroundColor Green
    }
}

# Node.js dependencies
Write-Host "`n[2/2] Upgrading Node.js Dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend/package.json") {
    Push-Location frontend

    Write-Host "   Checking for updates..." -ForegroundColor Gray
    npm outdated

    Write-Host "`n   Safe upgrades (minor/patch):" -ForegroundColor Yellow
    $confirm = Read-Host "   Upgrade? (y/n)"
    if ($confirm -eq 'y') {
        npm update
        Write-Host "   [OK] npm dependencies upgraded" -ForegroundColor Green
    }

    Pop-Location
}

Write-Host "`nUpgrade complete!" -ForegroundColor Green
Write-Host "Run tests: .\run-tests.ps1" -ForegroundColor Yellow
