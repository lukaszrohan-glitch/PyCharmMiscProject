@echo off
echo Checking and starting Cloudflare tunnel...

REM Kill any existing cloudflared processes
taskkill /F /IM cloudflared.exe 2>nul
timeout /t 2 /nobreak >nul

REM Change to script directory
cd /d %~dp0

REM Verify config exists
if not exist "cloudflared-config.yml" (
    echo ERROR: cloudflared-config.yml not found!
    pause
    exit /b 1
)

REM Verify credentials exist
if not exist "%USERPROFILE%\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json" (
    echo ERROR: Tunnel credentials not found!
    echo Expected: %USERPROFILE%\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json
    pause
    exit /b 1
)

REM Verify cloudflared exists
if not exist "cloudflared.exe" (
    echo ERROR: cloudflared.exe not found!
    pause
    exit /b 1
)

REM Check if containers are running
docker-compose ps >nul 2>&1
if errorlevel 1 (
    echo Starting Docker containers...
    docker-compose up -d
    timeout /t 10 /nobreak >nul
)

REM Start tunnel with debug logging
echo Starting tunnel...
echo Your site will be available at: https://arkuszowniasmb.pl
echo.
echo Keep this window open to maintain the connection.
echo Press Ctrl+C to stop the tunnel.
echo.
cloudflared.exe tunnel --config cloudflared-config.yml run
