# Cloudflare Tunnel Setup Helper
# This script helps you configure the Cloudflare Tunnel for public access

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSCommandPath
$EnvFile = Join-Path $ProjectRoot ".env"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = 'White')
    Write-Host $Message -ForegroundColor $Color
}

function Show-Header {
    Write-Host "`n" -NoNewline
    Write-ColorOutput "╔════════════════════════════════════════════════════════╗" -Color Cyan
    Write-ColorOutput "║   CLOUDFLARE TUNNEL CONFIGURATION HELPER               ║" -Color Cyan
    Write-ColorOutput "║   Arkuszownia SMB - Public Network Setup               ║" -Color Cyan
    Write-ColorOutput "╚════════════════════════════════════════════════════════╝" -Color Cyan
    Write-Host ""
}

function Test-EnvFile {
    if (-not (Test-Path $EnvFile)) {
        Write-ColorOutput "ERROR: .env file not found at: $EnvFile" -Color Red
        Write-ColorOutput "Creating default .env file..." -Color Yellow

        $defaultEnv = @"
DATABASE_URL=postgresql://smb_user:smb_password@db:5432/smbtool
API_KEYS=dev-key-change-in-production
ADMIN_KEY=admin-change-in-production
CORS_ORIGINS=http://localhost:8080,http://localhost:3000,https://arkuszowniasmb.pl
ALLOWED_HOSTS=localhost,127.0.0.1,arkuszowniasmb.pl
CLOUDFLARE_TUNNEL_TOKEN=
"@
        Set-Content -Path $EnvFile -Value $defaultEnv
        Write-ColorOutput "Created .env file with defaults" -Color Green
    }
}

function Get-CurrentToken {
    $content = Get-Content $EnvFile -Raw
    if ($content -match 'CLOUDFLARE_TUNNEL_TOKEN=(.*)') {
        $token = $Matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($token)) {
            return $null
        }
        return $token
    }
    return $null
}

function Set-TunnelToken {
    param([string]$Token)

    $content = Get-Content $EnvFile -Raw
    if ($content -match 'CLOUDFLARE_TUNNEL_TOKEN=.*') {
        $content = $content -replace 'CLOUDFLARE_TUNNEL_TOKEN=.*', "CLOUDFLARE_TUNNEL_TOKEN=$Token"
    } else {
        $content += "`nCLOUDFLARE_TUNNEL_TOKEN=$Token"
    }

    Set-Content -Path $EnvFile -Value $content -NoNewline
}

function Show-Status {
    Write-ColorOutput "`n[CURRENT STATUS]" -Color Yellow

    $token = Get-CurrentToken
    if ($token) {
        $preview = $token.Substring(0, [Math]::Min(30, $token.Length)) + "..."
        Write-Host "  Token: " -NoNewline
        Write-ColorOutput "CONFIGURED ($preview)" -Color Green
    } else {
        Write-Host "  Token: " -NoNewline
        Write-ColorOutput "NOT CONFIGURED" -Color Red
    }

    # Check if tunnel is running
    $running = docker-compose ps cloudflared 2>&1 | Select-String "Up"
    if ($running) {
        Write-Host "  Tunnel: " -NoNewline
        Write-ColorOutput "RUNNING" -Color Green
    } else {
        Write-Host "  Tunnel: " -NoNewline
        Write-ColorOutput "STOPPED" -Color Yellow
    }

    Write-Host ""
}

function Show-Instructions {
    Write-ColorOutput "`n[HOW TO GET YOUR TUNNEL TOKEN]`n" -Color Cyan

    Write-Host "1. Go to Cloudflare Zero Trust Dashboard:"
    Write-ColorOutput "   https://one.dash.cloudflare.com/" -Color Blue

    Write-Host "`n2. Navigate to: Access → Tunnels"

    Write-Host "`n3. Your tunnel ID is: " -NoNewline
    Write-ColorOutput "9320212e-f379-4261-8777-f9623823beee" -Color Green

    Write-Host "`n4. Click on the tunnel, then 'Configure'"

    Write-Host "`n5. Under 'Install connector', select 'Docker'"

    Write-Host "`n6. Copy the token from the docker run command"
    Write-Host "   It looks like: " -NoNewline
    Write-ColorOutput "eyJhIjoiNzk4M2E3Zj..." -Color Yellow

    Write-Host "`n7. Paste it when prompted by this script"

    Write-ColorOutput "`n[REQUIRED DNS CONFIGURATION]`n" -Color Cyan
    Write-Host "Make sure these DNS records exist in Cloudflare:"
    Write-Host "  Type: CNAME"
    Write-Host "  Name: @"
    Write-Host "  Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com"
    Write-Host ""
    Write-Host "  Type: CNAME"
    Write-Host "  Name: www"
    Write-Host "  Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com"
    Write-Host ""
}

