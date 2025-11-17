@echo off
REM Add Node.js to PATH first
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0..\frontend"
npm install
npm run dev -- --host 0.0.0.0

