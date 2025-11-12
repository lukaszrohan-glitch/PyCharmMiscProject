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
    Write-Host "Example: powershell -File setup-tunnel.ps1 -TunnelToken 'CwI0C09V...'
Optionally add -SecondaryToken '<token2>' for a second tunnel." -ForegroundColor Yellow
    exit 1
}

$WorkingDir = "C:\Users\lukas\PyCharmMiscProject"
Set-Location -Path $WorkingDir

Write-Host "Setting up Cloudflare tunnel using token (no legacy credentials)..."

# Create .cloudflared directory
$CloudflaredDir = "$env:USERPROFILE\.cloudflared"
New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null

# Remove legacy credential artifacts that can conflict
Get-ChildItem $CloudflaredDir -Filter cert.* -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem $CloudflaredDir -Filter *.json -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Decide operating mode: single tunnel with two hostnames vs two independent tunnels.
if ($SecondaryToken) {
    Write-Host "Secondary token detected: will run second cloudflared instance for $WWWDomain" -ForegroundColor Cyan
}

# Write minimal config for PRIMARY tunnel only (token auth ignores tunnel id/credentials)
$configPath = "$CloudflaredDir\config.yml"
@"
loglevel: info
ingress:
  - hostname: $Domain
    service: http://localhost:$OriginPort
  - hostname: $WWWDomain
    service: http://localhost:$OriginPort
  - service: http_status:404
"@ | Out-File -FilePath $configPath -Encoding UTF8 -Force

Write-Host "Config written to $configPath"

Write-Host "Uninstalling any existing cloudflared service..."
if ($ForceReinstall) {
    & "$WorkingDir\cloudflared.exe" service uninstall | Out-Null
    Start-Sleep -Seconds 2
    if (Get-Service cloudflared -ErrorAction SilentlyContinue) { sc.exe delete cloudflared | Out-Null; Start-Sleep -Seconds 2 }
} else {
    Write-Host "Skipping forced uninstall (omit -ForceReinstall to keep existing)" -ForegroundColor Yellow
}

if (-not $SkipAdHocTest) {
    Write-Host "Testing ad-hoc tunnel run (no service) to validate primary token..."
    $testProcess = Start-Process -FilePath "$WorkingDir\cloudflared.exe" -ArgumentList "tunnel","--no-autoupdate","run","--token","$TunnelToken" -PassThru -RedirectStandardOutput "$CloudflaredDir\adhoc.log" -RedirectStandardError "$CloudflaredDir\adhoc.err"
    Start-Sleep -Seconds 6
    if ($testProcess.HasExited) {
        Write-Host "Ad-hoc run exited early. Showing last 40 lines:" -ForegroundColor Red
        Get-Content "$CloudflaredDir\adhoc.err" -ErrorAction SilentlyContinue | Select-Object -Last 40
        Get-Content "$CloudflaredDir\adhoc.log" -ErrorAction SilentlyContinue | Select-Object -Last 40
        Write-Host "Fix token or system clock; aborting." -ForegroundColor Red
        exit 1
    } else { $testProcess | Stop-Process -Force }
} else { Write-Host "SkipAdHocTest requested; proceeding directly to service install." }

Write-Host "Installing cloudflared as a Windows service with primary token..."
& "$WorkingDir\cloudflared.exe" service install "$TunnelToken" | Out-Null
Start-Sleep -Seconds 2

Write-Host "Starting cloudflared service (primary)..."
try { Start-Service cloudflared -ErrorAction Stop } catch { Write-Host "Start-Service cloudflared failed: $($_.Exception.Message)" -ForegroundColor Red }
Start-Sleep -Seconds 3
try { Restart-Service cloudflared -Force -ErrorAction Stop } catch { Write-Host "Restart failed (may still be starting): $($_.Exception.Message)" -ForegroundColor Yellow }
Start-Sleep -Seconds 3
$svc = Get-Service cloudflared -ErrorAction SilentlyContinue
Write-Host "Primary service Status: $($svc.Status)"

if ($SecondaryToken) {
    Write-Host "Launching secondary tunnel (no Windows service; independent process) for $WWWDomain" -ForegroundColor Cyan
    $secondaryLog = "$CloudflaredDir\secondary.log"
    $secondaryErr = "$CloudflaredDir\secondary.err"
    $global:SecondaryProc = Start-Process -FilePath "$WorkingDir\cloudflared.exe" -ArgumentList "tunnel","--no-autoupdate","run","--token","$SecondaryToken" -PassThru -RedirectStandardOutput $secondaryLog -RedirectStandardError $secondaryErr
    Start-Sleep -Seconds 5
    if ($global:SecondaryProc.HasExited) {
        Write-Host "Secondary tunnel failed immediately:" -ForegroundColor Red
        Get-Content $secondaryErr -ErrorAction SilentlyContinue | Select-Object -Last 40
    } else { Write-Host "Secondary tunnel process running (PID $($global:SecondaryProc.Id))" -ForegroundColor Green }
}

Write-Host "Recent Application event log entries for cloudflared:" -ForegroundColor Cyan
Get-EventLog -LogName Application -Source cloudflared -Newest 30 -ErrorAction SilentlyContinue | Format-Table TimeGenerated,EntryType,Message -AutoSize
Write-Host "If status is Running, tunnel should be active. To double-check: .\\cloudflared.exe tunnel list OR inspect Zero Trust dashboard." -ForegroundColor Green
