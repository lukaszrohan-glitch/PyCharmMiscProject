
Write-Host "🧪 Quick Functionality Test" -ForegroundColor Cyan
Write-Host "===========================`n" -ForegroundColor Cyan

$API_BASE = "http://localhost:8080/api"
$API_KEY = "changeme123"
$headers = @{
    "X-API-Key" = $API_KEY
    "Content-Type" = "application/json"
}

# Test 1: Get all orders
Write-Host "[1/5] Fetching orders..." -ForegroundColor Yellow
try {
    $orders = Invoke-