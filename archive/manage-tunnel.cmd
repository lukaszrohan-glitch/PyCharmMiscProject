@echo off
REM Cloudflare Tunnel Management Script for arkuszowniasmb.pl

echo ======================================
echo Cloudflare Tunnel Manager
echo ======================================
echo.

:menu
echo 1. Start Tunnel
echo 2. Stop Tunnel
echo 3. Check Status
echo 4. View Logs
echo 5. Exit
echo.
set /p choice="Choose an option (1-5): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto end
goto menu

:start
echo.
echo Starting Cloudflare Tunnel for arkuszowniasmb.pl...
start /min powershell -NoExit -Command "cd '%~dp0'; .\cloudflared.exe tunnel --config cloudflared-config-pl.yml run"
timeout /t 5 /nobreak >nul
echo Tunnel started!
echo.
pause
goto menu

:stop
echo.
echo Stopping Cloudflare Tunnel...
taskkill /IM cloudflared.exe /F 2>nul
if %errorlevel%==0 (
    echo Tunnel stopped successfully!
) else (
    echo No tunnel process found.
)
echo.
pause
goto menu

:status
echo.
echo Checking tunnel status...
echo.
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>nul | find /I /N "cloudflared.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo [RUNNING] Cloudflare tunnel is ACTIVE
    echo.
    tasklist /FI "IMAGENAME eq cloudflared.exe"
) else (
    echo [STOPPED] Cloudflare tunnel is NOT running
)
echo.
pause
goto menu

:logs
echo.
echo Recent tunnel logs:
echo.
if exist tunnel-error.log (
    powershell -Command "Get-Content tunnel-error.log -Tail 30"
) else (
    echo No log file found.
)
echo.
pause
goto menu

:end
echo.
echo Exiting...
exit

