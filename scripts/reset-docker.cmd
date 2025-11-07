@echo off
REM Complete Docker and App Reset Script
echo ========================================
echo SMB Tool - Complete Reset
echo ========================================
echo.

echo [1/7] Cleaning local node_modules (if exists)...
if exist frontend\node_modules (
    echo Removing frontend\node_modules...
    rmdir /s /q frontend\node_modules 2>nul
)

echo.
echo [2/7] Stopping all containers...
docker compose down -v
if errorlevel 1 (
    echo Warning: docker compose down failed or no containers running
)

echo.
echo [3/7] Cleaning Docker system...
docker system prune -f
if errorlevel 1 (
    echo Warning: docker system prune failed
)

echo.
echo [4/7] Removing old images...
docker rmi pycharmmiscproject-backend pycharmmiscproject-frontend 2>nul
if errorlevel 1 (
    echo Note: Some images may not exist yet
)

echo.
echo [5/7] Rebuilding images (no cache)...
docker compose build --no-cache
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [6/7] Starting services...
docker compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services!
    pause
    exit /b 1
)

echo.
echo [7/7] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo Reset Complete!
echo ========================================
echo.
echo Services should be available at:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:8000
echo   - API Docs: http://localhost:8000/docs
echo.
echo Checking service status...
docker compose ps
echo.
echo To view logs: docker compose logs -f
echo To stop: docker compose down
echo.
pause
