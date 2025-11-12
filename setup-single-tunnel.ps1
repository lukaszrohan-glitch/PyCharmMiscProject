param(
  [Parameter(Mandatory=$true)][string]$Token,
  [string]$Domain = 'arkuszowniasmb.pl',
  [string]$WWWDomain = 'www.arkuszowniasmb.pl',
  [int]$OriginPort = 8080,
  [switch]$ForceReinstall,
  [switch]$SkipAdHocTest,
  [switch]$DryRun
)

# Elevate if not admin (unless DryRun)
if(-not $DryRun){
  if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Elevating..." -ForegroundColor Yellow
    $args = @('-ExecutionPolicy','Bypass','-File',"$($MyInvocation.MyCommand.Path)",'-Token',"$Token",'-Domain',"$Domain",'-WWWDomain',"$WWWDomain",'-OriginPort',$OriginPort)
    if($ForceReinstall){ $args += '-ForceReinstall' }
    if($SkipAdHocTest){ $args += '-SkipAdHocTest' }
    if($DryRun){ $args += '-DryRun' }
    Start-Process powershell -Verb RunAs -ArgumentList $args
    exit
  }
} else { Write-Host 'DryRun: no elevation.' -ForegroundColor DarkYellow }

$Repo = Split-Path $MyInvocation.MyCommand.Path -Parent
$Exe  = Join-Path $Repo 'cloudflared.exe'
if(-not (Test-Path $Exe)){ Write-Host 'cloudflared.exe not found in repo root.' -ForegroundColor Red; exit 1 }

$CfgDir = "$env:USERPROFILE\.cloudflared"
New-Item -ItemType Directory -Force -Path $CfgDir | Out-Null
# Remove legacy named credentials (token mode doesn't need cert.pem / *.json)
Get-ChildItem $CfgDir -Filter cert.* -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem $CfgDir -Filter *.json  -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Write ingress config (optional; token auth ignores tunnel id fields) - both hostnames served from same origin
$cfgPath = Join-Path $CfgDir 'config.yml'
@"
loglevel: info
ingress:
  - hostname: $Domain
    service: http://localhost:$OriginPort
  - hostname: $WWWDomain
    service: http://localhost:$OriginPort
  - service: http_status:404
"@ | Out-File -FilePath $cfgPath -Encoding UTF8 -Force
Write-Host "Ingress config created at $cfgPath" -ForegroundColor Green

function Test-Token(){ param([string]$T) if($DryRun -or $SkipAdHocTest){ return $true } Write-Host 'Performing 5s ad-hoc run test...' -ForegroundColor Cyan; $log=New-TemporaryFile; $err=New-TemporaryFile; $p=Start-Process -FilePath $Exe -ArgumentList 'tunnel','--no-autoupdate','run','--token',"$T" -PassThru -RedirectStandardOutput $log -RedirectStandardError $err; Start-Sleep 5; if($p.HasExited){ Write-Host 'Token test failed (process exited).' -ForegroundColor Red; (Get-Content $err | Select -Last 25) | ForEach-Object {Write-Host $_}; return $false }; $p | Stop-Process -Force; Write-Host 'Token test passed.' -ForegroundColor Green; return $true }
if(-not (Test-Token $Token)){ Write-Host 'Aborting due to failed token test.' -ForegroundColor Red; exit 1 }

if($DryRun){ Write-Host 'DryRun: skipping service install.' -ForegroundColor DarkYellow; exit 0 }

if($ForceReinstall){ Write-Host 'Force uninstalling existing service...' -ForegroundColor Yellow; & $Exe service uninstall | Out-Null; if(Get-Service cloudflared -ErrorAction SilentlyContinue){ sc.exe delete cloudflared | Out-Null; Start-Sleep 2 } }

Write-Host 'Installing cloudflared Windows service (single token)...' -ForegroundColor Cyan
& $Exe service install "$Token" | Out-Null
Start-Sleep 2
Write-Host 'Starting service...' -ForegroundColor Cyan
try { Start-Service cloudflared -ErrorAction Stop } catch { Write-Host "Start-Service failed: $($_.Exception.Message)" -ForegroundColor Red }
Start-Sleep 3
$svc = Get-Service cloudflared -ErrorAction SilentlyContinue
Write-Host "Service status: $($svc.Status)" -ForegroundColor Green
Write-Host @"
Next steps:
Write-Host @"Next steps:
  1. In Zero Trust -> Networks -> Tunnels select the tunnel for this token.
  2. Add Public Hostnames:
       $Domain  -> http://localhost:$OriginPort
       $WWWDomain -> http://localhost:$OriginPort
  3. Cloudflare will create CNAMEs pointing to <UUID>.cfargotunnel.com; verify DNS.
  4. Test after propagation:  curl -I https://$Domain/healthz
"@ -ForegroundColor White

