
Write-Host "Security Upgrade Wizard" -ForegroundColor Cyan
Write-Host "======================`n" -ForegroundColor Cyan

# Generate secure passwords
function New-SecurePassword {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
    -join ((1..32) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

Write-Host "Generating secure credentials..." -ForegroundColor Yellow

$newApiKey = New-SecurePassword
$newDbPassword = New-SecurePassword
$newJwtSecret = New-SecurePassword

# Backup current .env
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "[OK] Backed up current .env" -ForegroundColor Green
}

# Create new .env with secure values
$envContent = @"
# Database Configuration
POSTGRES_USER=smb_user
POSTGRES_PASSWORD=$newDbPassword
POSTGRES_DB=smbtool
DATABASE_URL=postgresql://smb_user:$newDbPassword@smb_db:5432/smbtool

# API Configuration
API_KEY=$newApiKey
JWT_SECRET_KEY=$newJwtSecret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
DEBUG=false
ENVIRONMENT=production
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "[OK] Generated new .env with secure credentials" -ForegroundColor Green

Write-Host "`n[IMPORTANT] Save these credentials securely:" -ForegroundColor Red
Write-Host "API Key: $newApiKey" -ForegroundColor Yellow
Write-Host "DB Password: $newDbPassword" -ForegroundColor Yellow
Write-Host "JWT Secret: $newJwtSecret" -ForegroundColor Yellow

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run: docker-compose down" -ForegroundColor Gray
Write-Host "2. Run: docker-compose up -d" -ForegroundColor Gray
Write-Host "3. Update your API clients with new API key" -ForegroundColor Gray
