@echo off
echo ========================================
echo Docker Diagnostic Tool
echo ========================================
echo.

echo [1] Checking if Docker Desktop is running...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ Docker Desktop is running
) else (
    echo ✗ Docker Desktop is NOT running
    echo.
    echo Please start Docker Desktop and try again.
    echo Location: Start Menu ^> Docker Desktop
    pause
    exit /b 1
)

echo.
echo [2] Checking Docker version...
docker --version
if errorlevel 1 (
    echo ✗ Docker command failed
    pause
    exit /b 1
)

echo.
echo [3] Listing all containers...
docker ps -a

echo.
echo [4] Checking Docker Compose services...
docker compose ps -a

echo.
echo [5] Checking Docker networks...
docker network ls

echo.
echo [6] Checking Docker volumes...
docker volume ls

echo.
echo ========================================
echo Diagnostic Complete
echo ========================================
pause

