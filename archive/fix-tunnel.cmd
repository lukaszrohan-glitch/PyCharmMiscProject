@echo off
echo ========================================
echo Cloudflare Tunnel Quick Fix Script
echo ========================================
echo.

REM Stop any running tunnels
echo [1/5] Stopping existing tunnel processes...
taskkill /IM cloudflared.exe /F >nul 2>&1
timeout /t 3 >nul

REM Test local nginx
echo [2/5] Testing local nginx...
curl -s http://localhost:80 >nul 2>&1
if %errorlevel%==0 (
    echo     [OK] Nginx is responding
) else (
    echo     [ERROR] Nginx is not responding!
    pause
    exit /b 1
)

REM Check Docker containers
echo [3/5] Checking Docker containers...
docker-compose ps | findstr /C:"Up" >nul
if %errorlevel%==0 (
    echo     [OK] Docker containers running
) else (
    echo     [WARNING] Some containers may not be running
)

REM Start tunnel with verbose logging
echo [4/5] Starting Cloudflare tunnel...
start /min powershell -NoExit -Command "cd '%~dp0'; Write-Host 'Cloudflare Tunnel Starting...' -ForegroundColor Green; .\cloudflared.exe tunnel --config cloudflared-config-pl.yml run"
timeout /t 10 >nul

REM Check tunnel status
echo [5/5] Verifying tunnel...
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | find /I /N "cloudflared.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo     [OK] Tunnel is running
) else (
    echo     [ERROR] Tunnel failed to start!
    pause
    exit /b 1
)

echo.
echo ========================================
echo TUNNEL STATUS: RUNNING
echo ========================================
echo.
echo IMPORTANT: You must configure DNS in Cloudflare Dashboard!
echo.
echo Step 1: Go to https://dash.cloudflare.com
echo Step 2: Select domain: arkuszowniasmb.pl
echo Step 3: Go to DNS tab
echo Step 4: Add CNAME record:
echo     Type: CNAME
echo     Name: @ (or arkuszowniasmb.pl)
echo     Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com
echo     Proxy: ON (orange cloud)
echo.
echo Step 5: Wait 2-3 minutes for DNS to propagate
echo Step 6: Test: https://arkuszowniasmb.pl
echo.
echo Press any key to open Cloudflare Dashboard...
pause >nul
start https://dash.cloudflare.com
echo.
echo Tunnel will continue running in the background.
echo To stop: Run this script again or use manage-tunnel.cmd
echo.
pause

