
@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo           MAKE APP PUBLICLY AVAILABLE (QUICK TUNNEL)
echo ================================================================
echo.

REM Check if cloudflared exists
if not exist "cloudflared.exe" (
    echo [ERROR] cloudflared.exe not found in the current directory.
    echo Please download it from the Cloudflare Zero Trust dashboard.
    pause
    exit /b 1
)

echo [1/2] Stopping any existing tunnel processes...
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 >nul
echo      Done.

echo.
echo [2/2] Starting new Cloudflare quick tunnel for http://localhost:8000
echo.
echo Your backend API will be shared publicly.
echo A public URL will be generated below.
echo Keep this window open to maintain the connection.
