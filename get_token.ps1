$accountId = "1d3ab6d58f6df4551019d96a1472bd4b"
$tunnelId = "6fa527c4-4351-49f9-9339-6f1b9140239e"
$apiToken = "KLg_KyNRxf8u42hwDO9VvFttq5DfnGSAzReUCwIo"

$uri = "https://api.cloudflare.com/client/v4/accounts/$accountId/cfd_tunnel/$tunnelId/token"
$headers = @{
    "Authorization" = "Bearer $apiToken"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri $uri -Headers $headers -Method Get
    $json = $response.Content | ConvertFrom-Json
    Write-Output $json.result
} catch {
    Write-Error "Failed to get token: $($_.Exception.Message)"
}
