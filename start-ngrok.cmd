@echo off
REM Ultra-prosty skrypt do udostepnienia aplikacji publicznie przez Ngrok
REM Ultra-simple script to share app publicly via Ngrok

echo.
echo ========================================
echo   NGROK PUBLIC ACCESS SETUP
echo   Udostepnianie Aplikacji Publicznie
echo ========================================
echo.

REM Sprawdz czy ngrok istnieje
if not exist "ngrok.exe" (
    echo [ERROR] ngrok.exe nie znaleziony w tym folderze!
    echo [ERROR] ngrok.exe not found in this folder!
    echo.
    echo Pobierz z / Download from: https://ngrok.com/download
    echo Wypakuj ngrok.exe do tego folderu / Extract ngrok.exe to this folder
    echo.
    pause
    exit /b 1
)

REM Sprawdz czy Docker dziala
docker version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker nie dziala! Uruchom Docker Desktop.
    echo [ERROR] Docker is not running! Start Docker Desktop.
    pause
    exit /b 1
)

echo [1/5] Uruchamianie aplikacji / Starting application...
docker compose up -d

echo.
echo [2/5] Czekanie na inicjalizacje (15 sekund)...
echo       Waiting for initialization (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo [3/5] Uruchamianie Ngrok dla Frontendu...
echo       Starting Ngrok for Frontend...
start "Ngrok Frontend (Port 5173)" cmd /k "ngrok http 5173"

timeout /t 3 /nobreak >nul

echo.
echo [4/5] Uruchamianie Ngrok dla Backendu...
echo       Starting Ngrok for Backend...
start "Ngrok Backend (Port 8000)" cmd /k "ngrok http 8000"

echo.
echo [5/5] GOTOWE! / DONE!
echo.
echo ========================================
echo   INSTRUKCJE / INSTRUCTIONS
echo ========================================
echo.
echo 1. Sprawdz okno "Ngrok Frontend" - skopiuj HTTPS link
echo    Check "Ngrok Frontend" window - copy the HTTPS link
echo    Przyklad: https://abc-123-xyz.ngrok-free.app
echo.
echo 2. Sprawdz okno "Ngrok Backend" - skopiuj HTTPS link
echo    Check "Ngrok Backend" window - copy the HTTPS link
echo    Przyklad: https://def-456-uvw.ngrok-free.app
echo.
echo 3. Edytuj plik .env i dodaj:
echo    Edit .env file and add:
echo    VITE_API_BASE=https://TWOJ-BACKEND-LINK.ngrok-free.app/api
echo.
echo 4. Uruchom: docker compose restart frontend
echo    Run: docker compose restart frontend
echo.
echo 5. UDOSTEPNIJ link frontend znajomym!
echo    SHARE the frontend link with friends!
echo.
echo ========================================
echo.
echo Aby zatrzymac / To stop: Ctrl+C w oknach Ngrok
echo.
pause

