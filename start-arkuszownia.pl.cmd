@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo   Uruchamianie Arkuszownia SMB (.pl)
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

REM Sprawdź config pliki
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

echo [1/4] Uruchamianie kontenerow Docker...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Błąd podczas uruchamiania Docker Compose!
    pause
    exit /b 1
)

echo.
echo [2/4] Oczekiwanie na inicjalizację (20 sekund)...
ping -n 21 127.0.0.1 >nul

echo.
echo [3/4] Sprawdzanie statusu usług...
docker-compose ps

echo.
echo [4/4] Uruchamianie Cloudflare Tunnel...
echo.
echo ============================================================
echo   [OK] Serwer uruchomiony!
echo.
echo   Twoja strona będzie dostępna pod adresem:
echo   > https://arkuszowniasmb.pl
echo   > https://www.arkuszowniasmb.pl
echo.
echo   Backend: http://localhost:8000 (wewnątrz sieci)
echo   Frontend: http://localhost:8088
echo.
echo   Nacisnij Ctrl+C aby zatrzymać tunel
echo ============================================================
echo.

for /f "tokens=2 delims==" %%A in (
    'findstr /b "TUNNEL_TOKEN" .env'
) do set TUNNEL_TOKEN=%%A

if not defined TUNNEL_TOKEN (
    echo [ERROR] TUNNEL_TOKEN nie znaleziony w .env!
    pause
    exit /b 1
)

cloudflared.exe tunnel run --token %TUNNEL_TOKEN%
if errorlevel 1 (
    echo.
    echo [ERROR] Błąd Cloudflare Tunnel. Upewnij się że:
    echo    - Token jest poprawny w .env (TUNNEL_TOKEN)
    echo    - Tunel jest skonfigurowany w Cloudflare
    echo.
)

