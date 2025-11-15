# Installs cloudflared as a Windows service (requires Administrator)
param(
  [string]$Name = 'cloudflared'
)

function Ensure-Admin {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
    Write-Host 'Re-launching with Administrator privileges...' -ForegroundColor Yellow
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'powershell.exe'
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Name `"$Name`""
    $psi.Verb = 'runas'
    [System.Diagnostics.Process]::Start($psi) | Out-Null
    exit 0
  }
}

Ensure-Admin

$root = Split-Path -Parent $PSCommandPath
$cfPath = Join-Path $root 'cloudflared.exe'
$configPath = Join-Path $root 'cloudflared-config.yml'

if (-not (Test-Path $cfPath)) { throw "cloudflared.exe not found at $cfPath" }
if (-not (Test-Path $configPath)) { throw "cloudflared-config.yml not found at $configPath" }

Write-Host "Installing '$Name' service..." -ForegroundColor Cyan

# Stop and delete if exists
sc.exe stop $Name | Out-Null 2>$null
Start-Sleep -Seconds 1
sc.exe delete $Name | Out-Null 2>$null
Start-Sleep -Seconds 1

# Create service
$bin = '"{0}" tunnel --config "{1}" run' -f $cfPath, $configPath
$create = sc.exe create $Name binPath= "$bin" start= auto DisplayName= "Cloudflared Tunnel"
$create | Out-Host

# Recover on crash
sc.exe failure $Name reset= 0 actions= restart/60000 | Out-Null
sc.exe failureflag $Name 1 | Out-Null

# Start service
sc.exe start $Name | Out-Host

Start-Sleep -Seconds 2
Write-Host 'Service status:' -ForegroundColor Cyan
sc.exe query $Name | Out-Host

Write-Host "Done. If STATE is RUNNING, the tunnel is active. Ensure DNS CNAME points to the tunnel ID." -ForegroundColor Green

