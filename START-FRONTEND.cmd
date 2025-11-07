@echo off
echo Adding Node.js to PATH...
set "PATH=C:\Program Files\nodejs;%PATH%"

echo.
echo Starting Vite dev server...
echo.
cd /d "%~dp0..\frontend"
npm run dev -- --host 0.0.0.0

pause

