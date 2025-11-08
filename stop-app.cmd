@echo off
echo Stopping ArkuszowniaSMB application...
echo Timestamp: %date% %time%
echo.

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Log file with timestamp
set LOGFILE=logs\shutdown_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOGFILE=%LOGFILE: =0%

echo Stopping application > %LOGFILE%
echo Timestamp: %date% %time% >> %LOGFILE%

REM Stop Cloudflare tunnel
echo Stopping Cloudflare tunnel...
taskkill /F /IM cloudflared.exe 2>nul
if errorlevel 1 (
    echo WARNING: No Cloudflare tunnel was running >> %LOGFILE%
) else (
    echo Successfully stopped Cloudflare tunnel >> %LOGFILE%
)

REM Stop Docker containers
echo Stopping Docker containers...
docker-compose down -v >> %LOGFILE% 2>&1
if errorlevel 1 (
    echo ERROR: Failed to stop containers! >> %LOGFILE%
    echo ERROR: Failed to stop containers!
    type %LOGFILE%
    pause
    exit /b 1
)

echo.
echo Application stopped successfully.
echo Log file: %LOGFILE%
echo.
pause
