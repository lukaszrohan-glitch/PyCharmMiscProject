@echo off
echo Testing Docker and Tunnel components...

REM Test 1: Docker
echo Testing Docker containers...
docker-compose ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker containers not running!
    echo Starting them now...
    docker-compose up -d
    timeout /t 10 /nobreak >nul
)

REM Test 2: Nginx
echo Testing Nginx...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/healthz' -UseBasicParsing; if ($r.StatusCode -eq 200) { Write-Host 'OK: Nginx responding' -ForegroundColor Green } } catch { Write-Host 'ERROR: Nginx not responding!' -ForegroundColor Red }"

REM Test 3: Tunnel Config
echo.
echo Testing tunnel configuration...
if not exist "cloudflared-config.yml" (
    echo ERROR: cloudflared-config.yml missing!
    exit /b 1
)
echo OK: Config file exists

REM Test 4: Credentials
if not exist "%USERPROFILE%\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json" (
    echo ERROR: Tunnel credentials missing!
    exit /b 1
)
echo OK: Credentials found

REM Test 5: cloudflared
if not exist "cloudflared.exe" (
    echo ERROR: cloudflared.exe missing!
    exit /b 1
)
echo OK: cloudflared.exe found

echo.
echo All components ready. Run run-tunnel.cmd to start the tunnel.
pause
