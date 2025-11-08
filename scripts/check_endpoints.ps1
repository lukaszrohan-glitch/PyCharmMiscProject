# scripts/check_endpoints.ps1
# Quick endpoint checks for local dev environment (PowerShell)
# Usage: .\scripts\check_endpoints.ps1
# Adjust HOST and PORT if needed.

$hostAddr = '127.0.0.1'
$port = 8080
$base = "http://$($hostAddr):$port"

function Truncate-Text {
    param([string]$s, [int]$len = 800)
    if ($null -eq $s) { return '' }
    if ($s.Length -le $len) { return $s }
    return $s.Substring(0,$len) + "...(truncated)"
}

Write-Host "Checking site: $base" -ForegroundColor Cyan

# Use native curl.exe shipped on Windows to avoid PowerShell Invoke-WebRequest alias behavior
Write-Host "GET / -> status and first 400 chars" -ForegroundColor Yellow
try {
    $index = & curl.exe -sS "$base/"
    Write-Host (Truncate-Text $index 400)
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nGET /api/healthz -> status (raw)" -ForegroundColor Yellow
try {
    $health = & curl.exe -sS -w "`nHTTP_STATUS:%{http_code}" "$base/api/healthz"
    Write-Host $health
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nGET /api/products -> truncated JSON (if present)" -ForegroundColor Yellow
try {
    $prod = & curl.exe -sS "$base/api/products"
    Write-Host (Truncate-Text $prod 800)
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nGET /api/customers -> truncated JSON (if present)" -ForegroundColor Yellow
try {
    $cust = & curl.exe -sS "$base/api/customers"
    Write-Host (Truncate-Text $cust 800)
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nNote: If curl.exe is not available, install Windows 10+ curl or use WSL/Git Bash." -ForegroundColor Magenta
