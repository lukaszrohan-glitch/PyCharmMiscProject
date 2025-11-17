# PowerShell script to run E2E locally on Windows
$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $Root\..
Write-Host "Starting docker-compose..."
docker-compose up -d --build

Write-Host "Waiting for backend http://localhost:8000/healthz ..."
$max = 60
for ($i=0; $i -lt $max; $i++) {
    try {
        $resp = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:8000/healthz -Method GET -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { Write-Host "backend ready"; break }
    } catch { }
    Start-Sleep -Seconds 2
}

if ($resp -eq $null -or $resp.StatusCode -ne 200) {
    Write-Host "Backend not ready" -ForegroundColor Red
    docker-compose logs web
    docker-compose down -v
    exit 1
}

Set-Location frontend
npm install
npx playwright install --with-deps
npx playwright test --config=..\tests\e2e\playwright.config.js

Set-Location $Root\..
docker-compose down -v

