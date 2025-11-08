@echo off
REM Install cloudflared as a Windows service for a permanent tunnel
setlocal
cd /d %~dp0

REM Ensure cloudflared.exe exists
if not exist cloudflared.exe (
  echo ERROR: cloudflared.exe not found in %cd%
  echo Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  exit /b 1
)

REM Stop and delete any existing service
sc stop cloudflared >nul 2>&1
sc delete cloudflared >nul 2>&1

REM Install service bound to our config
cloudflared.exe service install cloudflared-config.yml
if errorlevel 1 (
  echo ERROR: Failed to install service. Trying manual sc create...
  sc create cloudflared binPath= "%cd%\cloudflared.exe --config %cd%\cloudflared-config.yml tunnel run" start= auto
)

sc start cloudflared
sc query cloudflared

echo.
echo If the service is RUNNING, your permanent tunnel is active.
echo Ensure DNS is configured (CNAME -> 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com)
echo.
echo To uninstall:
echo   sc stop cloudflared & sc delete cloudflared
exit /b 0

