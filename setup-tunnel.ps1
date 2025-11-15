# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Requesting administrator privileges..."
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`" $args"
    Exit
}

param(
    [string]$TunnelToken,
    [string]$SecondaryToken, # optional second token if using separate tunnel per hostname
    [string]$Domain = 'arkuszowniasmb.pl',
    [string]$WWWDomain = 'www.arkuszowniasmb.pl',
    [int]$OriginPort = 8080,
    [switch]$SkipAdHocTest,
    [switch]$ForceReinstall
)

if (-not $TunnelToken) {
    Write-Host "ERROR: You must supply -TunnelToken '<token>'" -ForegroundColor Red
    Write-Host "Example: powershell -File .\\setup-tunnel.ps1 -TunnelToken 'eyJh...'" -ForegroundColor Yellow
    exit 1
}

$WorkingDir = "C:\Users\lukas\PyCharmMiscProject"
Set-Location -Path $WorkingDir

Write-Host "Setting up Cloudflare tunnels..."

# Create .cloudflared directory
$CloudflaredDir = "$env:USERPROFILE\.cloudflared"
New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null

# Write minimal config for PRIMARY tunnel only (token auth ignores tunnel id/credentials)
$configPath = "$CloudflaredDir\config.yml"
@"
tunnel: $($TunnelToken.Substring(0,36))
credentials-file: "$CloudflaredDir\$($TunnelToken.Substring(0,36)).json"
loglevel: info
ingress:
  - hostname: $Domain
    service: http://localhost:$OriginPort
  - hostname: $WWWDomain
    service: http://localhost:$OriginPort
  - service: http_status:404
"@ | Out-File -FilePath $configPath -Encoding UTF8 -Force

Write-Host "Config written to $configPath"

# If a secondary token is provided, set up a separate tunnel for it
if ($SecondaryToken) {
    Write-Host "Setting up secondary tunnel..."
    $SecondaryConfigPath = "$CloudflaredDir\config-secondary.yml"
    @"
tunnel: $($SecondaryToken.Substring(0,36))
credentials-file: "$CloudflaredDir\$($SecondaryToken.Substring(0,36)).json"
loglevel: info
ingress:
  - hostname: smb2.$Domain
    service: http://localhost:$OriginPort
  - service: http_status:404
"@ | Out-File -FilePath $SecondaryConfigPath -Encoding UTF8 -Force
    Write-Host "Secondary config written to $SecondaryConfigPath"
}

Write-Host "Uninstalling any existing cloudflared services..."
if ($ForceReinstall) {
    & "$WorkingDir\cloudflared.exe" --config $configPath service uninstall | Out-Null
    Start-Sleep -Seconds 2
    if (Get-Service cloudflared -ErrorAction SilentlyContinue) { sc.exe delete cloudflared | Out-Null; Start-Sleep -Seconds 2 }

    if ($SecondaryToken) {
        & "$WorkingDir\cloudflared.exe" --config $SecondaryConfigPath service uninstall | Out-Null
        Start-Sleep -Seconds 2
        if (Get-Service cloudflared-secondary -ErrorAction SilentlyContinue) { sc.exe delete cloudflared-secondary | Out-Null; Start-Sleep -Seconds 2 }
    }
} else {
    Write-Host "Skipping forced uninstall (use -ForceReinstall to force)" -ForegroundColor Yellow
}

Write-Host "Installing cloudflared as a Windows service..."
& "$WorkingDir\cloudflared.exe" --config $configPath service install | Out-Null
Start-Sleep -Seconds 2

if ($SecondaryToken) {
    Write-Host "Installing secondary cloudflared service..."
    & "$WorkingDir\cloudflared.exe" --config $SecondaryConfigPath service install --name cloudflared-secondary | Out-Null
    Start-Sleep -Seconds 2
}

Write-Host "Starting cloudflared service(s)..."
try { Start-Service cloudflared -ErrorAction Stop } catch { Write-Host "Start-Service cloudflared failed: $($_.Exception.Message)" -ForegroundColor Red }
if ($SecondaryToken) {
    try { Start-Service cloudflared-secondary -ErrorAction Stop } catch { Write-Host "Start-Service cloudflared-secondary failed: $($_.Exception.Message)" -ForegroundColor Red }
}
Start-Sleep -Seconds 3
try { Restart-Service cloudflared -Force -ErrorAction Stop } catch { Write-Host "Restart failed (may still be starting): $($_.Exception.Message)" -ForegroundColor Yellow }
if ($SecondaryToken) {
    try { Restart-Service cloudflared-secondary -Force -ErrorAction Stop } catch { Write-Host "Secondary restart failed: $($_.Exception.Message)" -ForegroundColor Yellow }
}
Start-Sleep -Seconds 3
$svc = Get-Service cloudflared -ErrorAction SilentlyContinue
Write-Host "Primary Service Status: $($svc.Status)"
if ($SecondaryToken) {
    $svc2 = Get-Service cloudflared-secondary -ErrorAction SilentlyContinue
    Write-Host "Secondary Service Status: $($svc2.Status)"
}

Write-Host "Recent Application event log entries for cloudflared:" -ForegroundColor Cyan
Get-EventLog -LogName Application -Source cloudflared -Newest 30 -ErrorAction SilentlyContinue | Format-Table TimeGenerated,EntryType,Message -AutoSize
Write-Host "If status is Running, tunnel should be active. To double-check: .\\cloudflared.exe tunnel list OR inspect Zero Trust dashboard." -ForegroundColor Green

Write-Host "---"
Write-Host "Setup complete. Your site should be available at:"
Write-Host "   https://$Domain" -ForegroundColor Green
Write-Host "   https://$WWWDomain" -ForegroundColor Green
if ($SecondaryToken) {
    Write-Host "   https://smb2.$Domain" -ForegroundColor Green
}
Write-Host "   http://localhost:8088 (internal access)" -ForegroundColor Gray
