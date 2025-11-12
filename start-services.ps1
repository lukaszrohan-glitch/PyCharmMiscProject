# start-services.ps1 - orchestrates docker services and tunnel setup
param(
  [Parameter(Mandatory=$true)][string]$TunnelToken,
  [string]$PrimaryDomain = 'arkuszowniasmb.pl',
  [string]$SecondaryDomain = 'www.arkuszowniasmb.pl',
  [int]$OriginPort = 8080,
  [switch]$ForceReinstall,
  [switch]$SkipTimeSync,
  [switch]$SkipVersionCheck,
  [switch]$RemoveWindowsService,   # NEW: remove any pre-existing cloudflared Windows service
  [switch]$PruneDocker,            # NEW: prune dangling docker items before build
  [switch]$DryRun                  # perform only validation & summary
)

if([string]::IsNullOrWhiteSpace($TunnelToken)){
  Write-Host 'TunnelToken is required.' -ForegroundColor Red; exit 1
}

# Elevate if needed (skip elevation for DryRun to allow non-interactive validation)
if(-not $DryRun){
  if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Re-launching with elevation..." -ForegroundColor Yellow
    $args = @('-ExecutionPolicy','Bypass','-File',"$($MyInvocation.MyCommand.Path)",'-TunnelToken',"$TunnelToken",'-PrimaryDomain',"$PrimaryDomain",'-SecondaryDomain',"$SecondaryDomain",'-OriginPort',$OriginPort)
    if($ForceReinstall){ $args += '-ForceReinstall' }
    if($SkipTimeSync){ $args += '-SkipTimeSync' }
    if($SkipVersionCheck){ $args += '-SkipVersionCheck' }
    if($DryRun){ $args += '-DryRun' } # retained if user forces elevation
    Start-Process powershell -Verb RunAs -ArgumentList $args
    exit
  }
} else { Write-Host 'DryRun: running without elevation.' -ForegroundColor DarkYellow }

$RepoRoot = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location $RepoRoot

# Write .env with token for docker-compose cloudflared service (skip on DryRun)
if(-not $DryRun){
  $envPath = Join-Path $RepoRoot '.env'
  Set-Content -Path $envPath -Value @(
    "TUNNEL_TOKEN=$TunnelToken",
    "DATABASE_URL=postgresql://smb_user:smb_password@db:5432/smbtool",
    "CORS_ORIGINS=http://localhost:8080,https://$PrimaryDomain",
    "API_KEYS=dev-key-change",
    "ADMIN_KEY=admin-dev-change",
    "ALLOWED_HOSTS=localhost,127.0.0.1,$PrimaryDomain,$SecondaryDomain"
  ) -Encoding UTF8
  Write-Host ".env written." -ForegroundColor Green
} else { Write-Host 'DryRun: skipping .env write' -ForegroundColor DarkYellow }

# Call single-tunnel setup script
$tunnelScript = Join-Path $RepoRoot 'setup-single-tunnel.ps1'
if(-not (Test-Path $tunnelScript)){ Write-Host "Missing setup-single-tunnel.ps1" -ForegroundColor Red; exit 1 }

$commonArgs = @('-Token',"$TunnelToken",'-Domain',"$PrimaryDomain",'-WWWDomain',"$SecondaryDomain",'-OriginPort',$OriginPort)
if($ForceReinstall){ $commonArgs += '-ForceReinstall' }
if($SkipTimeSync){ $commonArgs += '-SkipTimeSync' } # retained for compatibility if script adds later
if($SkipVersionCheck){ $commonArgs += '-SkipVersionCheck' }
if($DryRun){ $commonArgs += '-DryRun'; $commonArgs += '-SkipAdHocTest' }

Write-Host "Executing single tunnel setup..." -ForegroundColor Cyan
if(-not $DryRun){ powershell -ExecutionPolicy Bypass -File $tunnelScript @commonArgs } else { Write-Host 'DryRun: skipping tunnel setup execution' -ForegroundColor DarkYellow }

# Optional removal of existing Windows cloudflared service to avoid conflicts with container cloudflared
if($RemoveWindowsService){
  Write-Host 'Checking for existing Windows cloudflared service...' -ForegroundColor Cyan
  $svc = Get-Service -Name cloudflared -ErrorAction SilentlyContinue
  if($svc){
    Write-Host 'Stopping cloudflared Windows service...' -ForegroundColor Yellow
    try { Stop-Service cloudflared -Force -ErrorAction Stop } catch { Write-Host "Stop-Service cloudflared failed: $($_.Exception.Message)" -ForegroundColor DarkYellow }
    Write-Host 'Uninstalling cloudflared Windows service...' -ForegroundColor Yellow
    $exePath = Join-Path (Split-Path $MyInvocation.MyCommand.Path -Parent) 'cloudflared.exe'
    if(Test-Path $exePath){ & $exePath service uninstall 2>$null }
    try { sc.exe delete cloudflared | Out-Null } catch {}
    Start-Sleep 2
    if(Get-Service cloudflared -ErrorAction SilentlyContinue){ Write-Host 'Service still present after attempted removal.' -ForegroundColor Red } else { Write-Host 'Windows cloudflared service removed.' -ForegroundColor Green }
  } else { Write-Host 'No Windows cloudflared service detected.' -ForegroundColor Green }
}