function Set-Token {
    Write-ColorOutput "`n[CONFIGURE TUNNEL TOKEN]`n" -Color Yellow

    $token = Read-Host "Paste your Cloudflare Tunnel token here (or press Enter to skip)"

    if ([string]::IsNullOrWhiteSpace($token)) {
        Write-ColorOutput "Skipped - no token provided" -Color Yellow
        return $false
    }

    Write-Host "Saving token to .env file..." -NoNewline
    Set-TunnelToken $token
    Write-ColorOutput " Done!" -Color Green

    return $true
}

function Start-Tunnel {
    Write-ColorOutput "`n[STARTING CLOUDFLARE TUNNEL]`n" -Color Yellow

    $token = Get-CurrentToken
    if (-not $token) {
        Write-ColorOutput "ERROR: No tunnel token configured!" -Color Red
        Write-ColorOutput "Please configure the token first (option 2)" -Color Yellow
        return
    }

    Write-Host "Starting tunnel with production profile..."
    docker-compose --profile production up -d cloudflared

    Start-Sleep -Seconds 3

    Write-Host "`nChecking tunnel status..."
    docker-compose logs cloudflared --tail 20

    Write-ColorOutput "`nTunnel started! Check logs above for connection status." -Color Green
    Write-ColorOutput "Your site should be accessible at: https://arkuszowniasmb.pl" -Color Cyan
}

function Stop-Tunnel {
    Write-ColorOutput "`n[STOPPING CLOUDFLARE TUNNEL]`n" -Color Yellow
    docker-compose stop cloudflared
    Write-ColorOutput "Tunnel stopped" -Color Green
}

function Show-Logs {
    Write-ColorOutput "`n[CLOUDFLARE TUNNEL LOGS]`n" -Color Yellow
    Write-Host "Showing last 30 lines (press Ctrl+C to exit follow mode)..."
    Write-Host ""
    docker-compose logs cloudflared --tail 30 -f
}

function Test-Connection {
    Write-ColorOutput "`n[TESTING CONNECTION]`n" -Color Yellow

    $token = Get-CurrentToken
    if (-not $token) {
        Write-ColorOutput "No token configured - skipping" -Color Yellow
        return
    }

    Write-Host "Testing local application..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/healthz" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "  Local API: OK" -Color Green
        }
    } catch {
        Write-ColorOutput "  Local API: FAILED" -Color Red
    }

    Write-Host "`nTesting public domain (if tunnel is running)..."
    try {
        $response = Invoke-WebRequest -Uri "https://arkuszowniasmb.pl" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "  Public site: OK" -Color Green
        }
    } catch {
        Write-ColorOutput "  Public site: NOT ACCESSIBLE" -Color Yellow
        Write-Host "  (This is normal if tunnel is not running or DNS not configured)"
    }
}

function Show-Menu {
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════" -Color Cyan
    Write-Host "  1) Show status"
    Write-Host "  2) Configure tunnel token"
    Write-Host "  3) Start tunnel"
    Write-Host "  4) Stop tunnel"
    Write-Host "  5) View tunnel logs"
    Write-Host "  6) Test connection"
    Write-Host "  7) Show instructions"
    Write-Host "  8) Exit"
    Write-ColorOutput "═══════════════════════════════════════════════════════" -Color Cyan
    Write-Host ""
}

# Main execution
Clear-Host
Show-Header
Test-EnvFile
Show-Status

do {
    Show-Menu
    $choice = Read-Host "Select an option (1-8)"

    switch ($choice) {
        "1" { Show-Status }
        "2" {
            Show-Instructions
            if (Set-Token) {
                Show-Status
            }
        }
        "3" { Start-Tunnel }
        "4" { Stop-Tunnel }
        "5" { Show-Logs }
        "6" { Test-Connection }
        "7" { Show-Instructions }
        "8" {
            Write-ColorOutput "`nGoodbye!" -Color Cyan
            break
        }
        default { Write-ColorOutput "Invalid option. Please select 1-8." -Color Red }
    }

    if ($choice -ne "8") {
        Write-Host "`nPress Enter to continue..." -NoNewline
        Read-Host
        Clear-Host
        Show-Header
        Show-Status
    }

} while ($choice -ne "8")

