
$keys = @('test-admin-key', 'dev-key-change-in-production', 'admin-key')

Write-Host "`n🔍 Testing admin keys...`n" -ForegroundColor Yellow

foreach ($key in $keys) {
    Write-Host "Testing: $key ... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/admin/api-keys" `
            -Headers @{'X-Admin-Key'=$key} `
            -Method GET `
            -UseBasicParsing `
            -TimeoutSec 5 `
            -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Host "✅ WORKS!" -ForegroundColor Green
            Write-Host "`n🎉 Your admin key is: $key`n" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "❌ Failed" -ForegroundColor Red
    }
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
