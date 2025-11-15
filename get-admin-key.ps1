
param(
    [switch]$Detailed
)

function Write-Status {
    param($Service, $Status, $Message = "")
    $color = if ($Status -eq "OK") { "Green" } elseif ($Status -eq "WARN") { "Yellow" } else { "Red" }
    $icon = if ($Status -eq "OK") { "✅" } elseif ($Status -eq "WARN") { "⚠️" } else { "❌" }

    Write-Host "$icon " -NoNewline -ForegroundColor $color
    Write-Host "$Service`: " -NoNewline
    Write-Host "$Status" -ForegroundColor $color
    if ($Message) {
        Write-Host "   └─ $Message" -ForegroundColor Gray
    }
}

Clear-Host
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          🏥 ARKUSZOWNIA HEALTH CHECK                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Check Docker
Write-Host "🐳 Docker Status" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
try {
    docker version | Out-Null
    Write-Status "Docker Engine" "OK" "Running"
} catch {
    Write-Status "Docker Engine" "FAIL" "Not running - start Docker Desktop"
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 2. Check Containers
Write-Host "`n🔧 Container Status" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$containers = @(
    @{Name="smb_db"; Display="Database (PostgreSQL)"},
    @{Name="smb_backend"; Display="Backend API"},
    @{Name="smb_frontend_build"; Display="Frontend Build"},
    @{Name="smb_nginx"; Display="Nginx (Frontend Server)"},
    @{Name="smb_cloudflared"; Display="Cloudflare Tunnel"}
)

foreach ($container in $containers) {
    try {
        $status = docker inspect -f '{{.State.Status}}' $container.Name 2>$null
        $health = docker inspect -f '{{.State.Health.Status}}' $container.Name 2>$null

        if ($status -eq "running") {
            if ($health -and $health -ne "<no value>") {
                if ($health -eq "healthy") {
                    Write-Status $container.Display "OK" "Running & Healthy"
                } else {
                    Write-Status $container.Display "WARN" "Running but $health"
                }
            } else {
                Write-Status $container.Display "OK" "Running"
            }
        } elseif ($status -eq "exited" -and $container.Name -eq "smb_frontend_build") {
            # Frontend build container should exit after successful build
            $exitCode = docker inspect -f '{{.State.ExitCode}}' $container.Name 2>$null
            if ($exitCode -eq "0") {
                Write-Status $container.Display "OK" "Build completed successfully"
            } else {
                Write-Status $container.Display "FAIL" "Build failed (exit code: $exitCode)"
            }
        } else {
            Write-Status $container.Display "FAIL" "Status: $status"
        }
    } catch {
        Write-Status $container.Display "FAIL" "Container not found"
    }
}

# 3. Check Endpoints
Write-Host "`n🌐 Endpoint Health Checks" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$endpoints = @(
    @{Name="Frontend (Nginx)"; Url="http://localhost:8080/"; CheckContent="Arkuszownia"},
    @{Name="Backend Health"; Url="http://localhost:8080/api/healthz"; CheckContent=$null},
    @{Name="Backend API Docs"; Url="http://localhost:8080/docs"; CheckContent="FastAPI"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            if ($endpoint.CheckContent -and $response.Content -notmatch $endpoint.CheckContent) {
                Write-Status $endpoint.Name "WARN" "Responds but content unexpected"
            } else {
                Write-Status $endpoint.Name "OK" "HTTP $($response.StatusCode)"
            }
        } else {
            Write-Status $endpoint.Name "WARN" "HTTP $($response.StatusCode)"
        }
    } catch {
        Write-Status $endpoint.Name "FAIL" $_.Exception.Message
    }
}

# 4. Check API with Key
Write-Host "`n🔑 API Authentication Check" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Try to find admin key from docker-compose.yml
$adminKey = $null
if (Test-Path "docker-compose.yml") {
    $content = Get-Content "docker-compose.yml" -Raw
    if ($content -match 'ADMIN_KEY[=:][\s]*([^\s\n]+)') {
        $adminKey = $matches[1]
    }
}

if ($adminKey -and $adminKey -ne '${ADMIN_KEY:-}') {
    try {
        $headers = @{'X-Admin-Key' = $adminKey}
        $response = Invoke-WebRequest -Uri "http://localhost:8080/admin/api-keys" -Headers $headers -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Status "Admin API Access" "OK" "Admin key works"
    } catch {
        Write-Status "Admin API Access" "FAIL" "Admin key invalid or endpoint unreachable"
    }
} else {
    Write-Status "Admin API Access" "WARN" "Admin key not found in docker-compose.yml"
}

# 5. Check Database Connection
Write-Host "`n💾 Database Status" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

try {
    $dbCheck = docker exec smb_db pg_isready -U smb_user -d smbtool 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "PostgreSQL" "OK" "Accepting connections"
    } else {
        Write-Status "PostgreSQL" "FAIL" "Not ready"
    }
} catch {
    Write-Status "PostgreSQL" "FAIL" "Cannot check status"
}

# 6. Check Admin API Key
Write-Host "`n🔑 Finding Admin API Key..." -ForegroundColor Cyan

# Check .env file
if (Test-Path ".env") {
    $envKey = Get-Content ".env" | Select-String "^ADMIN_KEY=" | ForEach-Object {
        $_.Line -replace "^ADMIN_KEY=", ""
    }
    if ($envKey) {
        Write-Host "✅ Found in .env file:" -ForegroundColor Green
        Write-Host "   $envKey`n" -ForegroundColor Yellow
    }
}

# Check docker-compose.yml
if (Test-Path "docker-compose.yml") {
    $composeContent = Get-Content "docker-compose.yml" -Raw
    if ($composeContent -match 'ADMIN_KEY:\s*([^\s\n]+)') {
        $composeKey = $matches[1]
        if ($composeKey -ne '${ADMIN_KEY:-}') {
            Write-Host "✅ Found in docker-compose.yml:" -ForegroundColor Green
            Write-Host "   $composeKey`n" -ForegroundColor Yellow
        }
    }
}

# Check running container
try {
    $containerKey = docker exec smb_backend printenv ADMIN_KEY 2>$null
    if ($containerKey) {
        Write-Host "✅ Found in running container:" -ForegroundColor Green
        Write-Host "   $containerKey`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Container not running or key not set" -ForegroundColor Yellow
}

Write-Host "`n💡 Usage Example:" -ForegroundColor Cyan
Write-Host "   curl -H 'X-Admin-Key: YOUR_KEY' http://localhost:8080/admin/api-keys`n" -ForegroundColor Gray

# 7. Detailed Logs (if requested)
if ($Detailed) {
    Write-Host "`n📋 Recent Container Logs" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

    foreach ($container in @("smb_backend", "smb_nginx", "smb_frontend_build")) {
        Write-Host "`n[$container]" -ForegroundColor Cyan
        docker logs --tail 10 $container 2>&1 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    📊 SUMMARY                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n🌐 Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:8080" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8080/docs" -ForegroundColor White
Write-Host "   Health:    http://localhost:8080/api/healthz" -ForegroundColor White

if ($adminKey -and $adminKey -ne '${ADMIN_KEY:-}') {
    Write-Host "`n🔑 Admin Key: " -NoNewline -ForegroundColor Yellow
    Write-Host $adminKey -ForegroundColor Green
}

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "   • Run with -Detailed flag for container logs" -ForegroundColor Gray
Write-Host "   • Check logs: docker logs smb_nginx" -ForegroundColor Gray
Write-Host "   • Restart: docker-compose restart nginx" -ForegroundColor Gray

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
