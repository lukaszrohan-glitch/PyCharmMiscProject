<#
PowerShell smoke test for CSV export endpoints.
Usage:
  .\scripts\test_exports.ps1 -BaseUrl http://127.0.0.1:8080
#>
param(
    [string]$BaseUrl = "http://127.0.0.1:8080"
)

function Save-Endpoint {
    param($Path, $OutFile)
    Write-Host "Testing $Path -> $OutFile"
    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl$Path" -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            $bytes = $resp.Content
            # Save raw bytes if available
            $raw = $resp.RawContentStream
            if ($raw) {
                $fs = [System.IO.File]::OpenWrite($OutFile)
                $raw.CopyTo($fs)
                $fs.Close()
            } else {
                Set-Content -Path $OutFile -Value $resp.Content -Encoding UTF8
            }
            $size = (Get-Item $OutFile).Length
            Write-Host "Saved $size bytes to $OutFile"
        } else {
            Write-Host "HTTP $($resp.StatusCode) returned for $Path"
        }
    } catch {
        Write-Host "ERROR calling $Path : $_"
    }
}

New-Item -Path . -Name "tmp_exports" -ItemType Directory -Force | Out-Null

Save-Endpoint -Path "/api/orders/export" -OutFile "tmp_exports/orders.csv"
Save-Endpoint -Path "/api/inventory/export" -OutFile "tmp_exports/inventory.csv"
Save-Endpoint -Path "/api/timesheets/export.csv" -OutFile "tmp_exports/timesheets.csv"

Write-Host "Done. Check tmp_exports/*.csv"
