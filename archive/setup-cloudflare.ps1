# Automated Cloudflare Tunnel Setup
param(
    [switch]$NoWait
)

function Write-Color([string]$Text, [string]$Color = "White") {
    Write-Host $Text -ForegroundColor $Color
}

function Open-CloudflarePages {
    Start-Process "https://dash.cloudflare.com/?to=/:account/:zone/dns/records"
    Start-Sleep -Seconds 2
    Start-Process "https://one.dash.cloudflare.com//:account/access/tunnels"
}

function Test-Site {
    param (
        [string]$Url,
        [int]$TimeoutSec = 5
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

Write-Color "Cloudflare Tunnel Setup" "Cyan"
Write-Color "====================" "Cyan"

# 1. Start the tunnel if not running
$tunnel = Get-Process cloudflared -ErrorAction SilentlyContinue
if (-not $tunnel) {
    Write-Color "`nStarting Cloudflare tunnel..." "Yellow"
    Start-Process -FilePath ".\cloudflared.exe" -ArgumentList "tunnel", "--config", "cloudflared-config.yml", "run" -WindowStyle Minimized
    Start-Sleep -Seconds 5
}

# 2. Display configuration steps
Write-Color "`nRequired DNS Changes:" "Green"
Write-Color "1. Delete these records if they exist:"
Write-Color "   - A record for arkuszowniasmb.pl"
Write-Color "   - A record for www.arkuszowniasmb.pl"
Write-Color "`n2. Add these CNAME records:" "Green"
Write-Color '   Name: @    Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com    Proxy: ON (orange cloud)'
Write-Color '   Name: www  Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com    Proxy: ON (orange cloud)'

Write-Color "`nRequired Tunnel Configuration:" "Green"
Write-Color "1. In Zero Trust → Networks → Tunnels"
Write-Color "2. Find tunnel: 9320212e-f379-4261-8777-f9623823beee"
Write-Color "3. Add Public Hostnames:"
Write-Color "   - arkuszowniasmb.pl → http://127.0.0.1:80"
Write-Color "   - www.arkuszowniasmb.pl → http://127.0.0.1:80"

# 3. Open Cloudflare pages
Write-Color "`nOpening Cloudflare configuration pages..." "Yellow"
Open-CloudflarePages

if (-not $NoWait) {
    Write-Color "`nWaiting for site to become available..." "Yellow"
    $dots = 0
    while (-not (Test-Site -Url "https://arkuszowniasmb.pl")) {
        Write-Host "." -NoNewline
        $dots++
        if ($dots % 60 -eq 0) { Write-Host "" }
        Start-Sleep -Seconds 5
    }
    Write-Color "`n`nSUCCESS! Site is accessible at https://arkuszowniasmb.pl" "Green"
}
