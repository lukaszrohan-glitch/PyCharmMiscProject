# setup-multi-tunnels.ps1 - robust multi / single token tunnel orchestration
param(
  [Parameter(Mandatory=$true)][string]$PrimaryToken,
  [string]$SecondaryToken,
  [string]$PrimaryDomain = 'arkuszowniasmb.pl',
  [string]$SecondaryDomain = 'www.arkuszowniasmb.pl',
  [int]$OriginPort = 8080,
  [switch]$ForceReinstall,
  [switch]$SkipAdHocTest,
  [switch]$RegisterSecondaryTask,
  [switch]$SingleTunnelMode,              # Use only primary token; both hostnames via single tunnel ingress.
  [switch]$SkipTimeSync,
  [switch]$SkipVersionCheck,
  [switch]$DryRun
)

if(-not $SingleTunnelMode -and [string]::IsNullOrWhiteSpace($SecondaryToken)){
  Write-Host 'SecondaryToken is required unless -SingleTunnelMode is specified.' -ForegroundColor Red
  exit 1
}

# Elevation (skip if DryRun)
if(-not $DryRun){
  if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Re-launching with elevation..." -ForegroundColor Yellow
    $args = @('-ExecutionPolicy','Bypass','-File',"$($MyInvocation.MyCommand.Path)",'-PrimaryToken',"$PrimaryToken",'-PrimaryDomain',"$PrimaryDomain",'-SecondaryDomain',"$SecondaryDomain",'-OriginPort',$OriginPort)
    if($SecondaryToken){ $args += @('-SecondaryToken',"$SecondaryToken") }
    if($ForceReinstall){ $args += '-ForceReinstall' }
    if($SkipAdHocTest){ $args += '-SkipAdHocTest' }
    if($RegisterSecondaryTask){ $args += '-RegisterSecondaryTask' }
    if($SingleTunnelMode){ $args += '-SingleTunnelMode' }
    if($SkipTimeSync){ $args += '-SkipTimeSync' }
    if($SkipVersionCheck){ $args += '-SkipVersionCheck' }
    if($DryRun){ $args += '-DryRun' }
    Start-Process powershell -Verb RunAs -ArgumentList $args
    exit
  }
} else { Write-Host 'DryRun: running without elevation.' -ForegroundColor DarkYellow }

$WorkDir = "C:\Users\lukas\PyCharmMiscProject"
Set-Location $WorkDir
$BaseDir = "$env:USERPROFILE\.cloudflared"
New-Item -ItemType Directory -Force -Path $BaseDir | Out-Null

$RunLog = Join-Path $BaseDir ("multi-tunnels-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
Start-Transcript -Path $RunLog -ErrorAction SilentlyContinue | Out-Null
function Write-Section($Title){ Write-Host "`n=== $Title ===" -ForegroundColor Cyan }

Write-Section 'Sanity Checks'
if(-not $SkipTimeSync){ try { w32tm /resync | Out-Null } catch { Write-Host "Time sync failed: $($_.Exception.Message)" -ForegroundColor Yellow } }
# Normalize version output (remove leading label); no '?' characters used
function Get-CloudflaredVersion(){
  try { (($(& "$WorkDir\cloudflared.exe" --version) -join ' ') -replace '^cloudflared version\s*','').Trim() } catch { 'unknown' }
}
$cfVer = Get-CloudflaredVersion; Write-Host "cloudflared version: $cfVer" -ForegroundColor Green
if(-not $SkipVersionCheck){ try { $latest = (Invoke-RestMethod -Uri 'https://api.github.com/repos/cloudflare/cloudflared/releases/latest').tag_name; if($latest -and $cfVer -ne $latest){ Write-Host "Update available: $latest (current $cfVer)." -ForegroundColor Yellow } } catch { Write-Host 'Release check failed.' -ForegroundColor Yellow } }

# Clean legacy named credentials (token mode only)
Get-ChildItem $BaseDir -Filter cert.* -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem $BaseDir -Filter *.json -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Token decode (best-effort)
function Decode-TokenInfo([string]$Token){ $parts = $Token.Split('.'); if($parts.Count -lt 3){ return @{Valid=$false;Reason='Not JWT'} }; try{ $payloadJson = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($parts[1] + '===').Substring(0,($parts[1]+'===').Length - (($parts[1].Length %4))))) }catch{ return @{Valid=$false;Reason='B64'} }; try{ $payload=$payloadJson|ConvertFrom-Json }catch{ return @{Valid=$false;Reason='JSON'} }; $exp= if($payload.exp){([DateTimeOffset]::FromUnixTimeSeconds([int64]$payload.exp)).LocalDateTime}; $nbf= if($payload.nbf){([DateTimeOffset]::FromUnixTimeSeconds([int64]$payload.nbf)).LocalDateTime}; @{Valid=$true;Exp=$exp;Nbf=$nbf;Raw=$payload} }
Write-Section 'Token Decoding'
foreach($pair in @{'Primary'=$PrimaryToken; 'Secondary'=$SecondaryToken}){ if(-not $pair.Value){ continue }; $info=Decode-TokenInfo $pair.Value; if(-not $info.Valid){ Write-Host "$($pair.Key) token format issue: $($info.Reason)" -ForegroundColor Red; continue }; Write-Host "$($pair.Key) exp=$($info.Exp) nbf=$($info.Nbf)" -ForegroundColor Green }

