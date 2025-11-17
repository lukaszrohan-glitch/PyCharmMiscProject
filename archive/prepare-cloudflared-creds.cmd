@echo off
REM Prepare credentials for cloudflared Windows service (copy to ProgramData)
setlocal
cd /d %~dp0

set SRC=C:\Users\lukas\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json
set DESTDIR=C:\ProgramData\Cloudflare\cloudflared
set DEST=%DESTDIR%\9320212e-f379-4261-8777-f9623823beee.json

if not exist "%SRC%" (
  echo ERROR: Source credentials not found: %SRC%
  echo Run: cloudflared.exe tunnel login  and select the correct account, or provide the JSON manually.
  exit /b 1
)

if not exist "%DESTDIR%" mkdir "%DESTDIR%"

copy /Y "%SRC%" "%DEST%" >nul
if errorlevel 1 (
  echo ERROR: Failed to copy to %DEST% (run as Administrator if access denied)
  exit /b 2
)

icacls "%DESTDIR%" /grant "NT AUTHORITY\SYSTEM":(OI)(CI)RX >nul 2>&1
icacls "%DEST%" /grant "NT AUTHORITY\SYSTEM":R >nul 2>&1

echo Credentials copied to: %DEST%
echo You can now run install-cloudflared-service.cmd (as Administrator).
exit /b 0