# Docker presence check
function Ensure-Docker(){ try { docker version --format '{{.Server.Version}}' | Out-Null; return $true } catch { return $false } }
if(-not $DryRun){
  if(-not (Ensure-Docker)){ Write-Host 'Docker not available. Install Docker Desktop first.' -ForegroundColor Red; exit 1 }
} else { Write-Host 'DryRun: skipping Docker checks' -ForegroundColor DarkYellow }

# Docker prune (optional) prior to build for a truly fresh rebuild
if($PruneDocker -and -not $DryRun){
  Write-Host 'Pruning unused docker objects (dangling images, networks, volumes)...' -ForegroundColor Yellow
  try { docker system prune -f --volumes | Out-Null } catch { Write-Host "Docker prune failed: $($_.Exception.Message)" -ForegroundColor DarkYellow }
}

if(-not $DryRun){
  Write-Host 'Building images...' -ForegroundColor Cyan
  try { docker compose build --no-cache | Out-Null } catch { Write-Host "docker compose build failed: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }

  Write-Host 'Starting services...' -ForegroundColor Cyan
  try { docker compose up -d | Out-Null } catch { Write-Host "docker compose up failed: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
}

# Wait for backend health
$backendHealthy = $false
if(-not $DryRun){
  Write-Host 'Waiting for backend health...' -ForegroundColor Cyan
  for($i=1;$i -le 60;$i++){
    $status = docker inspect -f '{{json .State.Health.Status}}' smb_backend 2>$null
    if($status -and $status -like '*healthy*'){ $backendHealthy = $true; break }
    Start-Sleep 2
  }
  if($backendHealthy){ Write-Host 'Backend healthy.' -ForegroundColor Green } else { Write-Host 'Backend not healthy after timeout.' -ForegroundColor Yellow }
} else { Write-Host 'DryRun: skipping backend health wait' -ForegroundColor DarkYellow }

# Verify nginx responds
if(-not $DryRun){
  Write-Host 'Testing nginx (port 8080)...' -ForegroundColor Cyan
  try { $resp = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8080/healthz' -Method Get -TimeoutSec 5; Write-Host "Nginx + backend health: $($resp.StatusCode)" -ForegroundColor Green } catch { Write-Host "Nginx test failed: $($_.Exception.Message)" -ForegroundColor Yellow }
} else { Write-Host 'DryRun: skipping nginx test' -ForegroundColor DarkYellow }

# Check frontend build assets existence
$frontendDist = Join-Path $RepoRoot 'frontend\dist'
if(Test-Path $frontendDist){ Write-Host "Frontend dist present." -ForegroundColor Green } else { Write-Host "Frontend dist missing (build may have failed)." -ForegroundColor Red }

# Tail cloudflared logs if container exists
if(-not $DryRun){
  if(docker ps --format '{{.Names}}' | Select-String -SimpleMatch 'smb_cloudflared'){
    Write-Host 'Cloudflared container running. Recent logs:' -ForegroundColor Cyan
    docker logs --tail 40 smb_cloudflared 2>&1 | ForEach-Object { Write-Host $_ }
  } else { Write-Host 'Cloudflared container not found.' -ForegroundColor Yellow }
} else { Write-Host 'DryRun: skipping cloudflared log tail' -ForegroundColor DarkYellow }

Write-Host 'Summary:' -ForegroundColor Cyan
$mode = 'Single'
Write-Host "  Backend:    $([string]$backendHealthy)" -ForegroundColor White
Write-Host "  CloudflaredContainerUsed: $([string](-not $DryRun))" -ForegroundColor White
Write-Host "  Domains:    $PrimaryDomain , $SecondaryDomain" -ForegroundColor White
Write-Host "  Mode:       $mode" -ForegroundColor White
Write-Host "  RemoveWinSvc: $([string]$RemoveWindowsService)" -ForegroundColor White
Write-Host "  PrunedDocker: $([string]$PruneDocker)" -ForegroundColor White
Write-Host "  DryRun:     $([string]$DryRun)" -ForegroundColor White

Write-Host 'Startup sequence complete. Configure public hostnames in Cloudflare dashboard if not already done.' -ForegroundColor Green
