# Railway Variables Setup Helper
# Run this script to set all required environment variables on Railway

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Railway Variables Setup Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if railway CLI is available
try {
    $railwayVersion = railway --version 2>$null
    Write-Host "✓ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Setting environment variables on Railway..." -ForegroundColor Yellow
Write-Host ""

# Set JWT_SECRET
$jwtSecret = "c6bcd7456a5d3bbc704aefe37e4b2af431f0e8226cbbe456c6cc73bb384ba1bb0d81cb2bf5fee214161e17153a37da030737fdc18520217faa969cd5befcb48d"
Write-Host "Setting JWT_SECRET..." -ForegroundColor Cyan
railway variables --set "JWT_SECRET=$jwtSecret"

# Set ADMIN_EMAIL
Write-Host "Setting ADMIN_EMAIL..." -ForegroundColor Cyan
railway variables --set "ADMIN_EMAIL=admin@arkuszowniasmb.pl"

# Set ADMIN_PASSWORD
Write-Host "Setting ADMIN_PASSWORD..." -ForegroundColor Cyan
railway variables --set "ADMIN_PASSWORD=Admin123!@#Secure"

# Set CORS_ORIGINS
Write-Host "Setting CORS_ORIGINS..." -ForegroundColor Cyan
railway variables --set "CORS_ORIGINS=https://synterra.up.railway.app"

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Variables set successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying variables..." -ForegroundColor Yellow
railway variables --kv

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Railway will automatically redeploy your service" -ForegroundColor White
Write-Host "2. Wait for deployment to complete (~2-3 minutes)" -ForegroundColor White
Write-Host "3. Test login at https://synterra.up.railway.app" -ForegroundColor White
Write-Host "4. Monitor logs with: railway logs --tail" -ForegroundColor White
Write-Host ""

