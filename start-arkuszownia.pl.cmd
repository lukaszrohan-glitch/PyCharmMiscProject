@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════════
echo   🚀 Uruchamianie Arkuszownia SMB (.pl)
echo   Domena: arkuszowniasmb.pl
echo ═══════════════════════════════════════════════════════════
echo.

REM Sprawdź Docker
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker nie działa! Uruchom Docker Desktop.
    pause
    exit /b 1
)

REM Sprawdź cloudflared
if not exist "cloudflared.exe" (
    echo ❌ cloudflared.exe nie znaleziony!
    pause
    exit /b 1
)

echo [1/3] 🐳 Uruchamianie kontenerów Docker...
docker-compose up -d

echo.
echo [2/3] ⏳ Oczekiwanie na inicjalizację (15 sekund)...
timeout /t 15 /nobreak >nul

echo.
echo [3/3] 🌐 Uruchamianie Cloudflare Tunnel...
echo.
echo ═══════════════════════════════════════════════════════════
echo   ✅ GOTOWE!
echo.
echo   Twoja strona będzie dostępna pod adresem:
echo   📍 https://arkuszowniasmb.pl
echo   📍 https://www.arkuszowniasmb.pl
echo.
echo   Naciśnij Ctrl+C aby zatrzymać tunel
echo ═══════════════════════════════════════════════════════════
echo.

cloudflared.exe tunnel --config cloudflared-config-pl.yml run arkuszowniasmb-pl

