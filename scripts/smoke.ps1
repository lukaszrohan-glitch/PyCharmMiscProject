$ErrorActionPreference = 'Stop'

param(
  [string]$Base = 'http://localhost:8000'
)

Write-Host "== Smoke test base: $Base =="

function Pass($m){ Write-Host "[PASS] $m" }
function Fail($m){ Write-Host "[FAIL] $m"; exit 1 }

Invoke-WebRequest -UseBasicParsing -Uri "$Base/healthz" | Out-Null; Pass "/healthz"
Invoke-WebRequest -UseBasicParsing -Uri "$Base/readyz"  | Out-Null; Pass "/readyz"
Invoke-WebRequest -UseBasicParsing -Uri "$Base/api/products" | Out-Null; Pass "/api/products"
Invoke-WebRequest -UseBasicParsing -Uri "$Base/api/orders"   | Out-Null; Pass "/api/orders"

$from = (Get-Date -Day 1).ToString('yyyy-MM-dd')
$to   = (Get-Date -Day 1).AddMonths(1).AddDays(-1).ToString('yyyy-MM-dd')

Invoke-WebRequest -UseBasicParsing -Uri "$Base/api/timesheets/summary?from=$from&to=$to" | Out-Null; Pass "/api/timesheets/summary"
Invoke-WebRequest -UseBasicParsing -Uri "$Base/api/timesheets/weekly-summary?from=$from&to=$to" | Out-Null; Pass "/api/timesheets/weekly-summary"

# Optional JWT admin tests
if ($env:ADMIN_EMAIL -and $env:ADMIN_PASSWORD){
  $loginBody = @{ email=$env:ADMIN_EMAIL; password=$env:ADMIN_PASSWORD } | ConvertTo-Json
  $loginResp = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$Base/api/auth/login" -ContentType 'application/json' -Body $loginBody
  $json = $loginResp.Content | ConvertFrom-Json
  $token = $json.tokens.access_token
  if ($token){
    Invoke-WebRequest -UseBasicParsing -Headers @{ Authorization = "Bearer $token" } -Uri "$Base/api/timesheets/pending?from=$from&to=$to" | Out-Null; Pass "/api/timesheets/pending"
  } else {
    Write-Host "[WARN] No access token parsed; skipping JWT-only tests"
  }
}

Invoke-WebRequest -UseBasicParsing -OutFile $null -Uri "$Base/api/timesheets/export.csv?from=$from&to=$to"; Pass "/api/timesheets/export.csv"
Invoke-WebRequest -UseBasicParsing -OutFile $null -Uri "$Base/api/timesheets/export-summary.csv?from=$from&to=$to"; Pass "/api/timesheets/export-summary.csv"

Write-Host "== Smoke test completed =="

