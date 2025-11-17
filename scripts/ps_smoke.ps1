# PowerShell smoke tests for Arkuszownia SMB stack
param(
  [string]$Base = "http://localhost:8080",
  [string]$PublicBase = "",
  [switch]$VerboseLogs
)

$ErrorActionPreference = 'Stop'

function Section($name){ Write-Host "`n=== $name ===" -ForegroundColor Cyan }
function Ok($msg){ Write-Host "[OK] $msg" -ForegroundColor Green }
function Fail($msg){ Write-Host "[FAIL] $msg" -ForegroundColor Red; exit 1 }

Section "Compose status"
$ps = (docker-compose ps) 2>$null
if (-not $ps) { Fail "docker-compose not available" }
$ps | Write-Host

Section "DB health"
$pg = docker-compose exec db sh -lc "pg_isready -U smb_user -d smbtool" 2>$null
if ($LASTEXITCODE -ne 0) { Fail "Postgres not ready" } else { Ok $pg }

Section "Backend health (inside container)"
$bh = docker-compose exec backend sh -lc "curl -sS -f http://127.0.0.1:8000/healthz" 2>$null
if ($LASTEXITCODE -ne 0) { Fail "Backend /healthz failed" } else { Ok $bh }

Section "Nginx API health via /api"
$resp = Invoke-WebRequest "$Base/api/healthz" -UseBasicParsing
if ($resp.StatusCode -ne 200) { Fail "Nginx /api/healthz $($resp.StatusCode)" } else { Ok "/api/healthz -> $($resp.Content)" }

Section "Frontend root and assets"
$root = Invoke-WebRequest "$Base/" -UseBasicParsing
if ($root.StatusCode -ne 200) { Fail "GET / -> $($root.StatusCode)" }
$asset = ($root.Content | Select-String -Pattern '/assets/.*\.js' -AllMatches).Matches.Value | Select-Object -First 1
if (-not $asset) { Fail "No asset link found in index.html" }
$js = Invoke-WebRequest ("$Base$asset") -UseBasicParsing
if ($js.StatusCode -ne 200) { Fail "Asset $asset failed ($($js.StatusCode))" } else { Ok "Asset $asset served" }

Section "Cloudflared tunnel (logs)"
$logs = docker-compose logs cloudflared --tail=60 2>$null
$healthy = ($logs | Select-String -Pattern 'Registered tunnel connection').Matches.Count -gt 0
if ($healthy) { Ok "tunnel connected" } else { Fail "no tunnel connections seen in logs" }

if ($PublicBase -and $PublicBase.Trim() -ne "") {
  Section "Public host checks ($PublicBase)"
  try {
    $pr = Invoke-WebRequest "$PublicBase/" -UseBasicParsing -TimeoutSec 20
    Ok "Public / -> $($pr.StatusCode)"
    $ph = Invoke-WebRequest "$PublicBase/api/healthz" -UseBasicParsing -TimeoutSec 20
    if ($ph.StatusCode -ne 200) { Fail "Public /api/healthz -> $($ph.StatusCode)" } else { Ok "Public /api/healthz -> $($ph.Content)" }
  } catch {
    Fail "Public host failed: $($_.Exception.Message)"
  }
}

Ok "All smoke tests passed"
