# Generate a secure JWT secret
$bytes = New-Object byte[] 64
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$hex = -join ($bytes | ForEach-Object { $_.ToString('x2') })
Write-Host "JWT_SECRET=$hex"
Write-Host ""
Write-Host "Copy this value and set it on Railway dashboard:"
Write-Host "1. Go to https://railway.app"
Write-Host "2. Select your PyCharmMiscProject"
Write-Host "3. Go to Variables tab"
Write-Host "4. Add new variable: JWT_SECRET with the value above"

