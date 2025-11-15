@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Hybrid Setup: Docker (DB+Backend+Nginx) + Native Cloudflared
echo   Domena: arkuszowniasmb.pl
echo ============================================================
echo.

REM Sprawdź Docker
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker nie działa! Uruchom Docker Desktop.
    pause
    exit /b 1
)

REM Sprawdź cloudflared
if not exist "cloudflared.exe" (
    echo [ERROR] cloudflared.exe nie znaleziony!
    pause
    exit /b 1
)

REM Sprawdź config
if not exist "cloudflared-config-pl.yml" (
    echo [ERROR] cloudflared-config-pl.yml nie znaleziony!
    pause
    exit /b 1
)

REM Sprawdź .env
if not exist ".env" (
    echo [ERROR] .env nie znaleziony!
    pause
    exit /b 1
)

echo [1/5] Starting Docker containers (DB, Backend, Nginx)...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Błąd podczas uruchamiania Docker Compose!
    pause
    exit /b 1
)

echo.
echo [2/5] Waiting for initialization (20 seconds)...
ping -n 21 127.0.0.1 >nul

echo.
echo [3/5] Checking service status...
docker-compose ps

echo.
echo [4/5] Extracting tunnel token...
for /f "tokens=2 delims==" %%A in (
    'findstr /b "TUNNEL_TOKEN" .env'
) do set TUNNEL_TOKEN=%%A

if not defined TUNNEL_TOKEN (
    echo [ERROR] TUNNEL_TOKEN not found in .env!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   [OK] Services ready!
echo.
echo   Frontend: https://arkuszowniasmb.pl
echo   API Docs: https://arkuszowniasmb.pl/docs
echo   Admin: admin@arkuszowniasmb.pl / SMB#Admin2025!
echo.
echo   Starting Cloudflare Tunnel...
echo   Press Ctrl+C to stop
echo ============================================================
echo.

cloudflared.exe tunnel run --token %TUNNEL_TOKEN%
if errorlevel 1 (
    echo.
    echo [ERROR] Cloudflare Tunnel error. Verify:
    echo    - TUNNEL_TOKEN is correct in .env
    echo    - Tunnel is configured in Cloudflare
    echo.
)
