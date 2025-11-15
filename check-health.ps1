
param(
    [switch]$Detailed
)

function Write-Status {
    param($Name, $Status, $Message)
    $color = switch ($Status) {
        "OK" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
    }
    $symbol = switch ($Status) {
        "OK" { "[OK]" }
        "WARN" { "[WARN]" }
        "FAIL" { "[FAIL]" }
    }
    Write-Host "$symbol $Name : $Message" -ForegroundColor $color
}

Clear-Host
Write-Host "`n=== ARKUSZOWNIA HEALTH CHECK ===`n" -ForegroundColor Cyan

Write-Host "Docker Status" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
try {
    docker version | Out-Null
    Write-Status "Docker Engine" "OK" "Running"
} catch {
    Write-Status "Docker Engine" "FAIL" "Not running"
    exit 1
}

Write-Host "`nContainer Status" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray
$containers = @(
    @{Name="smb_db"; Display="Database"},
    @{Name="smb_backend"; Display="Backend API"},
    @{Name="smb_frontend_build"; Display="Frontend Build"},
    @{Name="smb_nginx"; Display="Nginx"},
    @{Name="smb_cloudflared"; Display="Cloudflare Tunnel"}
)

foreach ($container in $containers) {
    try {
        $status = docker inspect -f '{{.State.Status}}' $container.Name 2>$null
        if ($status -eq "running") {
            Write-Status $container.Display "OK" "Running"
        } elseif ($status -eq "exited" -and $container.Name -eq "smb_frontend_build") {
            $exitCode = docker inspect -f '{{.State.ExitCode}}' $container.Name 2>$null
            if ($exitCode -eq "0") {
                Write-Status $container.Display "OK" "Build completed"
            } else {
                Write-Status $container.Display "FAIL" "Build failed"
            }
        } else {
            Write-Status $container.Display "FAIL" "Status: $status"
        }
    } catch {
        Write-Status $container.Display "FAIL" "Not found"
    }
}

Write-Host "`nHealth Check" -ForegroundColor Cyan
Write-Host "============`n" -ForegroundColor Cyan

# Check endpoints
$endpoints = @(
    @{Name="Frontend"; Url="http://localhost:8080/"},
    @{Name="Backend Health"; Url="http://localhost:8080/api/healthz"},
    @{Name="API Docs"; Url="http://localhost:8080/docs"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Status $endpoint.Name "OK" "HTTP 200"
        } else {
            Write-Status $endpoint.Name "WARN" "HTTP $($response.StatusCode)"
        }
    } catch {
        Write-Status $endpoint.Name "FAIL" "Unreachable"
    }
}

# Check database (FIXED: using correct credentials)
try {
    $dbCheck = docker exec smb_db psql -U smb_user -d smbtool -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "PostgreSQL" "OK" "Accepting connections"
    } else {
        Write-Status "PostgreSQL" "FAIL" "Not ready"
    }
} catch {
    Write-Status "PostgreSQL" "FAIL" "Cannot check"
}

Write-Host "`n============`n" -ForegroundColor Cyan

Write-Host "`nAPI Authentication Check" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor DarkGray

$adminKey = $null
if (Test-Path ".env") {
    $envLines = Get-Content ".env"
    foreach ($line in $envLines) {
        if ($line -match '^ADMIN_KEY=(.+)$') {
            $adminKey = $matches[1].Trim()
            break
        }
    }
}

if (-not $adminKey -or $adminKey -eq '${ADMIN_KEY:-}') {
    if (Test-Path "docker-compose.yml") {
        $composeLines = Get-Content "docker-compose.yml"
        foreach ($line in $composeLines) {
            if ($line -match 'ADMIN_KEY:\s*(.+)$') {
                $adminKey = $matches[1].Trim()
                break
            }
        }
    }
}

if ($adminKey -and $adminKey -ne '${ADMIN_KEY:-}' -and $adminKey -ne '') {
    try {
        $headers = @{'X-Admin-Key' = $adminKey}
        $response = Invoke-WebRequest -Uri "http://localhost:8080/admin/api-keys" -Headers $headers -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Status "Admin API Access" "OK" "Admin key works"
    } catch {
        Write-Status "Admin API Access" "FAIL" "Admin key invalid or endpoint unreachable"
    }
} else {
    Write-Status "Admin API Access" "WARN" "Admin key not found"
}

if ($Detailed) {
    Write-Host "`nRecent Container Logs" -ForegroundColor Yellow
    Write-Host "-----------------------------------" -ForegroundColor DarkGray
    foreach ($container in @("smb_backend", "smb_nginx", "smb_frontend_build")) {
        Write-Host "`n[$container]" -ForegroundColor Cyan
        docker logs --tail 10 $container 2>&1 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:8080" -ForegroundColor White
Write-Host "API Docs:  http://localhost:8080/docs" -ForegroundColor White
Write-Host "Health:    http://localhost:8080/api/healthz" -ForegroundColor White

if ($adminKey -and $adminKey -ne '${ADMIN_KEY:-}' -and $adminKey -ne '') {
    Write-Host "`nAdmin Key: " -NoNewline -ForegroundColor Yellow
    Write-Host $adminKey -ForegroundColor Green
}

Write-Host "`nTips:" -ForegroundColor Yellow
Write-Host "  - Run with -Detailed flag for container logs" -ForegroundColor Gray
Write-Host "  - Check logs: docker logs smb_nginx" -ForegroundColor Gray
Write-Host "  - Restart: docker-compose restart nginx" -ForegroundColor Gray
Write-Host "`n"

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
