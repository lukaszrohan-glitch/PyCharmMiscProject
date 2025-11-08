@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🚀 Starting Arkuszownia SMB
echo   Domain: arkuszowniasmb.com
echo ═══════════════════════════════════════════════════════════
echo.

REM Check Docker
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running! Please start Docker Desktop.
    pause
    exit /b 1
)

REM Check cloudflared
if not exist "cloudflared.exe" (
    echo ❌ cloudflared.exe not found!
    pause
    exit /b 1
)

echo [1/3] 🐳 Starting Docker containers...
docker-compose up -d

echo.
echo [2/3] ⏳ Waiting for services (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo [3/3] 🌐 Starting Cloudflare Tunnel...
echo.
echo ═══════════════════════════════════════════════════════════
echo   ✅ READY!
echo.
echo   Your site is live at:
echo   📍 https://arkuszowniasmb.com
echo   📍 https://www.arkuszowniasmb.com
echo.
echo   Press Ctrl+C to stop the tunnel
echo ═══════════════════════════════════════════════════════════
echo.

cloudflared.exe tunnel --config cloudflared-config.yml run arkuszowniasmb

