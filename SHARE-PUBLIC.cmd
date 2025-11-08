@echo off
chcp 65001 >nul
REM ========================================
REM   MAKE APP PUBLICLY AVAILABLE
REM ========================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   🌐 MAKE APP PUBLICLY AVAILABLE                          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if cloudflared exists
if not exist "cloudflared.exe" (
    echo ❌ ERROR: cloudflared.exe not found!
    echo.
    echo 📥 Download cloudflared from: https://github.com/cloudflare/cloudflared/releases
    echo.
    echo 📁 Extract cloudflared-windows-amd64.exe to this folder as cloudflared.exe:
    echo    %CD%
    echo.
    echo 🔑 Then run:
    echo    cloudflared.exe tunnel login
    echo    cloudflared.exe tunnel create my-app
    echo.
    echo 💡 Full guide at: PUBLIC_ACCESS.md
    echo.
    pause
    exit /b 1
)

REM Check if config file exists
if not exist "cloudflared-config.yml" (
    echo ❌ ERROR: cloudflared-config.yml not found!
    echo.
    echo 📝 You need to create tunnel and config file first.
    echo.
    echo 🔧 Run these commands:
    echo    cloudflared.exe tunnel login
    echo    cloudflared.exe tunnel create my-app
    echo.
    echo 📖 See instructions in: PUBLIC_ACCESS.md
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Docker is not running!
    echo.
    echo 🐳 Start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo ✅ All requirements met!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo [1/3] 🐳 Starting application...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ❌ Application startup failed!
    pause
    exit /b 1
)

echo.
echo [2/3] ⏳ Waiting for initialization (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo [3/3] 🚀 Starting Cloudflare tunnel...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✅ DONE! Application is now PUBLIC!
echo.
echo 📋 INSTRUCTIONS:
echo.
echo    1️⃣  Your permanent link is:
echo       https://my-app.trycloudflare.com (or your domain)
echo.
echo    2️⃣  Send this link to your users via email/SMS/chat
echo.
echo    3️⃣  Users JUST CLICK THE LINK and the app works!
echo       No installation, no configuration needed!
echo.
echo 💡 BENEFIT: Link DOESN'T CHANGE every time you restart!
echo.
echo 🛑 To stop: Press Ctrl+C in this window
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Run Cloudflare Tunnel
cloudflared.exe tunnel --config cloudflared-config.yml run arkuszowniasmb

