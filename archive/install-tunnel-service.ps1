Write-Host "Installing Cloudflare Tunnel Service..." -ForegroundColor Cyan

# Ensure we're elevated
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting admin rights..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait
    exit
}

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cf = Join-Path $root 'cloudflared.exe'
$config = Join-Path $root 'cloudflared-config.yml'
$logFile = "C:\ProgramData\Cloudflare\cloudflared\tunnel.log"

# Validate files
if (-not (Test-Path $cf)) { throw "cloudflared.exe not found at $cf" }
if (-not (Test-Path $config)) { throw "Config not found at $config" }

# Ensure ProgramData paths
$credDir = "C:\ProgramData\Cloudflare\cloudflared"
$credFile = Join-Path $credDir "9320212e-f379-4261-8777-f9623823beee.json"
$null = New-Item -ItemType Directory -Force -Path $credDir

# Copy credentials if needed
$userCred = Join-Path $env:USERPROFILE ".cloudflared\9320212e-f379-4261-8777-f9623823beee.json"
if (Test-Path $userCred) {
    Copy-Item $userCred $credFile -Force
    Write-Host "Copied credentials to $credFile" -ForegroundColor Green
}

# Set proper permissions
$acl = Get-Acl $credDir
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("NT AUTHORITY\SYSTEM", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $credDir $acl
Set-Acl $credFile $acl

Write-Host "Killing any existing cloudflared processes..." -ForegroundColor Yellow
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Removing old service..." -ForegroundColor Yellow
$null = & sc.exe delete cloudflared 2>&1
Start-Sleep -Seconds 2

Write-Host "Creating service..." -ForegroundColor Yellow
$binPath = """$cf"" tunnel --config ""$config"" run --loglevel info --logfile ""$logFile"""
$result = & sc.exe create cloudflared binPath= $binPath start= auto obj= "LocalSystem" DisplayName= "Cloudflare Tunnel"
Write-Host $result

Write-Host "Setting recovery options..." -ForegroundColor Yellow
$null = & sc.exe failure cloudflared reset= 0 actions= restart/60000/restart/60000/restart/60000
$null = & sc.exe failureflag cloudflared 1

Write-Host "Starting service..." -ForegroundColor Yellow
Start-Service cloudflared
Start-Sleep -Seconds 5

$service = Get-Service cloudflared
if ($service.Status -eq 'Running') {
    Write-Host "`nSuccess! Cloudflare Tunnel service is running." -ForegroundColor Green

    # Test local origin
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1/healthz" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "Local origin test: OK (HTTP 200)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Local origin test failed: $_" -ForegroundColor Red
    }

    Write-Host "`nYour site should be available at: https://arkuszowniasmb.pl" -ForegroundColor Cyan
    Write-Host "If not accessible, check Event Viewer and $logFile" -ForegroundColor Yellow
} else {
    Write-Host "`nWarning: Service not running. Status: $($service.Status)" -ForegroundColor Red
    Write-Host "Check logs at: $logFile" -ForegroundColor Yellow
    Write-Host "And Event Viewer -> Windows Logs -> Application" -ForegroundColor Yellow
}

Write-Host "`nService Status:" -ForegroundColor Cyan
& sc.exe query cloudflared | Out-Host

Write-Host "`nTunnel Log:" -ForegroundColor Cyan
if (Test-Path $logFile) {
    Get-Content $logFile -Tail 10
}
