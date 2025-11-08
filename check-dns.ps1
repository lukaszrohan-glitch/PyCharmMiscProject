# Cloudflare DNS Checker and Fixer
# This script checks if DNS is properly configured for the tunnel

$domain = "arkuszowniasmb.pl"
$tunnelId = "9320212e-f379-4261-8777-f9623823beee"
$tunnelCname = "$tunnelId.cfargotunnel.com"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloudflare Tunnel DNS Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: DNS Resolution
Write-Host "[1/4] Checking DNS resolution..." -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName -Name $domain -Type A -ErrorAction SilentlyContinue
    if ($dns) {
        Write-Host "  OK Domain resolves to: $($dns[0].IPAddress)" -ForegroundColor Green

        # Check if it's a Cloudflare IP
        $ip = $dns[0].IPAddress
        if ($ip -like "104.*" -or $ip -like "172.64.*" -or $ip -like "172.65.*") {
            Write-Host "  OK Using Cloudflare proxy" -ForegroundColor Green
        } else {
            Write-Host "  WARNING Not using Cloudflare proxy (IP: $ip)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ERROR Domain does not resolve!" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR DNS lookup failed" -ForegroundColor Red
}

# Check 2: CNAME Record
Write-Host ""
Write-Host "[2/4] Checking CNAME record..." -ForegroundColor Yellow
try {
    $cname = Resolve-DnsName -Name $domain -Type CNAME -ErrorAction SilentlyContinue
    if ($cname) {
        Write-Host "  OK CNAME exists: $($cname.NameHost)" -ForegroundColor Green

        if ($cname.NameHost -like "*cfargotunnel.com") {
            Write-Host "  OK Points to Cloudflare Tunnel" -ForegroundColor Green

            if ($cname.NameHost -eq $tunnelCname) {
                Write-Host "  OK Correct tunnel ID!" -ForegroundColor Green
            } else {
                Write-Host "  WARNING Wrong tunnel ID!" -ForegroundColor Yellow
                Write-Host "    Expected: $tunnelCname" -ForegroundColor Yellow
                Write-Host "    Got: $($cname.NameHost)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ERROR Does not point to Cloudflare Tunnel!" -ForegroundColor Red
        }
    } else {
        Write-Host "  ERROR No CNAME record found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "  ACTION REQUIRED:" -ForegroundColor Red
        Write-Host "  1. Go to https://dash.cloudflare.com" -ForegroundColor White
        Write-Host "  2. Select: $domain" -ForegroundColor White
        Write-Host "  3. Go to DNS tab" -ForegroundColor White
        Write-Host "  4. Add CNAME record:" -ForegroundColor White
        Write-Host "     Type: CNAME" -ForegroundColor Cyan
        Write-Host "     Name: arkuszowniasmb.pl" -ForegroundColor Cyan
        Write-Host "     Target: $tunnelCname" -ForegroundColor Cyan
        Write-Host "     Proxy: ON (orange cloud)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  WARNING CNAME lookup failed" -ForegroundColor Yellow
}

# Check 3: Local Origin
Write-Host ""
Write-Host "[3/4] Checking local origin..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:80" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  OK Local nginx responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ERROR Local nginx not responding!" -ForegroundColor Red
    Write-Host "    Run: docker-compose up -d" -ForegroundColor Yellow
}

# Check 4: Tunnel Process
Write-Host ""
Write-Host "[4/4] Checking tunnel process..." -ForegroundColor Yellow
$tunnel = Get-Process -Name cloudflared -ErrorAction SilentlyContinue
if ($tunnel) {
    Write-Host "  OK Tunnel process running (PID: $($tunnel.Id))" -ForegroundColor Green
} else {
    Write-Host "  ERROR Tunnel not running!" -ForegroundColor Red
    Write-Host "    Run: .\fix-tunnel.cmd" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allGood = $true

if (-not $dns) {
    Write-Host "ERROR DNS not configured properly" -ForegroundColor Red
    $allGood = $false
}

if (-not $cname -or $cname.NameHost -ne $tunnelCname) {
    Write-Host "ERROR CNAME record missing or incorrect" -ForegroundColor Red
    $allGood = $false
}

if (-not $tunnel) {
    Write-Host "ERROR Tunnel not running" -ForegroundColor Red
    $allGood = $false
}

if ($allGood) {
    Write-Host ""
    Write-Host "SUCCESS Everything looks good!" -ForegroundColor Green
    Write-Host "If site still does not work, wait 2-3 minutes for DNS propagation." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "ACTION REQUIRED - See above for details" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to open Cloudflare Dashboard..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "https://dash.cloudflare.com"

