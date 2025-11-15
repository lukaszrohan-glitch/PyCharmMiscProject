$ErrorActionPreference = "Stop"

$accountId = "1d3ab6d58f6df4551019d96a1472bd4b"
$tunnelId = "6fa527c4-4351-49f9-9339-6f1b9140239e"
$apiToken = "KLg_KyNRxf8u42hwDO9VvFttq5DfnGSAzReUCwIo"

$uri = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/token"

try {
    Write-Host "Fetching fresh tunnel token from Cloudflare API..." -ForegroundColor Cyan
    
    $response = Invoke-WebRequest -Uri $uri `
        -Headers @{"Authorization" = "Bearer $apiToken"; "Content-Type" = "application/json"} `
        -Method Get `
        -TimeoutSec 10
    
    $json = $response.Content | ConvertFrom-Json
    
    if ($json.success) {
        $newToken = $json.result
        Write-Host "SUCCESS: Got new token" -ForegroundColor Green
        Write-Host "Token: $newToken" -ForegroundColor Yellow
        
        # Update .env file
        Write-Host "`nUpdating .env file..." -ForegroundColor Cyan
        $envPath = ".\.env"
        $envContent = Get-Content $envPath
        $envContent = $envContent -replace 'TUNNEL_TOKEN=.*', "TUNNEL_TOKEN=$newToken"
        Set-Content $envPath $envContent
        Write-Host "Updated .env" -ForegroundColor Green
        
        # Update config.yml file  
        Write-Host "Updating config.yml file..." -ForegroundColor Cyan
        $configPath = ".\config.yml"
        $configContent = Get-Content $configPath
        $configContent = $configContent -replace 'tunnel-token: .*', "tunnel-token: $newToken"
        Set-Content $configPath $configContent
        Write-Host "Updated config.yml" -ForegroundColor Green
        
        Write-Host "`nNow restarting Docker containers..." -ForegroundColor Cyan
        docker-compose restart cloudflared
        
        Start-Sleep -Seconds 5
        
        $logs = docker logs smb_cloudflared --tail 5 2>&1
        Write-Host "Recent cloudflared logs:" -ForegroundColor Cyan
        Write-Host $logs -ForegroundColor Gray
        
    } else {
        Write-Host "ERROR: API returned error" -ForegroundColor Red
        Write-Host $json.errors -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
