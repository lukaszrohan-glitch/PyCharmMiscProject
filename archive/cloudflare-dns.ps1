# Cloudflare DNS Updater
# Updates DNS records using Cloudflare API with token authentication

param(
    [switch]$UpdateDNS,
    [switch]$CheckStatus
)

$ErrorActionPreference = 'Stop'

# Load configuration from .env
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile
$config = @{}
foreach ($line in $envContent) {
    if ($line -match '^([^=]+)=(.*)$') {
        $config[$matches[1]] = $matches[2]
    }
}

$API_TOKEN = $config['CLOUDFLARE_API_TOKEN']
$DOMAIN = $config['CLOUDFLARE_DOMAIN']

if (-not $API_TOKEN) {
    Write-Host "[ERROR] CLOUDFLARE_API_TOKEN not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE DNS MANAGER" -ForegroundColor Cyan
Write-Host "  Domain: $DOMAIN" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Cloudflare API base URL
$API_BASE = "https://api.cloudflare.com/client/v4"
$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

function Get-ZoneID {
    Write-Host "[1/4] Getting Zone ID for $DOMAIN..." -ForegroundColor Yellow

    $response = Invoke-RestMethod -Uri "$API_BASE/zones?name=$DOMAIN" -Headers $headers -Method Get

    if ($response.success -and $response.result.Count -gt 0) {
        $zoneId = $response.result[0].id
        Write-Host "[OK] Zone ID: $zoneId" -ForegroundColor Green
        return $zoneId
    } else {
        Write-Host "[ERROR] Could not find zone for $DOMAIN" -ForegroundColor Red
        exit 1
    }
}

function Get-PublicIP {
    Write-Host "`n[2/4] Getting your public IP address..." -ForegroundColor Yellow

    try {
        $ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
        Write-Host "[OK] Your public IP: $ip" -ForegroundColor Green
        return $ip
    } catch {
        Write-Host "[ERROR] Could not get public IP" -ForegroundColor Red
        exit 1
    }
}

function Get-DNSRecords {
    param($zoneId)

    Write-Host "`n[3/4] Getting current DNS records..." -ForegroundColor Yellow

    $response = Invoke-RestMethod -Uri "$API_BASE/zones/$zoneId/dns_records?type=A" -Headers $headers -Method Get

    if ($response.success) {
        Write-Host "[OK] Found $($response.result.Count) A records" -ForegroundColor Green
        return $response.result
    }
    return @()
}

function Update-DNSRecord {
    param($zoneId, $recordId, $name, $ip)

    $body = @{
        type = "A"
        name = $name
        content = $ip
        ttl = 1
        proxied = $true
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_BASE/zones/$zoneId/dns_records/$recordId" -Headers $headers -Method Put -Body $body

    return $response.success
}

function Create-DNSRecord {
    param($zoneId, $name, $ip)

    $body = @{
        type = "A"
        name = $name
        content = $ip
        ttl = 1
        proxied = $true
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$API_BASE/zones/$zoneId/dns_records" -Headers $headers -Method Post -Body $body
        return $response.success
    } catch {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($errorDetails.errors[0].message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
if ($CheckStatus) {
    $zoneId = Get-ZoneID
    $publicIP = Get-PublicIP
    $records = Get-DNSRecords -zoneId $zoneId

    Write-Host "`n================================================================" -ForegroundColor Gray
    Write-Host "CURRENT DNS RECORDS:" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Gray

    foreach ($record in $records) {
        $status = if ($record.content -eq $publicIP) { "OK" } else { "NEEDS UPDATE" }
        $color = if ($record.content -eq $publicIP) { "Green" } else { "Yellow" }

        Write-Host "  Name: $($record.name)" -ForegroundColor White
        Write-Host "  Type: $($record.type)" -ForegroundColor Gray
        Write-Host "  IP: $($record.content)" -ForegroundColor Gray
        Write-Host "  Proxied: $($record.proxied)" -ForegroundColor Gray
        Write-Host "  Status: $status" -ForegroundColor $color
        Write-Host ""
    }

    Write-Host "================================================================`n" -ForegroundColor Gray

} elseif ($UpdateDNS) {
    $zoneId = Get-ZoneID
    $publicIP = Get-PublicIP
    $records = Get-DNSRecords -zoneId $zoneId

    Write-Host "`n[4/4] Updating DNS records..." -ForegroundColor Yellow

    # Records to manage
    $recordsToManage = @(
        @{name = "@"; fullname = $DOMAIN},
        @{name = "www"; fullname = "www"}
    )

    foreach ($recordInfo in $recordsToManage) {
        $recordName = $recordInfo.name
        $nameForAPI = $recordInfo.fullname
        $fullName = if ($recordName -eq "@") { $DOMAIN } else { "$recordName.$DOMAIN" }
        $existingRecord = $records | Where-Object { $_.name -eq $fullName }

        if ($existingRecord) {
            # Update existing record
            if ($existingRecord.content -ne $publicIP) {
                Write-Host "  Updating $fullName -> $publicIP..." -NoNewline
                $success = Update-DNSRecord -zoneId $zoneId -recordId $existingRecord.id -name $nameForAPI -ip $publicIP
                if ($success) {
                    Write-Host " OK" -ForegroundColor Green
                } else {
                    Write-Host " FAILED" -ForegroundColor Red
                }
            } else {
                Write-Host "  $fullName is already up to date" -ForegroundColor Gray
            }
        } else {
            # Create new record
            Write-Host "  Creating $fullName -> $publicIP..." -NoNewline
            $success = Create-DNSRecord -zoneId $zoneId -name $nameForAPI -ip $publicIP
            if ($success) {
                Write-Host " OK" -ForegroundColor Green
            } else {
                Write-Host " FAILED" -ForegroundColor Red
            }
        }
    }

    Write-Host "`n[SUCCESS] DNS update complete!" -ForegroundColor Green
    Write-Host "`nYour site will be accessible at:" -ForegroundColor Cyan
    Write-Host "  https://$DOMAIN" -ForegroundColor Green
    Write-Host "  https://www.$DOMAIN" -ForegroundColor Green
    Write-Host "`nNote: DNS propagation may take 5-10 minutes" -ForegroundColor Yellow
    Write-Host ""

} else {
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "  .\cloudflare-dns.ps1 -CheckStatus   # Check current DNS records" -ForegroundColor White
    Write-Host "  .\cloudflare-dns.ps1 -UpdateDNS     # Update DNS to your current public IP" -ForegroundColor White
    Write-Host ""
}

