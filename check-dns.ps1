# PowerShell DNS checker
$domain = "arkuszowniasmb.pl"
$tunnelId = "9320212e-f379-4261-8777-f9623823beee"
$expectedCNAME = "$tunnelId.cfargotunnel.com"

Write-Host "Checking DNS setup for $domain..." -ForegroundColor Cyan
Write-Host "Expected CNAME: $expectedCNAME" -ForegroundColor Cyan
Write-Host ""

# Check A records
Write-Host "Checking A records..." -ForegroundColor Yellow
$aRecords = Resolve-DnsName -Name $domain -Type A -ErrorAction SilentlyContinue
if ($aRecords) {
    Write-Host "WARNING: Found A records (these should be removed):" -ForegroundColor Red
    $aRecords | ForEach-Object {
        Write-Host "  $($_.Name) -> $($_.IPAddress)" -ForegroundColor Red
    }
} else {
    Write-Host "OK: No A records found" -ForegroundColor Green
}

# Check CNAME
Write-Host "`nChecking CNAME..." -ForegroundColor Yellow
$cname = Resolve-DnsName -Name $domain -Type CNAME -ErrorAction SilentlyContinue
if ($cname) {
    if ($cname.NameHost -eq $expectedCNAME) {
        Write-Host "OK: CNAME correctly points to tunnel" -ForegroundColor Green
    } else {
        Write-Host "WARNING: CNAME points to wrong target:" -ForegroundColor Red
        Write-Host "  Current: $($cname.NameHost)" -ForegroundColor Red
        Write-Host "  Expected: $expectedCNAME" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: No CNAME record found" -ForegroundColor Red
}

# Check if tunnel is reachable
Write-Host "`nChecking tunnel endpoint..." -ForegroundColor Yellow
try {
    $null = Resolve-DnsName -Name $expectedCNAME -ErrorAction Stop
    Write-Host "OK: Tunnel endpoint is reachable" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Cannot resolve tunnel endpoint" -ForegroundColor Red
}

# Local connection test
Write-Host "`nChecking local service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1/healthz" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "OK: Local service is responding" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Local service returned status $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "WARNING: Cannot connect to local service: $_" -ForegroundColor Red
}

Write-Host "`nAction needed:" -ForegroundColor Cyan
Write-Host "1. In Cloudflare DNS settings (https://dash.cloudflare.com):"
Write-Host "   - Delete any A records for $domain"
Write-Host "   - Add CNAME record: $domain -> $expectedCNAME"
Write-Host "   - Ensure orange cloud (proxy) is enabled"
Write-Host "2. Wait 2-5 minutes for DNS to propagate"
Write-Host "3. Run run.cmd to start the tunnel"

pause
