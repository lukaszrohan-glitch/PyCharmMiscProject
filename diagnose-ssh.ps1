$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== SSH Connectivity Diagnosis ===" -ForegroundColor Cyan
Write-Host ""

$server = "serwer2581752.home.pl"
$username = "serwer2581752"

Write-Host "1. DNS Resolution" -ForegroundColor Yellow
$dns_ok = $false
try {
    $ips = @([System.Net.Dns]::GetHostAddresses($server))
    if ($ips.Count -gt 0) {
        Write-Host "✓ Domain resolves to:" -ForegroundColor Green
        foreach ($ip in $ips) {
            Write-Host "  - $($ip.IPAddressToString)"
        }
        $dns_ok = $true
    }
}
catch {
    Write-Host "✗ DNS resolution failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Port Connectivity (SSH Port 22)" -ForegroundColor Yellow
$port22_ok = $false
$result = Test-NetConnection -ComputerName $server -Port 22 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($result.TcpTestSucceeded) {
    Write-Host "✓ SSH port 22 is OPEN" -ForegroundColor Green
    $port22_ok = $true
} else {
    Write-Host "✗ SSH port 22 is CLOSED/TIMEOUT" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. HTTPS Web Server (Port 443)" -ForegroundColor Yellow
$port443_ok = $false
$result = Test-NetConnection -ComputerName $server -Port 443 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($result.TcpTestSucceeded) {
    Write-Host "✓ HTTPS port 443 is OPEN" -ForegroundColor Green
    $port443_ok = $true
} else {
    Write-Host "✗ HTTPS port 443 is CLOSED/TIMEOUT" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. SSH Connection Attempt" -ForegroundColor Yellow
Write-Host "Running: ssh -o ConnectTimeout=10 -o BatchMode=yes $username@$server exit" -ForegroundColor Gray

$ssh_ok = $false
try {
    $output = ssh -o ConnectTimeout=10 -o BatchMode=yes "$username@$server" exit 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✓ SSH connection SUCCESSFUL" -ForegroundColor Green
        $ssh_ok = $true
    } else {
        Write-Host "✗ SSH connection FAILED (exit code: $exitCode)" -ForegroundColor Red
        if ($output) {
            Write-Host "Details: $output" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "✗ SSH error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Diagnosis Summary ===" -ForegroundColor Cyan
Write-Host "DNS Resolution:   $(if ($dns_ok) { 'PASS' } else { 'FAIL' })" -ForegroundColor $(if ($dns_ok) { 'Green' } else { 'Red' })
Write-Host "Port 22 (SSH):    $(if ($port22_ok) { 'OPEN' } else { 'BLOCKED' })" -ForegroundColor $(if ($port22_ok) { 'Green' } else { 'Red' })
Write-Host "Port 443 (HTTPS): $(if ($port443_ok) { 'OPEN' } else { 'BLOCKED' })" -ForegroundColor $(if ($port443_ok) { 'Green' } else { 'Red' })
Write-Host "SSH Connection:   $(if ($ssh_ok) { 'SUCCESS' } else { 'FAILED' })" -ForegroundColor $(if ($ssh_ok) { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan

if (-not $dns_ok) {
    Write-Host "• DNS not resolving - check domain spelling or network" -ForegroundColor Yellow
    Write-Host "  Domain: serwer2581752.home.pl" -ForegroundColor Gray
}
elseif ($port22_ok -and -not $ssh_ok) {
    Write-Host "• SSH port open but connection failed" -ForegroundColor Yellow
    Write-Host "  Possible issues: wrong credentials, key auth required" -ForegroundColor Gray
}
elseif (-not $port22_ok -and $port443_ok) {
    Write-Host "• Server reachable but SSH port 22 is BLOCKED" -ForegroundColor Yellow
    Write-Host "  ISP or firewall is blocking SSH" -ForegroundColor Gray
    Write-Host "• Recommended: Use LOCAL Cloudflare tunnel instead" -ForegroundColor Green
    Write-Host "  Run: .\setup-cloudflared-local.ps1 -TunnelToken 'YOUR_TOKEN'" -ForegroundColor Cyan
}
elseif (-not $dns_ok -and -not $port22_ok) {
    Write-Host "• Server is unreachable" -ForegroundColor Yellow
    Write-Host "  Could be: ISP block, server down, DNS issue" -ForegroundColor Gray
    Write-Host "• Recommended: Use LOCAL Cloudflare tunnel instead" -ForegroundColor Green
    Write-Host "  Run: .\setup-cloudflared-local.ps1 -TunnelToken 'YOUR_TOKEN'" -ForegroundColor Cyan
}
elseif ($ssh_ok) {
    Write-Host "• SSH connection is working! Setup can proceed." -ForegroundColor Green
    Write-Host "• Run: .\setup-homepl-tunnel.ps1 -TunnelToken 'YOUR_TOKEN'" -ForegroundColor Cyan
}

Write-Host ""
