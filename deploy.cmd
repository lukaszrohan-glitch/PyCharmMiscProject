echo.
echo If you see any errors, please check:
echo 1. Docker container logs: docker-compose logs
echo 2. Nginx logs: logs/nginx/error.log
echo 3. Cloudflare tunnel status: cloudflared tunnel info
echo.
echo To view logs in real-time: docker-compose logs -f
echo.
pause
@echo off
echo Setting up ArkuszowniaSMB deployment...

REM Check Docker
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running! Please start Docker Desktop.
    pause
    exit /b 1
)

REM Create necessary directories
echo Creating directories...
mkdir logs 2>nul
mkdir logs\nginx 2>nul
mkdir logs\cloudflared 2>nul
mkdir ssl 2>nul

REM Check if .env exists
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo Please update the .env file with your Cloudflare credentials!
    notepad .env
)

REM Install cloudflared if not present
if not exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
    echo Installing cloudflared...
    powershell -Command "Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile cloudflared.exe"
)

REM Login to Cloudflare if not already logged in
echo Checking Cloudflare credentials...
cloudflared tunnel login

REM Create tunnel if it doesn't exist
echo Creating Cloudflare tunnel...
for /f %%i in ('cloudflared tunnel list ^| find "arkuszowniasmb"') do set TUNNEL_EXISTS=1
if not defined TUNNEL_EXISTS (
    cloudflared tunnel create arkuszowniasmb
    for /f "tokens=1" %%a in ('cloudflared tunnel list ^| find "arkuszowniasmb"') do set TUNNEL_ID=%%a
    echo TUNNEL_ID=%TUNNEL_ID% >> .env
)

REM Configure DNS
echo Configuring DNS records...
cloudflared tunnel route dns arkuszowniasmb arkuszowniasmb.pl
cloudflared tunnel route dns arkuszowniasmb www.arkuszowniasmb.pl

REM Build and start services
echo Starting services...
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

REM Check service health
echo Checking service health...
timeout /t 10 /nobreak
docker-compose ps

echo.
echo Deployment complete! The site should be accessible at:
echo - https://arkuszowniasmb.pl