# Ingress config
function Write-IngressConfig($Path,[string[]]$Hosts){ $ing=@('loglevel: info','ingress:'); foreach($h in $Hosts){$ing+="  - hostname: $h"; $ing+="    service: http://localhost:$OriginPort"}; $ing+='  - service: http_status:404'; $ing -join "`n" | Out-File -FilePath $Path -Encoding UTF8 -Force }
$PrimaryCfg = Join-Path $BaseDir 'primary.yml'; $SecondaryCfg = Join-Path $BaseDir 'secondary.yml'
if($SingleTunnelMode){ Write-Host 'SingleTunnelMode: both hostnames via primary ingress.' -ForegroundColor Yellow; Write-IngressConfig $PrimaryCfg @($PrimaryDomain,$SecondaryDomain) } else { Write-IngressConfig $PrimaryCfg @($PrimaryDomain); Write-IngressConfig $SecondaryCfg @($SecondaryDomain) }

# Token test
function Test-Token([string]$Token){ if($DryRun){ return $true } $log=New-TemporaryFile; $err=New-TemporaryFile; $p=Start-Process -FilePath "$WorkDir\cloudflared.exe" -ArgumentList 'tunnel','--no-autoupdate','run','--token',"$Token" -PassThru -RedirectStandardOutput $log -RedirectStandardError $err; Start-Sleep 5; if($p.HasExited){ Write-Host 'Token test failed (exited).' -ForegroundColor Red; (Get-Content $err | Select -Last 20) | ForEach-Object {Write-Host $_}; return $false }; $p | Stop-Process -Force; Write-Host 'Token OK.' -ForegroundColor Green; return $true }
if(-not $SkipAdHocTest){ Write-Section 'Ad-hoc Token Tests'; if(-not (Test-Token $PrimaryToken)){ Write-Host 'Primary token invalid.' -ForegroundColor Red; Stop-Transcript | Out-Null; exit 1 }; if(-not $SingleTunnelMode -and $SecondaryToken){ if(-not (Test-Token $SecondaryToken)){ Write-Host 'Secondary token invalid.' -ForegroundColor Red; Stop-Transcript | Out-Null; exit 1 } } }

function Wait-ServiceStatus($Name,$Desired,$TimeoutSec=25){ $sw=[Diagnostics.Stopwatch]::StartNew(); while($sw.Elapsed.TotalSeconds -lt $TimeoutSec){ $svc=Get-Service $Name -ErrorAction SilentlyContinue; if($svc -and $svc.Status -eq $Desired){ return $true }; Start-Sleep 1 }; return $false }
function Reset-CloudflaredService([string]$Token){ if($DryRun){ Write-Host 'DryRun: skipping service changes' -ForegroundColor DarkYellow; return }; Write-Section 'Primary Service Install'; if($ForceReinstall){ Write-Host 'Force uninstalling existing service' -ForegroundColor Yellow; & "$WorkDir\cloudflared.exe" service uninstall | Out-Null; if(Get-Service cloudflared -ErrorAction SilentlyContinue){ sc.exe delete cloudflared | Out-Null; Start-Sleep 2 } }; & "$WorkDir\cloudflared.exe" service install "$Token" | Out-Null; Start-Sleep 2; try { Start-Service cloudflared -ErrorAction Stop } catch { Write-Host "Start-Service error: $($_.Exception.Message)" -ForegroundColor Red }; if(Wait-ServiceStatus 'cloudflared' 'Running'){ Write-Host 'cloudflared service Running' -ForegroundColor Green } else { Write-Host 'cloudflared service NOT running' -ForegroundColor Red }; Get-Service cloudflared -ErrorAction SilentlyContinue | Format-Table -AutoSize | Out-Host }

