@echo off
echo Checking application health...
echo.

REM Check Frontend (nginx)
echo Checking Frontend...
curl -s -f http://localhost:80/healthz >nul 2>&1
if %errorlevel% equ 0 (
    echo [32mFrontend OK[0m
) else (
    echo [31mFrontend FAILED[0m
)

REM Check Backend
echo Checking Backend...
curl -s -f http://localhost:8080/healthz >nul 2>&1
if %errorlevel% equ 0 (
    echo [32mBackend OK[0m
) else (
    echo [31mBackend FAILED[0m
)

REM Check Frontend Dev Server
echo Checking Frontend Dev Server...
curl -s -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [32mFrontend Dev Server OK[0m
) else (
    echo [31mFrontend Dev Server FAILED[0m
)

echo.
echo Health check complete!
pause
