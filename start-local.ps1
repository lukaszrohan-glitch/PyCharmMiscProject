param(
    [switch]$ForceSQLite
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
    Write-Host "[local] $msg" -ForegroundColor Cyan
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if (Test-Path .env -PathType Leaf) {
    Write-Info "Wczytuję zmienne z .env"
    Get-Content .env | Where-Object { $_ -and ($_ -notmatch '^#') } | ForEach-Object {
        $pair = $_.Split('=',2)
        if ($pair.Length -eq 2) {
            [System.Environment]::SetEnvironmentVariable($pair[0], $pair[1])
        }
    }
} else {
    Write-Warning ".env nie istnieje - uruchomienie może się nie udać"
}

$venvActivate = Join-Path $projectRoot '.venv\Scripts\Activate.ps1'
if (Test-Path $venvActivate) {
    Write-Info "Aktywuję .venv"
    . $venvActivate
} else {
    Write-Warning ".venv nie znaleziono - pomijam"
}

if ($ForceSQLite) {
    $env:FORCE_SQLITE = '1'
    Write-Info "Wymuszono tryb SQLite"
}

Write-Info "Uruchamiam backend (uvicorn)"
$backendJob = Start-Job -Name synterra-backend -ScriptBlock {
    param($proj)
    Set-Location $proj
    uvicorn main:app --reload --port 8000
} -ArgumentList $projectRoot

Start-Sleep -Seconds 2

Write-Info "Uruchamiam frontend preview"
Push-Location frontend
$preview = Start-Process npm -ArgumentList 'run','preview','--','--host=localhost','--port=4174' -PassThru
Pop-Location

Write-Info "Otwieram przeglądarkę"
Start-Process http://localhost:4174/

Write-Info "Naciśnij Ctrl+C aby zakończyć (frontend)"
try {
    Wait-Process -Id $preview.Id
} finally {
    Write-Info "Zatrzymuję backend job"
    if (Get-Job -Name synterra-backend -ErrorAction SilentlyContinue) {
        Stop-Job -Name synterra-backend
        Remove-Job -Name synterra-backend
    }
}

