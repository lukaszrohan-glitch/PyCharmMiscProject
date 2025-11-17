Set-Location C:\Users\lukas\PyCharmMiscProject
Write-Host "Starting Cloudflare quick tunnel..." -ForegroundColor Green
Write-Host "This will create a temporary public URL" -ForegroundColor Yellow
Write-Host ""

& ".\cloudflared.exe" tunnel --url http://localhost:8088
