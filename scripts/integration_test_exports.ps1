# Integration test script for CSV export endpoints
# Run this against a running backend server (e.g., uvicorn main:app --port 8080)
# Usage: .\scripts\integration_test_exports.ps1 -BaseUrl "http://127.0.0.1:8080"

param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [string]$ApiKey = ""  # Optional: provide API key if endpoints require it
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CSV Export Integration Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Create output directory
$OutputDir = ".\tmp_exports_integration"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "Created output directory: $OutputDir" -ForegroundColor Green
}

# Test endpoints
$endpoints = @(
    @{Path="/api/inventory/export"; Name="inventory.csv"},
    @{Path="/api/orders/export"; Name="orders.csv"},
    @{Path="/api/timesheets/export.csv"; Name="timesheets.csv"}
)

$passed = 0
$failed = 0

foreach ($endpoint in $endpoints) {
    $url = "$BaseUrl$($endpoint.Path)"
    $outFile = Join-Path $OutputDir $endpoint.Name

    Write-Host "Testing: $($endpoint.Path)" -ForegroundColor Cyan
    Write-Host "  URL: $url"

    try {
        $headers = @{}
        if ($ApiKey) {
            $headers["X-API-Key"] = $ApiKey
        }

        # Download the file
        if ($headers.Count -gt 0) {
            Invoke-WebRequest -Uri $url -Headers $headers -OutFile $outFile -UseBasicParsing
        } else {
            Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
        }

        # Check file size
        $fileInfo = Get-Item $outFile
        $fileSize = $fileInfo.Length

        if ($fileSize -gt 10) {
            Write-Host "  ✓ SUCCESS: Downloaded $fileSize bytes" -ForegroundColor Green

            # Try to read first few lines
            $content = Get-Content $outFile -Raw -Encoding UTF8
            $lines = $content -split "`n"
            Write-Host "  First line (header): $($lines[0].Trim())" -ForegroundColor Gray

            if ($lines.Count -gt 1) {
                Write-Host "  Total lines: $($lines.Count)" -ForegroundColor Gray
            }

            $passed++
        } else {
            Write-Host "  ✗ FAIL: File too small ($fileSize bytes) - likely empty or error" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  ✗ FAIL: HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }

    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor $(if ($passed -gt 0) { "Green" } else { "Gray" })
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All tests passed! ✓" -ForegroundColor Green
    Write-Host "CSV files saved to: $OutputDir" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Some tests failed! ✗" -ForegroundColor Red
    exit 1
}

