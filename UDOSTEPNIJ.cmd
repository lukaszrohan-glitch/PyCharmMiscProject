@echo off
chcp 65001 >nul
REM ========================================
REM   UDOSTĘPNIJ APLIKACJĘ PUBLICZNIE
REM   Make App Publicly Available
REM ========================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   🌐 UDOSTĘPNIANIE APLIKACJI DLA UŻYTKOWNIKÓW             ║
echo ║      Making App Available for Users                       ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Sprawdź czy cloudflared istnieje
if not exist "cloudflared.exe" (
    echo ❌ BŁĄD: cloudflared.exe nie został znaleziony!
    echo    ERROR: cloudflared.exe not found!
    echo.
    echo 📥 Pobierz cloudflared z: https://github.com/cloudflare/cloudflared/releases
    echo    Download cloudflared from: https://github.com/cloudflare/cloudflared/releases
    echo.
    echo 📁 Wypakuj cloudflared-windows-amd64.exe do tego folderu jako cloudflared.exe:
    echo    Extract cloudflared-windows-amd64.exe to this folder as cloudflared.exe:
    echo    %CD%
    echo.
    echo 🔑 Następnie uruchom:
    echo    Then run:
    echo    cloudflared.exe tunnel login
    echo    cloudflared.exe tunnel create moja-aplikacja
    echo.
    echo 💡 Pełna instrukcja w: DOSTEP_ZEWNETRZNY.md
    echo    Full guide at: PUBLIC_ACCESS.md
    echo.
    pause
    exit /b 1
)

REM Sprawdź czy plik konfiguracyjny istnieje
if not exist "cloudflared-config.yml" (
    echo ❌ BŁĄD: cloudflared-config.yml nie został znaleziony!
    echo    ERROR: cloudflared-config.yml not found!
    echo.
    echo 📝 Musisz najpierw utworzyć tunel i plik konfiguracyjny.
    echo    You need to create tunnel and config file first.
    echo.
    echo 🔧 Uruchom te komendy:
    echo    Run these commands:
    echo    cloudflared.exe tunnel login
    echo    cloudflared.exe tunnel create moja-aplikacja
    echo.
    echo 📖 Zobacz instrukcje w: DOSTEP_ZEWNETRZNY.md
    echo    See instructions in: PUBLIC_ACCESS.md
    echo.
    pause
    exit /b 1
)

REM Sprawdź czy Docker działa
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ BŁĄD: Docker nie działa!
    echo    ERROR: Docker is not running!
    echo.
    echo 🐳 Uruchom Docker Desktop i spróbuj ponownie.
    echo    Start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo ✅ Wszystkie wymagania spełnione!
echo    All requirements met!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo [1/3] 🐳 Uruchamianie aplikacji...
echo       Starting application...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ❌ Błąd uruchamiania aplikacji!
    echo    Application startup failed!
    pause
    exit /b 1
)

echo.
echo [2/3] ⏳ Czekanie na inicjalizację (20 sekund)...
echo       Waiting for initialization (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo [3/3] 🚀 Uruchamianie tunelu Cloudflare...
echo       Starting Cloudflare tunnel...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✅ GOTOWE! Application is now PUBLIC!
echo.
echo 📋 INSTRUKCJE DLA CIEBIE:
echo    INSTRUCTIONS FOR YOU:
echo.
echo    1️⃣  Twój stały link to:
echo       Your permanent link is:
echo       https://moja-aplikacja.trycloudflare.com (lub Twoja domena)
echo       https://my-app.trycloudflare.com (or your domain)
echo.
echo    2️⃣  Wyślij ten link użytkownikom przez email/SMS/chat
echo       Send this link to users via email/SMS/chat
echo.
echo    3️⃣  Użytkownicy TYLKO KLIKAJĄ LINK i aplikacja działa!
echo       Users JUST CLICK THE LINK and the app works!
echo.
echo 💡 ZALETA: Link NIE ZMIENIA SIĘ przy każdym uruchomieniu!
echo    BENEFIT: Link DOESN'T CHANGE every time you restart!
echo.
echo 🛑 Aby zatrzymać: Naciśnij Ctrl+C w tym oknie
echo    To stop: Press Ctrl+C in this window
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Uruchom Cloudflare Tunnel
cloudflared.exe tunnel --config cloudflared-config.yml run arkuszowniasmb
    echo.
    echo 📥 Pobierz ngrok z: https://ngrok.com/download
    echo    Download ngrok from: https://ngrok.com/download
    echo.
    echo 📁 Wypakuj ngrok.exe do tego folderu:
    echo    Extract ngrok.exe to this folder:
    echo    %CD%
    echo.
    echo 🔑 Następnie uruchom:
    echo    Then run:
    echo    ngrok.exe config add-authtoken TWOJ_TOKEN
    echo.
    echo 💡 Token znajdziesz na: https://dashboard.ngrok.com/get-started/your-authtoken
    echo    Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken
    echo.
    pause
    exit /b 1
)

REM Sprawdź czy Docker działa
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ BŁĄD: Docker nie działa!
    echo    ERROR: Docker is not running!
    echo.
    echo 🐳 Uruchom Docker Desktop i spróbuj ponownie.
    echo    Start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo ✅ Wszystkie wymagania spełnione!
echo    All requirements met!
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo [1/3] 🐳 Uruchamianie aplikacji...
echo       Starting application...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ❌ Błąd uruchamiania aplikacji!
    echo    Application startup failed!
    pause
    exit /b 1
)

echo.
echo [2/3] ⏳ Czekanie na inicjalizację (20 sekund)...
echo       Waiting for initialization (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo [3/3] 🚀 Uruchamianie tunelu ngrok...
echo       Starting ngrok tunnel...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✅ GOTOWE! Application is now PUBLIC!
echo.
echo 📋 INSTRUKCJE DLA CIEBIE:
echo    INSTRUCTIONS FOR YOU:
echo.
echo    1️⃣  W oknie poniżej znajdź linię:
echo       In the window below, find the line:
echo       "Forwarding    https://XXXXX.ngrok-free.app -> ..."
echo.
echo    2️⃣  Skopiuj link HTTPS (np. https://a1b2c3.ngrok-free.app)
echo       Copy the HTTPS link (e.g., https://a1b2c3.ngrok-free.app)
echo.
echo    3️⃣  Wyślij ten link użytkownikom przez email/SMS/chat
echo       Send this link to users via email/SMS/chat
echo.
echo    4️⃣  Użytkownicy TYLKO KLIKAJĄ LINK i aplikacja działa!
echo       Users JUST CLICK THE LINK and the app works!
echo.
echo 💡 UWAGA: Przy pierwszym użyciu ngrok pokaże ekran informacyjny
echo    NOTE:  First time, ngrok will show an info screen
echo           - użytkownicy muszą kliknąć "Visit Site"
echo           - users need to click "Visit Site"
echo.
echo 🛑 Aby zatrzymać: Naciśnij Ctrl+C w tym oknie
echo    To stop: Press Ctrl+C in this window
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Uruchom ngrok
ngrok http 80