Reset-CloudflaredService $PrimaryToken

if(-not $SingleTunnelMode){
  Write-Section 'Secondary Tunnel (process)'
  if(-not $DryRun){
    $SecondaryLog=Join-Path $BaseDir 'secondary.log'; $SecondaryErr=Join-Path $BaseDir 'secondary.err'
    $global:SecondaryProc = Start-Process -FilePath "$WorkDir\cloudflared.exe" -ArgumentList 'tunnel','--no-autoupdate','run','--token',"$SecondaryToken" -PassThru -RedirectStandardOutput $SecondaryLog -RedirectStandardError $SecondaryErr
    Start-Sleep 5
    if($global:SecondaryProc.HasExited){ Write-Host 'Secondary tunnel exited.' -ForegroundColor Red; Get-Content $SecondaryErr | Select -Last 40 } else { Write-Host "Secondary tunnel PID $($global:SecondaryProc.Id) running" -ForegroundColor Green }
  } else { Write-Host 'DryRun: skipping secondary tunnel process' -ForegroundColor DarkYellow }

  if($RegisterSecondaryTask){
    Write-Section 'Register Scheduled Task'
    $taskScript = "$BaseDir\run-secondary-tunnel.ps1"
    $taskScriptContent = @"
`$token = '$SecondaryToken'
Start-Process -WindowStyle Hidden -FilePath '$WorkDir\cloudflared.exe' -ArgumentList @('tunnel','--no-autoupdate','run','--token',`$token)
"@
    $taskScriptContent | Out-File -FilePath $taskScript -Encoding UTF8 -Force

    schtasks /Delete /TN CloudflaredSecondaryTunnel /F 2>$null | Out-Null
    $taskCmd = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$taskScript`""
    schtasks /Create /SC ONSTART /TN CloudflaredSecondaryTunnel /RL HIGHEST /TR $taskCmd /F | Out-Null
    Write-Host 'Scheduled Task created.' -ForegroundColor Green
  }
} else {
  Write-Host 'Secondary tunnel skipped (SingleTunnelMode).' -ForegroundColor DarkGray
}

Write-Section 'Event Log Tail'; Get-EventLog -LogName Application -Source cloudflared -Newest 25 -ErrorAction SilentlyContinue | Select TimeGenerated,EntryType,Message | Format-Table -AutoSize | Out-Host

Write-Section 'Origin Port Check'; try { $resp=Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$OriginPort" -Method Head -TimeoutSec 5; Write-Host "Origin responded: $($resp.StatusCode)" -ForegroundColor Green } catch { Write-Host "Origin check failed: $($_.Exception.Message)" -ForegroundColor Yellow }

Write-Section 'Hostname DNS Resolution'; foreach($h in @($PrimaryDomain,$SecondaryDomain)){ try { [Net.Dns]::GetHostAddresses($h) | Out-Null; Write-Host "Host $h resolves" -ForegroundColor Green } catch { Write-Host "Host $h not resolving yet" -ForegroundColor Yellow } }

Write-Section 'Activation Guidance'
Write-Host @'
To ACTIVATE tunnels:
  1. In Zero Trust -> Networks -> Tunnels choose the PRIMARY tunnel (token used here).
  2. Add Public Hostnames:
       - Hostname: arkuszowniasmb.pl        Service: http://localhost:8080
       - Hostname: www.arkuszowniasmb.pl    Service: http://localhost:8080   (only if SingleTunnelMode)
  3. If dual mode: second tunnel gets only www.arkuszowniasmb.pl
  4. Cloudflare creates CNAMEs pointing to <UUID>.cfargotunnel.com. Verify in DNS.
  5. Propagation a few minutes; then test with:  curl -I https://arkuszowniasmb.pl/healthz
  6. Optional: later simplify by rotating token + using SingleTunnelMode.
'@ -ForegroundColor White

Write-Host 'Completed multi-tunnel setup.' -ForegroundColor Green
try { Stop-Transcript | Out-Null } catch {}
