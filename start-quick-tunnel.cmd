@echo off
REM Quick launcher that delegates to PowerShell script for robust URL extraction
setlocal
cd /d %~dp0

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0quick-tunnel.ps1"
exit /b %errorlevel%
