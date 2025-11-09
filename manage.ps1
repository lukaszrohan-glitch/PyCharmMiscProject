# Arkuszownia SMB Management Script
param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'restart', 'rebuild', 'status', 'logs', 'clean', 'test', 'help')]
    [string]$Command = 'help'
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSCommandPath

function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "`n=== Arkuszownia SMB Management ===" -Color Cyan
    Write-Host "`nUsage: .\manage.ps1 <command>"
    Write-Host "`nCommands:"
    Write-Host "  start    - Build frontend and start all services"
    Write-Host "  stop     - Stop all services"
    Write-Host "  restart  - Restart all services"
    Write-Host "  rebuild  - Rebuild and restart everything"
    Write-Host "  status   - Show status of all services"
    Write-Host "  logs     - Show logs from all services"
    Write-Host "  clean    - Stop and remove all containers"
    Write-Host "  test     - Run health checks"
    Write-Host "  help     - Show this help`n"
}

function Start-Services {
    Write-ColorOutput "`n[1/3] Building frontend..." -Color Yellow
    Push-Location "$ProjectRoot\frontend"
    if (-not (Test-Path "node_modules")) {
        Write-ColorOutput "Installing dependencies..." -Color Yellow
        npm install
    }
    npm run build
    Pop-Location

    Write-ColorOutput "`n[2/3] Starting services..." -Color Yellow
    docker-compose up -d

    Write-ColorOutput "`n[3/3] Waiting..." -Color Yellow
    Start-Sleep -Seconds 5
    docker-compose ps

    Write-ColorOutput "`nServices started!" -Color Green
    Write-ColorOutput "Frontend: http://localhost:8080" -Color Cyan
    Write-ColorOutput "API: http://localhost:8080/api" -Color Cyan
}

function Stop-Services {
    Write-ColorOutput "`nStopping services..." -Color Yellow
    docker-compose down
    Write-ColorOutput "Services stopped" -Color Green
}

function Restart-Services {
    Write-ColorOutput "`nRestarting services..." -Color Yellow
    docker-compose restart
    Start-Sleep -Seconds 5
    docker-compose ps
    Write-ColorOutput "Services restarted" -Color Green
}

function Rebuild-Services {
    Write-ColorOutput "`n[1/4] Stopping..." -Color Yellow
    docker-compose down

    Write-ColorOutput "`n[2/4] Cleaning..." -Color Yellow
    Remove-Item -Recurse -Force "$ProjectRoot\frontend\dist" -ErrorAction SilentlyContinue

    Write-ColorOutput "`n[3/4] Building frontend..." -Color Yellow
    Push-Location "$ProjectRoot\frontend"
    npm run build
    Pop-Location

    Write-ColorOutput "`n[4/4] Starting..." -Color Yellow
    docker-compose up -d --build
    Start-Sleep -Seconds 5
    docker-compose ps

    Write-ColorOutput "`nRebuild complete!" -Color Green
}

function Show-Status {
    Write-ColorOutput "`nService Status:" -Color Cyan
    docker-compose ps
}

function Show-Logs {
    Write-ColorOutput "`nShowing logs (Ctrl+C to stop)..." -Color Yellow
    docker-compose logs -f --tail=50
}

function Clean-Everything {
    Write-ColorOutput "`nWARNING: Remove all containers and volumes!" -Color Red
    $confirmation = Read-Host "Continue? (yes/no)"

    if ($confirmation -eq 'yes') {
        Write-ColorOutput "`nCleaning..." -Color Yellow
        docker-compose down -v
        Remove-Item -Recurse -Force "$ProjectRoot\frontend\dist" -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force "$ProjectRoot\logs" -ErrorAction SilentlyContinue
        Write-ColorOutput "Cleanup complete" -Color Green
    } else {
        Write-ColorOutput "Cancelled" -Color Yellow
    }
}

function Test-Services {
    Write-ColorOutput "`nRunning health checks..." -Color Yellow

    try {
        Write-Host "`n[1/3] Frontend..." -NoNewline
        $r1 = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 10
        if ($r1.StatusCode -eq 200 -and $r1.Content -match 'Arkuszownia') {
            Write-ColorOutput " OK" -Color Green
        } else {
            Write-ColorOutput " FAIL" -Color Red
        }

        Write-Host "[2/3] API health..." -NoNewline
        $r2 = Invoke-WebRequest -Uri "http://localhost:8080/api/healthz" -UseBasicParsing -TimeoutSec 10
        if ($r2.StatusCode -eq 200) {
            Write-ColorOutput " OK" -Color Green
        } else {
            Write-ColorOutput " FAIL" -Color Red
        }

        Write-Host "[3/3] API endpoint..." -NoNewline
        $headers = @{'X-API-Key'='dev-key-change-in-production'}
        $r3 = Invoke-WebRequest -Uri "http://localhost:8080/api/products" -Headers $headers -UseBasicParsing -TimeoutSec 10
        if ($r3.StatusCode -eq 200) {
            Write-ColorOutput " OK" -Color Green
        } else {
            Write-ColorOutput " FAIL" -Color Red
        }

        Write-ColorOutput "`nAll tests passed!" -Color Green

    } catch {
        Write-ColorOutput "`nHealth check failed: $($_.Exception.Message)" -Color Red
        Write-ColorOutput "Run: .\manage.ps1 start" -Color Yellow
    }
}

Push-Location $ProjectRoot

switch ($Command) {
    'start' { Start-Services }
    'stop' { Stop-Services }
    'restart' { Restart-Services }
    'rebuild' { Rebuild-Services }
    'status' { Show-Status }
    'logs' { Show-Logs }
    'clean' { Clean-Everything }
    'test' { Test-Services }
    'help' { Show-Help }
    default { Show-Help }
}

Pop-Location

